'use server'

import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type TipoVacaciones = 'REGLAMENTARIA' | 'ATRASADA' | 'ADELANTADA'
export type TipoLicencia   = 'CON_GOCE' | 'SIN_GOCE' | 'MOTIVOS_PERSONALES' | 'OTROS'

export interface CrearSolicitudInput {
  cargo:           string
  departamento:    string
  jefeInmediato:   string
  diasSolicitados: string[]   // ISO date strings "YYYY-MM-DD"
  tipoVacaciones:  TipoVacaciones
  tipoLicencia:    TipoLicencia
  personaDelegada: string
  observaciones:   string
}

// ── Roles excluidos de solicitar vacaciones ────────────────────────────────────

const ROLES_EXCLUIDOS = ['GERENTE_GENERAL', 'DIRECTOR_ADMINISTRACION']

// ── Crear solicitud ────────────────────────────────────────────────────────────

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

  revalidatePath('/vacaciones')
  revalidatePath('/rrhh/vacaciones')
  return { id: solicitud.id }
}

// ── Autorizar (RRHH) ───────────────────────────────────────────────────────────

export async function autorizarSolicitudVacaciones(
  solicitudId: string,
): Promise<void> {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_ADMINISTRACION'])
  await prisma.solicitudVacaciones.update({
    where: { id: solicitudId },
    data:  { estado: 'AUTORIZADA', fechaAutorizacion: new Date() },
  })
  revalidatePath('/rrhh/vacaciones')
  revalidatePath('/vacaciones')
}

// ── Aprobar (RRHH director) ───────────────────────────────────────────────────

export async function aprobarSolicitudVacaciones(
  solicitudId: string,
): Promise<void> {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_ADMINISTRACION'])
  await prisma.solicitudVacaciones.update({
    where: { id: solicitudId },
    data:  { estado: 'APROBADA', fechaAprobacion: new Date() },
  })
  revalidatePath('/rrhh/vacaciones')
  revalidatePath('/vacaciones')
}

// ── Rechazar ───────────────────────────────────────────────────────────────────

export async function rechazarSolicitudVacaciones(
  solicitudId: string,
): Promise<void> {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_ADMINISTRACION'])
  await prisma.solicitudVacaciones.update({
    where: { id: solicitudId },
    data:  { estado: 'RECHAZADA' },
  })
  revalidatePath('/rrhh/vacaciones')
  revalidatePath('/vacaciones')
}
