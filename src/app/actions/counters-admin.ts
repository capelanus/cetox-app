'use server'

import { prisma } from '@/lib/prisma'
import { requireRol, type Rol } from '@/lib/roles'
import { audit } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { labPorArea, ROLES_ADMIN_COUNTERS } from '@/lib/counters'

// Administración de los counters: cuentas de tablet (rol COUNTER, una por
// laboratorio) y PIN con el que cada persona firma en ellos.
//
// Las acciones devuelven { ok, error } en vez de lanzar: en producción Next
// oculta el mensaje de los errores lanzados en server actions, y aquí el
// mensaje ("ese PIN ya lo usa otra persona", "ya hay cuenta") es la ayuda.

const RUTA = '/administracion/counters'

export type Resultado<T = object> = ({ ok: true } & T) | { ok: false; error: string }

class AdminError extends Error {}

async function conResultado<T extends object>(fn: () => Promise<T>): Promise<Resultado<T>> {
  try {
    return { ok: true, ...(await fn()) }
  } catch (e) {
    if (e instanceof AdminError) return { ok: false, error: e.message }
    console.error('[counters-admin]', e)
    return { ok: false, error: 'No se pudo completar la operación. Inténtalo de nuevo.' }
  }
}

async function sesionAdmin() {
  return requireRol(ROLES_ADMIN_COUNTERS as Rol[])
}

// ── Cuentas de tablet ─────────────────────────────────────────────────────────

export async function crearCuentaCounter(formData: FormData): Promise<Resultado<{ email: string }>> {
  return conResultado(async () => {
    const session = await sesionAdmin()
    const area = String(formData.get('area') ?? '')
    const email = String(formData.get('email') ?? '').trim().toLowerCase()
    const nombre = String(formData.get('nombre') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    const lab = labPorArea(area)
    if (!lab) throw new AdminError('Laboratorio no válido.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AdminError('Correo no válido.')
    if (password.length < 8) throw new AdminError('La contraseña debe tener al menos 8 caracteres.')

    const existe = await prisma.usuario.findUnique({ where: { email }, select: { id: true } })
    if (existe) throw new AdminError('Ya hay un usuario con ese correo.')
    const yaHay = await prisma.usuario.findFirst({ where: { rol: 'COUNTER', area }, select: { email: true } })
    if (yaHay) throw new AdminError(`El counter de ${lab.nombre} ya tiene cuenta (${yaHay.email}). Edítala en vez de crear otra.`)

    const { hash } = await import('bcryptjs')
    const cuenta = await prisma.usuario.create({
      data: {
        email,
        nombre: nombre || `Tablet Counter ${lab.nombre}`,
        rol: 'COUNTER',
        area,
        activo: true,
        passwordHash: await hash(password, 10),
      },
      select: { id: true, email: true },
    })
    await audit({ accion: 'CREATE', entidad: 'Usuario', entidadId: cuenta.id, detalle: { descripcion: `Cuenta de counter ${lab.nombre} creada (${cuenta.email}) por ${session.user.name ?? session.user.email}` } })
    revalidatePath(RUTA)
    return { email: cuenta.email }
  })
}

async function cuentaCounterOFalla(usuarioId: string) {
  const u = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { id: true, rol: true, email: true, area: true } })
  // Solo cuentas de tablet: esta pantalla nunca toca la contraseña de una persona.
  if (!u || u.rol !== 'COUNTER') throw new AdminError('Esa cuenta no es de un counter.')
  return u
}

export async function cambiarPasswordCounter(usuarioId: string, password: string): Promise<Resultado> {
  return conResultado(async () => {
    const session = await sesionAdmin()
    if (password.length < 8) throw new AdminError('La contraseña debe tener al menos 8 caracteres.')
    const u = await cuentaCounterOFalla(usuarioId)
    const { hash } = await import('bcryptjs')
    await prisma.usuario.update({ where: { id: u.id }, data: { passwordHash: await hash(password, 10) } })
    await audit({ accion: 'UPDATE', entidad: 'Usuario', entidadId: u.id, detalle: { descripcion: `Contraseña del counter ${u.email} cambiada por ${session.user.name ?? session.user.email}` } })
    revalidatePath(RUTA)
    return {}
  })
}

export async function toggleCuentaCounter(usuarioId: string, activo: boolean): Promise<Resultado> {
  return conResultado(async () => {
    const session = await sesionAdmin()
    const u = await cuentaCounterOFalla(usuarioId)
    await prisma.usuario.update({ where: { id: u.id }, data: { activo } })
    await audit({ accion: 'UPDATE', entidad: 'Usuario', entidadId: u.id, detalle: { descripcion: `Counter ${u.email} ${activo ? 'activado' : 'desactivado'} por ${session.user.name ?? session.user.email}` } })
    revalidatePath(RUTA)
    revalidatePath('/gerencia/accesos')
    return {}
  })
}

// ── PIN del personal ──────────────────────────────────────────────────────────
// Se guarda con hash igual que la contraseña, y debe ser distinto al de
// cualquier otra persona: en la tablet el PIN es lo único que identifica al
// que firma.

export async function asignarPin(usuarioId: string, pin: string): Promise<Resultado<{ nombre: string }>> {
  return conResultado(async () => {
    const session = await sesionAdmin()
    if (!/^\d{4}$/.test(pin)) throw new AdminError('El PIN debe tener exactamente 4 dígitos')

    const objetivo = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { id: true, nombre: true, rol: true } })
    if (!objetivo) throw new AdminError('Usuario no encontrado')
    if (objetivo.rol === 'COUNTER') throw new AdminError('Las cuentas de tablet no firman; el PIN es de las personas.')

    const { compare, hash } = await import('bcryptjs')
    const otros = await prisma.usuario.findMany({
      where: { id: { not: usuarioId }, pinHash: { not: null } },
      select: { pinHash: true },
    })
    for (const o of otros) {
      if (o.pinHash && (await compare(pin, o.pinHash))) {
        throw new AdminError('Ese PIN ya lo usa otra persona; elige otro')
      }
    }

    await prisma.usuario.update({ where: { id: usuarioId }, data: { pinHash: await hash(pin, 10) } })
    await audit({ accion: 'UPDATE', entidad: 'Usuario', entidadId: usuarioId, detalle: { descripcion: `PIN de counter asignado a ${objetivo.nombre} por ${session.user.name ?? session.user.email}` } })
    revalidatePath(RUTA)
    revalidatePath('/gerencia/accesos')
    return { nombre: objetivo.nombre }
  })
}

export async function quitarPin(usuarioId: string): Promise<Resultado<{ nombre: string }>> {
  return conResultado(async () => {
    const session = await sesionAdmin()
    const u = await prisma.usuario.update({ where: { id: usuarioId }, data: { pinHash: null }, select: { nombre: true } })
    await audit({ accion: 'UPDATE', entidad: 'Usuario', entidadId: usuarioId, detalle: { descripcion: `PIN de counter retirado a ${u.nombre} por ${session.user.name ?? session.user.email}` } })
    revalidatePath(RUTA)
    revalidatePath('/gerencia/accesos')
    return { nombre: u.nombre }
  })
}
