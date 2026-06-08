'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type TipoVacaciones = 'REGLAMENTARIA' | 'ATRASADA' | 'ADELANTADA'
export type TipoLicencia   = 'CON_GOCE' | 'SIN_GOCE' | 'MOTIVOS_PERSONALES' | 'OTROS'

export interface CrearSolicitudInput {
  cargo:           string
  departamento:    string
  jefeInmediato:   string
  diasSolicitados: string[]
  tipoVacaciones:  TipoVacaciones
  tipoLicencia:    TipoLicencia
  personaDelegada: string
  observaciones:   string
}

const ROLES_EXCLUIDOS = ['GERENTE_GENERAL', 'DIRECTOR_ADMINISTRACION']
const EMAIL_COMUNICACIONES = 'y.valeriano@cetox.com.pe'

// ── Crear solicitud ──────────────────────────────────────────────────────────

export async function crearSolicitudVacaciones(
  input: CrearSolicitudInput,
): Promise<{ id: string } | { error: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'No autenticado.' }
  if (ROLES_EXCLUIDOS.includes(session.user.rol)) return { error: 'Tu rol no puede solicitar vacaciones.' }

  if (!input.diasSolicitados || input.diasSolicitados.length === 0)
    return { error: 'Selecciona al menos un día.' }
  if (!input.cargo.trim())         return { error: 'El cargo es requerido.' }
  if (!input.departamento.trim())  return { error: 'El departamento es requerido.' }
  if (!input.jefeInmediato.trim()) return { error: 'El jefe inmediato es requerido.' }

  const solicitud = await prisma.solicitudVacaciones.create({
    data: {
      usuarioId:        session.user.id,
      cargo:            input.cargo.trim(),
      departamento:     input.departamento.trim(),
      jefeInmediato:    input.jefeInmediato.trim(),
      diasSolicitados:  JSON.stringify(input.diasSolicitados.sort()),
      tipoVacaciones:   input.tipoVacaciones,
      tipoLicencia:     input.tipoLicencia,
      personaDelegada:  input.personaDelegada.trim() || null,
      observaciones:    input.observaciones.trim() || null,
    },
  })

  // Notificar a los aprobadores asignados
  const aprobadores = await prisma.usuarioAprobadorVacaciones.findMany({
    where: { solicitanteId: session.user.id },
    select: { aprobadorId: true },
  })
  if (aprobadores.length > 0) {
    await prisma.notificacion.createMany({
      data: aprobadores.map(a => ({
        usuarioId: a.aprobadorId,
        tipo:      'VACACIONES_PENDIENTE',
        titulo:    'Nueva solicitud de vacaciones',
        mensaje:   `${session.user.name ?? 'Un empleado'} solicita ${input.diasSolicitados.length} día(s).`,
        enlace:    '/rrhh/vacaciones',
      })),
    })
  }

  revalidatePath('/vacaciones')
  revalidatePath('/rrhh/vacaciones')
  return { id: solicitud.id }
}

// ── Aprobar (jefe asignado en matriz) ────────────────────────────────────────

export async function aprobarSolicitudVacaciones(
  solicitudId: string,
): Promise<{ ok: true } | { error: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'No autenticado.' }

  const solicitud = await prisma.solicitudVacaciones.findUnique({
    where: { id: solicitudId },
    include: {
      usuario: {
        select: {
          id: true,
          nombre: true,
          empleado: { include: { vacacion: true } },
        },
      },
    },
  })
  if (!solicitud) return { error: 'Solicitud no encontrada.' }
  if (solicitud.estado !== 'PENDIENTE')
    return { error: `La solicitud ya está ${solicitud.estado.toLowerCase()}.` }

  // Validar que current user esté en la matriz de aprobadores
  const par = await prisma.usuarioAprobadorVacaciones.findUnique({
    where: { solicitanteId_aprobadorId: { solicitanteId: solicitud.usuarioId, aprobadorId: session.user.id } },
  })
  const isSuperAdmin = session.user.rol === 'SUPER_ADMIN'
  if (!par && !isSuperAdmin) return { error: 'No estás autorizado a aprobar esta solicitud.' }

  const diasAprobados = JSON.parse(solicitud.diasSolicitados).length as number
  const empleado = solicitud.usuario.empleado

  await prisma.$transaction(async (tx) => {
    await tx.solicitudVacaciones.update({
      where: { id: solicitudId },
      data:  {
        estado: 'APROBADA',
        fechaAprobacion: new Date(),
        aprobadoPorId: session.user.id,
      },
    })

    if (empleado?.vacacion) {
      const v = empleado.vacacion
      let update: { diasReglamentarios?: number; diasAtrasados?: number; adelantadasTomadas?: number } = {}
      if (solicitud.tipoVacaciones === 'REGLAMENTARIA') {
        update = { diasReglamentarios: Math.max(0, v.diasReglamentarios - diasAprobados) }
      } else if (solicitud.tipoVacaciones === 'ATRASADA') {
        update = { diasAtrasados: Math.max(0, v.diasAtrasados - diasAprobados) }
      } else if (solicitud.tipoVacaciones === 'ADELANTADA') {
        update = { adelantadasTomadas: v.adelantadasTomadas + diasAprobados }
      }
      if (Object.keys(update).length > 0) {
        await tx.vacacionBalance.update({ where: { empleadoId: empleado.id }, data: update })
      }
    }
  })

  // Notificar a Yahaida (encargada de comunicaciones)
  const comunicaciones = await prisma.usuario.findFirst({
    where: { email: EMAIL_COMUNICACIONES, activo: true },
    select: { id: true },
  })
  if (comunicaciones) {
    await prisma.notificacion.create({
      data: {
        usuarioId: comunicaciones.id,
        tipo:      'VACACIONES_APROBADAS',
        titulo:    'Vacaciones aprobadas — pendiente comunicar',
        mensaje:   `${solicitud.usuario.nombre} (${diasAprobados} día(s))`,
        enlace:    '/rrhh/vacaciones',
      },
    })
  }

  // Notificar al solicitante
  await prisma.notificacion.create({
    data: {
      usuarioId: solicitud.usuarioId,
      tipo:      'VACACIONES_APROBADAS',
      titulo:    'Tu solicitud de vacaciones fue aprobada',
      mensaje:   `${diasAprobados} día(s) — pendiente comunicación oficial.`,
      enlace:    '/vacaciones',
    },
  })

  revalidatePath('/rrhh/vacaciones')
  revalidatePath('/vacaciones')
  return { ok: true }
}

// ── Marcar como comunicada (Yahaida) ─────────────────────────────────────────

export async function marcarSolicitudComunicada(
  solicitudId: string,
): Promise<{ ok: true } | { error: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'No autenticado.' }

  const isYahaida   = session.user.email === EMAIL_COMUNICACIONES
  const isAdminFull = ['DIRECTOR_ADMINISTRACION', 'SUPER_ADMIN'].includes(session.user.rol)
  if (!isYahaida && !isAdminFull) return { error: 'Solo el área de comunicaciones puede marcar como comunicada.' }

  const solicitud = await prisma.solicitudVacaciones.findUnique({ where: { id: solicitudId } })
  if (!solicitud) return { error: 'Solicitud no encontrada.' }
  if (solicitud.estado !== 'APROBADA') return { error: 'La solicitud aún no está aprobada.' }

  await prisma.solicitudVacaciones.update({
    where: { id: solicitudId },
    data: {
      estado: 'COMUNICADA',
      fechaComunicacion: new Date(),
      comunicadoPorId: session.user.id,
    },
  })

  await prisma.notificacion.create({
    data: {
      usuarioId: solicitud.usuarioId,
      tipo:      'VACACIONES_COMUNICADAS',
      titulo:    'Vacaciones comunicadas oficialmente',
      mensaje:   `Tu solicitud quedó comunicada al equipo.`,
      enlace:    '/vacaciones',
    },
  })

  revalidatePath('/rrhh/vacaciones')
  revalidatePath('/vacaciones')
  return { ok: true }
}

// ── Rechazar (jefe asignado en matriz) ───────────────────────────────────────

export async function rechazarSolicitudVacaciones(
  solicitudId: string,
): Promise<{ ok: true } | { error: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'No autenticado.' }

  const solicitud = await prisma.solicitudVacaciones.findUnique({ where: { id: solicitudId } })
  if (!solicitud) return { error: 'Solicitud no encontrada.' }
  if (solicitud.estado !== 'PENDIENTE') return { error: 'La solicitud ya fue procesada.' }

  const par = await prisma.usuarioAprobadorVacaciones.findUnique({
    where: { solicitanteId_aprobadorId: { solicitanteId: solicitud.usuarioId, aprobadorId: session.user.id } },
  })
  const isSuperAdmin = session.user.rol === 'SUPER_ADMIN'
  if (!par && !isSuperAdmin) return { error: 'No estás autorizado a rechazar esta solicitud.' }

  await prisma.solicitudVacaciones.update({
    where: { id: solicitudId },
    data:  { estado: 'RECHAZADA' },
  })

  await prisma.notificacion.create({
    data: {
      usuarioId: solicitud.usuarioId,
      tipo:      'VACACIONES_RECHAZADAS',
      titulo:    'Tu solicitud de vacaciones fue rechazada',
      mensaje:   `Revisa con tu jefe inmediato.`,
      enlace:    '/vacaciones',
    },
  })

  revalidatePath('/rrhh/vacaciones')
  revalidatePath('/vacaciones')
  return { ok: true }
}
