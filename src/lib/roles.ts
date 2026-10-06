import { auth } from './auth'
import { prisma } from './prisma'
import { redirect } from 'next/navigation'
import { ROL_LABELS } from './constants'

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
  // Cuenta fija de la tablet de un mostrador de laboratorio: solo abre su
  // counter; el área de la cuenta (Q/B/M) dice cuál.
  | 'COUNTER'

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
    if (rol === 'COUNTER') {
      const slug = ({ Q: 'quimica', B: 'biologia', M: 'microbiologia' } as Record<string, string>)[session.user.area ?? ''] ?? 'quimica'
      redirect(`/counter/${slug}`)
    }
    // Un rol que el código no conoce (p. ej. una cookie con un nombre de rol
    // ya renombrado) no puede caer en /dashboard: esa página también pasa por
    // aquí y se formaría un bucle de redirecciones. Se le pide volver a entrar.
    if (!(rol in ROL_LABELS)) redirect('/login')
    redirect('/dashboard')
  }
  const email = session.user.email
  if (email) {
    const dbUser = await prisma.usuario.findUnique({ where: { email }, select: { id: true } })
    if (dbUser) session.user.id = dbUser.id
  }
  return session
}

/**
 * Igual que requireRol, pero además respeta los módulos bloqueados del usuario.
 * Permite que dos personas con el mismo rol vean menús distintos sin tener que
 * crear un rol por persona. `modulo` es el prefijo de ruta, p.ej. '/rrhh'.
 */
export async function requireModulo(modulo: string, roles: Rol[]) {
  const session = await requireRol(roles)
  if (session.user.rol === 'SUPER_ADMIN') return session

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: { modulosBloqueados: true },
  })
  if (moduloBloqueado(usuario?.modulosBloqueados ?? [], modulo)) redirect('/dashboard')
  return session
}

/** Un bloqueo de '/rrhh' también cubre '/rrhh/personal' y demás subrutas. */
export function moduloBloqueado(bloqueados: string[], ruta: string): boolean {
  return bloqueados.some(b => ruta === b || ruta.startsWith(`${b}/`))
}

/**
 * Versión para server actions: el layout ya bloquea las páginas, pero una
 * acción se puede invocar sin pasar por ellas. Lanza en vez de redirigir.
 */
export async function assertModuloPermitido(usuarioId: string, modulo: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { rol: true, modulosBloqueados: true },
  })
  if (!usuario || usuario.rol === 'SUPER_ADMIN') return
  if (moduloBloqueado(usuario.modulosBloqueados, modulo)) {
    throw new Error('No tienes acceso a este módulo.')
  }
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
