import { auth } from '@/lib/auth'
import { NextResponse, type NextRequest } from 'next/server'

// ── In-memory token-bucket rate limiter ──────────────────────────────────────
// Single-instance deployment (1 replica), so a process-local map is fine.
// For multi-instance, swap to Redis/Upstash.

interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

function ipOf(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

function hit(key: string, limit: number, windowMs: number) {
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

let lastSweep = 0
function sweep() {
  const now = Date.now()
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
}

const RULES = [
  { match: (p: string) => p.startsWith('/api/auth/callback/'), limit: 10, windowMs: 5 * 60_000, label: 'auth' },
  { match: (p: string) => p.startsWith('/api/validation/'),    limit: 30, windowMs: 60_000,     label: 'validation' },
]

// Routes whose responses must be embeddable in a same-origin <iframe>
const EMBEDDABLE_PREFIXES = ['/api/informes/', '/api/documentos-calidad/']

// ── Proxy: rate-limit first, then NextAuth's authorized callback ────────────

export default auth((req) => {
  sweep()
  const path = req.nextUrl.pathname

  for (const r of RULES) {
    if (!r.match(path)) continue
    const key = `${r.label}:${ipOf(req)}`
    const { ok, remaining, retryAfter } = hit(key, r.limit, r.windowMs)
    if (!ok) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests', retryAfter }),
        {
          status: 429,
          headers: {
            'Content-Type':          'application/json',
            'Retry-After':           String(retryAfter),
            'X-RateLimit-Limit':     String(r.limit),
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

  // Set X-Frame-Options per route so there's only one value (no stacking with headers() config)
  const embeddable = EMBEDDABLE_PREFIXES.some(p => path.startsWith(p))
  const res = NextResponse.next()
  res.headers.set('X-Frame-Options', embeddable ? 'SAMEORIGIN' : 'DENY')
  return res
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
