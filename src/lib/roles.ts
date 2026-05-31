import { auth } from './auth'
import { prisma } from './prisma'
import { redirect } from 'next/navigation'

export type Rol =
  | 'GERENTE_GENERAL'
  | 'GERENTE_TECNICO'
  | 'DIRECTOR_CALIDAD'
  | 'DIRECTOR_ADMINISTRACION'
  | 'ADMINISTRACION'
  | 'COORDINADOR_CALIDAD'
  | 'ANALISTA'
  | 'SUPER_ADMIN'
  | 'JEFE_OPERACIONES'
  | 'ASISTENTE_LOGISTICA'

/**
 * GERENTE_GENERAL tiene exactamente los mismos permisos que GERENTE_TECNICO.
 * En vez de tocar cada requireRol() del código, expandimos la lista aquí.
 */
function expandRoles(roles: Rol[]): Rol[] {
  if (roles.includes('GERENTE_TECNICO')) return [...roles, 'GERENTE_GENERAL']
  return roles
}

export async function requireRol(roles: Rol[]) {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.rol === 'SUPER_ADMIN') return session
  if (!expandRoles(roles).includes(session.user.rol as Rol)) {
    const rol = session.user.rol
    if (rol === 'ANALISTA') redirect('/oda')
    if (rol === 'JEFE_OPERACIONES' || rol === 'ASISTENTE_LOGISTICA') redirect('/operaciones')
    redirect('/dashboard')
  }
  const email = session.user.email
  if (email) {
    const dbUser = await prisma.usuario.findUnique({ where: { email }, select: { id: true } })
    if (dbUser) session.user.id = dbUser.id
  }
  return session
}

export async function requireNotAnalista() {
  return requireRol(['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION', 'ADMINISTRACION', 'COORDINADOR_CALIDAD'])
}

export async function requireOperaciones() {
  return requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA', 'DIRECTOR_CALIDAD', 'COORDINADOR_CALIDAD'])
}

export async function getSession() {
  return auth()
}

export function hasRol(userRol: string, ...roles: string[]): boolean {
  if (userRol === 'SUPER_ADMIN') return true
  // GERENTE_GENERAL hereda todos los permisos de GERENTE_TECNICO
  if (userRol === 'GERENTE_GENERAL' && roles.includes('GERENTE_TECNICO')) return true
  return roles.includes(userRol)
}

export { ROL_LABELS, AREA_LABELS } from './constants'
