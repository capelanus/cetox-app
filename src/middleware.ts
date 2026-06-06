import { NextRequest, NextResponse } from 'next/server'

// ── In-memory token-bucket rate limiter ──────────────────────────────────────
// Single-instance deployment (1 replica), so a process-local map is fine.
// For a multi-instance setup, swap to Redis/Upstash.

interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

function ipFromRequest(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}

function hit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number; retryAfter: number } {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfter: 0 }
  }
  b.count += 1
  if (b.count > limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((b.resetAt - now) / 1000) }
  }
  return { ok: true, remaining: limit - b.count, retryAfter: 0 }
}

// Periodic cleanup so the map doesn't grow without bound
let lastSweep = 0
function sweep() {
  const now = Date.now()
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
}

// ── Rate-limit rules ─────────────────────────────────────────────────────────
const RULES: Array<{ match: (path: string) => boolean; limit: number; windowMs: number; label: string }> = [
  // Login attempts: 10 per 5 min per IP
  {
    match: (p) => p.startsWith('/api/auth/callback/'),
    limit: 10, windowMs: 5 * 60_000, label: 'auth',
  },
  // Public validation portal: 30 per minute per IP
  {
    match: (p) => p.startsWith('/api/validation/'),
    limit: 30, windowMs: 60_000, label: 'validation',
  },
]

export function middleware(req: NextRequest) {
  sweep()
  const path = req.nextUrl.pathname

  for (const r of RULES) {
    if (!r.match(path)) continue
    const key = `${r.label}:${ipFromRequest(req)}`
    const { ok, remaining, retryAfter } = hit(key, r.limit, r.windowMs)
    if (!ok) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests', retryAfter }),
        {
          status: 429,
          headers: {
            'Content-Type':         'application/json',
            'Retry-After':          String(retryAfter),
            'X-RateLimit-Limit':    String(r.limit),
            'X-RateLimit-Remaining': '0',
          },
        },
      )
    }
    const res = NextResponse.next()
    res.headers.set('X-RateLimit-Limit',     String(r.limit))
    res.headers.set('X-RateLimit-Remaining', String(remaining))
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/auth/:path*', '/api/validation/:path*'],
}
