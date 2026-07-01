import { NextRequest, NextResponse } from 'next/server'

// Routes that must be embeddable inside a same-origin <iframe>
const EMBEDDABLE = [
  '/api/informes/',       // ver-informe PDF proxy
  '/api/documentos-calidad/', // documentos calidad PDF proxy
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  const embeddable = EMBEDDABLE.some(prefix => pathname.startsWith(prefix))
  response.headers.set('X-Frame-Options', embeddable ? 'SAMEORIGIN' : 'DENY')

  return response
}

export const config = {
  // Run on all paths except Next.js internals and static assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
