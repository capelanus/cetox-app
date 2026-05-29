'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { audit } from '@/lib/audit'

// ── Flujo de estados ──────────────────────────────────────────────────────────
//
//  BORRADOR → PENDIENTE_APROBACION → APROBADO → EN_PROCESO → COMPLETADO
//                                 ↘ RECHAZADO
//
// Roles:
//  - Solicitante (cualquiera): puede enviar a PENDIENTE_APROBACION
//  - JEFE_OPERACIONES / DIRECTOR_CALIDAD: puede aprobar o rechazar
//  - JEFE_OPERACIONES: puede mover a EN_PROCESO y COMPLETADO
//

type EstadoReq = 'BORRADOR' | 'PENDIENTE_APROBACION' | 'APROBADO' | 'RECHAZADO' | 'EN_PROCESO' | 'COMPLETADO'

const TRANSICIONES: Record<EstadoReq, EstadoReq[]> = {
  BORRADOR:             ['PENDIENTE_APROBACION'],
  PENDIENTE_APROBACION: ['APROBADO', 'RECHAZADO'],
  APROBADO:             ['EN_PROCESO', 'RECHAZADO'],
  EN_PROCESO:           ['COMPLETADO'],
  RECHAZADO:            ['BORRADOR'],
  COMPLETADO:           [],
}

const ROLES_APROBACION = ['JEFE_OPERACIONES', 'DIRECTOR_CALIDAD', 'GERENTE_TECNICO']

export async function actualizarEstadoRequerimiento(
  id:            string,
  nuevoEstado:   EstadoReq,
  comentario?:   string,
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const req = await prisma.requerimiento.findUnique({ where: { id } })
  if (!req) throw new Error('Requerimiento no encontrado')

  const estadoActual = req.estado as EstadoReq
  const permitidos   = TRANSICIONES[estadoActual] ?? []

  if (!permitidos.includes(nuevoEstado)) {
    throw new Error(`Transición inválida: ${estadoActual} → ${nuevoEstado}`)
  }

  // Solo roles de aprobación pueden aprobar/rechazar
  if (['APROBADO', 'RECHAZADO'].includes(nuevoEstado)) {
    if (!ROLES_APROBACION.includes(session.user.rol)) {
      throw new Error('No tienes permiso para aprobar o rechazar')
    }
  }

  await prisma.requerimiento.update({
    where: { id },
    data:  { estado: nuevoEstado, updatedAt: new Date() },
  })

  await audit({
    accion:    'UPDATE',
    entidad:   'Requerimiento',
    entidadId: id,
    detalle:   {
      estado:     { antes: estadoActual, despues: nuevoEstado },
      comentario: comentario ?? null,
    },
  })

  revalidatePath('/operaciones/requerimientos')
  revalidatePath(`/operaciones/requerimientos/${id}`)

  return { ok: true }
}

// ── OrdenCompra approval ──────────────────────────────────────────────────────
//
//  BORRADOR → PENDIENTE_APROBACION → APROBADA → EMITIDA → RECIBIDA → CERRADA
//                                 ↘ RECHAZADA

type EstadoOC = 'BORRADOR' | 'PENDIENTE_APROBACION' | 'APROBADA' | 'RECHAZADA' | 'EMITIDA' | 'RECIBIDA' | 'CERRADA'

const TRANSICIONES_OC: Record<EstadoOC, EstadoOC[]> = {
  BORRADOR:             ['PENDIENTE_APROBACION'],
  PENDIENTE_APROBACION: ['APROBADA', 'RECHAZADA'],
  APROBADA:             ['EMITIDA', 'RECHAZADA'],
  EMITIDA:              ['RECIBIDA'],
  RECIBIDA:             ['CERRADA'],
  RECHAZADA:            ['BORRADOR'],
  CERRADA:              [],
}

export async function actualizarEstadoOrdenCompra(
  id:          string,
  nuevoEstado: EstadoOC,
  comentario?: string,
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const oc = await prisma.ordenCompra.findUnique({ where: { id } })
  if (!oc) throw new Error('Orden de compra no encontrada')

  const estadoActual = oc.estado as EstadoOC
  const permitidos   = TRANSICIONES_OC[estadoActual] ?? []

  if (!permitidos.includes(nuevoEstado)) {
    throw new Error(`Transición inválida: ${estadoActual} → ${nuevoEstado}`)
  }

  if (['APROBADA', 'RECHAZADA'].includes(nuevoEstado)) {
    if (!ROLES_APROBACION.includes(session.user.rol)) {
      throw new Error('No tienes permiso para aprobar o rechazar')
    }
  }

  await prisma.ordenCompra.update({
    where: { id },
    data:  { estado: nuevoEstado, updatedAt: new Date() },
  })

  await audit({
    accion:    'UPDATE',
    entidad:   'OrdenCompra',
    entidadId: id,
    detalle:   {
      estado:     { antes: estadoActual, despues: nuevoEstado },
      comentario: comentario ?? null,
    },
  })

  revalidatePath('/operaciones/ordenes-compra')
  revalidatePath(`/operaciones/ordenes-compra/${id}`)

  return { ok: true }
}
