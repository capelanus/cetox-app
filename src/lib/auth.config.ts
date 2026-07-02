import type { NextAuthConfig } from 'next-auth'

// Edge-compatible auth config (no database access)
export const authConfig: NextAuthConfig = {
  pages: { signIn: '/login' },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const { pathname } = request.nextUrl
      const isPublic =
        pathname.startsWith('/login') ||
        pathname.startsWith('/validation') ||
        pathname.startsWith('/sugerencias') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/validation') ||
        pathname.startsWith('/api/asistencia/sync')

      if (isPublic) return true
      if (!isLoggedIn) return false
      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.rol = (user as Record<string, unknown>).rol as string
        token.area = (user as Record<string, unknown>).area as string | null
        token.userId = user.id
      }
      return token
    },
    session({ session, token }) {
      session.user.rol = token.rol as string
      session.user.area = (token.area as string | null) ?? null
      session.user.id = token.userId as string
      return session
    },
  },
  providers: [], // providers added in auth.ts
}
