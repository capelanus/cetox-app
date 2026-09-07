import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'node:crypto'

// Sesión del Portal del Cliente: cookie firmada (HMAC), independiente de la
// sesión de NextAuth usada por el personal interno (Usuario). Un cliente
// nunca debe poder autenticarse como si fuera un Usuario interno, y viceversa.

const COOKIE_NAME = 'cetox_portal_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 días

export interface PortalSession {
  clienteId: string
  razonSocial: string
}

function secret(): string {
  const s = process.env.AUTH_SECRET
  if (!s) throw new Error('AUTH_SECRET no está configurado')
  return s
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

function encode(data: PortalSession): string {
  const payload = Buffer.from(JSON.stringify(data), 'utf8').toString('base64url')
  return `${payload}.${sign(payload)}`
}

function decode(token: string | undefined): PortalSession | null {
  if (!token) return null
  const dot = token.lastIndexOf('.')
  if (dot < 0) return null
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = sign(payload)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as PortalSession
  } catch {
    return null
  }
}

export async function getPortalSession(): Promise<PortalSession | null> {
  const store = await cookies()
  return decode(store.get(COOKIE_NAME)?.value)
}

export async function setPortalSession(data: PortalSession): Promise<void> {
  const store = await cookies()
  store.set(COOKIE_NAME, encode(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function clearPortalSession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}
