import { auth } from './auth'
import { prisma } from './prisma'
import { redirect } from 'next/navigation'

export type Rol =
  | 'GERENTE_TECNICO'
  | 'DIRECTOR_CALIDAD'
  | 'DIRECTOR_ADMINISTRACION'
  | 'ADMINISTRACION'
  | 'ANALISTA'
  | 'SUPER_ADMIN'
  | 'JEFE_OPERACIONES'
  | 'ASISTENTE_LOGISTICA'

export async function requireRol(roles: Rol[]) {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.rol === 'SUPER_ADMIN') return session
  if (!roles.includes(session.user.rol as Rol)) {
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
  return requireRol(['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION', 'ADMINISTRACION'])
}

export async function requireOperaciones() {
  return requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA', 'DIRECTOR_CALIDAD'])
}

export async function getSession() {
  return auth()
}

export function hasRol(userRol: string, ...roles: string[]): boolean {
  if (userRol === 'SUPER_ADMIN') return true
  return roles.includes(userRol)
}

export { ROL_LABELS, AREA_LABELS } from './constants'
