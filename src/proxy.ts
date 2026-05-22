import { NextRequest, NextResponse } from 'next/server'

// Optimistic check: verify the NextAuth session cookie exists (JWT validation)
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublic =
    pathname.startsWith('/login') ||
    pathname.startsWith('/validation') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/validation') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'

  if (isPublic) return NextResponse.next()

  // Check for session cookie (NextAuth stores JWT here)
  const sessionCookie =
    req.cookies.get('authjs.session-token') ??
    req.cookies.get('next-auth.session-token') ??
    req.cookies.get('__Secure-authjs.session-token') ??
    req.cookies.get('__Secure-next-auth.session-token')

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
