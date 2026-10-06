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
      // La cookie guarda el rol del momento del login. Las sesiones abiertas
      // antes de renombrar COUNTER_QUIMICA → COUNTER siguen trayendo el nombre
      // viejo; se traduce aquí para no obligar a cerrar sesión en las tablets.
      const rolToken = token.rol as string
      session.user.rol = rolToken === 'COUNTER_QUIMICA' ? 'COUNTER' : rolToken
      session.user.area = (token.area as string | null) ?? null
      session.user.id = token.userId as string
      return session
    },
  },
  providers: [], // providers added in auth.ts
}
