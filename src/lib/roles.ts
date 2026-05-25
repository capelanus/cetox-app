import { auth } from './auth'
import { redirect } from 'next/navigation'

export type Rol = 'GERENTE_TECNICO' | 'DIRECTOR_CALIDAD' | 'ADMINISTRACION' | 'ANALISTA' | 'SUPER_ADMIN'

export async function requireRol(roles: Rol[]) {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.rol === 'SUPER_ADMIN') return session
  if (!roles.includes(session.user.rol as Rol)) {
    redirect(session.user.rol === 'ANALISTA' ? '/oda' : '/dashboard')
  }
  return session
}

export async function requireNotAnalista() {
  return requireRol(['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'])
}

export async function getSession() {
  return auth()
}

export function hasRol(userRol: string, ...roles: string[]): boolean {
  if (userRol === 'SUPER_ADMIN') return true
  return roles.includes(userRol)
}

export { ROL_LABELS, AREA_LABELS } from './constants'
