'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { audit } from '@/lib/audit'

// Roles que los gerentes pueden controlar
const ROLES_CONTROLABLES = ['ADMINISTRACION', 'JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA', 'ANALISTA', 'COUNTER_QUIMICA']

// Roles que tienen permiso para ejecutar esta acción
const ROLES_GERENCIA = ['DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION', 'GERENTE_TECNICO', 'SUPER_ADMIN']

export async function toggleAccesoUsuario(usuarioId: string, nuevoEstado: boolean) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  // Solo gerentes pueden hacer esto
  if (!ROLES_GERENCIA.includes(session.user.rol)) {
    throw new Error('No tienes permisos para realizar esta acción')
  }

  // Verificar que el usuario objetivo existe y su rol es controlable
  const objetivo = await prisma.usuario.findUnique({
    where:  { id: usuarioId },
    select: { id: true, nombre: true, rol: true, activo: true, email: true },
  })

  if (!objetivo) throw new Error('Usuario no encontrado')

  // No se puede controlar el propio acceso
  if (objetivo.id === session.user.id) {
    throw new Error('No puedes modificar tu propio acceso')
  }

  // Solo se pueden controlar los roles designados
  if (!ROLES_CONTROLABLES.includes(objetivo.rol)) {
    throw new Error(`No tienes permiso para controlar usuarios con rol ${objetivo.rol}`)
  }

  await prisma.usuario.update({
    where: { id: usuarioId },
    data:  { activo: nuevoEstado },
  })

  await audit({
    accion:    'UPDATE',
    entidad:   'Usuario',
    entidadId: usuarioId,
    detalle: {
      activo: { antes: objetivo.activo, despues: nuevoEstado },
      accion: nuevoEstado ? 'Acceso reactivado' : 'Acceso desactivado',
    },
  })

  revalidatePath('/gerencia/accesos')
  return { ok: true, nombre: objetivo.nombre }
}

// ── PIN de firma para el counter ──────────────────────────────────────────────
// Lo asigna gerencia desde Control de Accesos. Se guarda con hash igual que la
// contraseña, y debe ser distinto al de cualquier otra persona: en la tablet el
// PIN es lo único que identifica al que firma.

export async function asignarPin(usuarioId: string, pin: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')
  if (!ROLES_GERENCIA.includes(session.user.rol)) throw new Error('No tienes permisos para realizar esta acción')
  if (!/^\d{4}$/.test(pin)) throw new Error('El PIN debe tener exactamente 4 dígitos')

  const objetivo = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { id: true, nombre: true } })
  if (!objetivo) throw new Error('Usuario no encontrado')

  const { compare, hash } = await import('bcryptjs')
  const otros = await prisma.usuario.findMany({
    where: { id: { not: usuarioId }, pinHash: { not: null } },
    select: { pinHash: true },
  })
  for (const o of otros) {
    if (o.pinHash && (await compare(pin, o.pinHash))) {
      throw new Error('Ese PIN ya lo usa otra persona; elige otro')
    }
  }

  await prisma.usuario.update({ where: { id: usuarioId }, data: { pinHash: await hash(pin, 10) } })
  await audit({ accion: 'UPDATE', entidad: 'Usuario', entidadId: usuarioId, detalle: { descripcion: `PIN de counter asignado a ${objetivo.nombre}` } })
  revalidatePath('/gerencia/accesos')
  return { nombre: objetivo.nombre }
}

export async function quitarPin(usuarioId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')
  if (!ROLES_GERENCIA.includes(session.user.rol)) throw new Error('No tienes permisos para realizar esta acción')
  const u = await prisma.usuario.update({ where: { id: usuarioId }, data: { pinHash: null }, select: { nombre: true } })
  await audit({ accion: 'UPDATE', entidad: 'Usuario', entidadId: usuarioId, detalle: { descripcion: `PIN de counter retirado a ${u.nombre}` } })
  revalidatePath('/gerencia/accesos')
  return { nombre: u.nombre }
}
