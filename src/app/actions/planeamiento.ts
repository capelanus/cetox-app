'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Roles con permiso de gestión del módulo gerencial
const ROLES_GESTION = [
  'SUPER_ADMIN', 'GERENTE_GENERAL', 'GERENTE_TECNICO',
  'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION',
]

async function guard() {
  const session = await auth()
  if (!session) throw new Error('No autenticado')
  if (!ROLES_GESTION.includes(session.user.rol)) throw new Error('No autorizado')
  return session
}

function optDate(v?: string | null): Date | null {
  return v ? new Date(v) : null
}

// ── PEI ──────────────────────────────────────────────────────────────────────

export async function crearPlan(data: {
  nombre: string; anioInicio: number; anioFin: number; vision?: string; mision?: string
}) {
  await guard()
  const plan = await prisma.planEstrategico.create({ data })
  revalidatePath('/gerencia/pei')
  return plan.id
}

export async function actualizarPlan(id: string, data: {
  nombre?: string; anioInicio?: number; anioFin?: number; vision?: string; mision?: string; activo?: boolean
}) {
  await guard()
  await prisma.planEstrategico.update({ where: { id }, data })
  revalidatePath('/gerencia/pei')
}

export async function crearObjetivo(data: {
  planId: string; codigo: string; nombre: string; descripcion?: string
  departamento?: string; responsableId?: string; orden?: number
}) {
  await guard()
  await prisma.objetivoEstrategico.create({ data })
  revalidatePath('/gerencia/pei')
}

export async function actualizarObjetivo(id: string, data: {
  codigo?: string; nombre?: string; descripcion?: string; departamento?: string | null
  responsableId?: string | null; orden?: number
}) {
  await guard()
  await prisma.objetivoEstrategico.update({ where: { id }, data })
  revalidatePath('/gerencia/pei')
}

export async function eliminarObjetivo(id: string) {
  await guard()
  await prisma.objetivoEstrategico.delete({ where: { id } })
  revalidatePath('/gerencia/pei')
}

export async function crearAccion(data: {
  objetivoId: string; codigo: string; nombre: string
  departamento?: string; responsableId?: string; orden?: number
}) {
  await guard()
  await prisma.accionEstrategica.create({ data })
  revalidatePath('/gerencia/pei')
}

export async function actualizarAccion(id: string, data: {
  codigo?: string; nombre?: string; departamento?: string | null; responsableId?: string | null; orden?: number
}) {
  await guard()
  await prisma.accionEstrategica.update({ where: { id }, data })
  revalidatePath('/gerencia/pei')
}

export async function eliminarAccion(id: string) {
  await guard()
  await prisma.accionEstrategica.delete({ where: { id } })
  revalidatePath('/gerencia/pei')
}

// ── POA ──────────────────────────────────────────────────────────────────────

export async function crearActividad(data: {
  accionId: string; anio: number; nombre: string; departamento: string
  codigo?: string; responsableId?: string; unidadMedida?: string; metaAnual?: number; presupuesto?: number
}) {
  await guard()
  await prisma.actividadOperativa.create({ data })
  revalidatePath('/gerencia/poa')
}

export async function actualizarActividad(id: string, data: {
  nombre?: string; departamento?: string; codigo?: string; responsableId?: string | null
  unidadMedida?: string; metaAnual?: number; presupuesto?: number | null; estado?: string
}) {
  await guard()
  await prisma.actividadOperativa.update({ where: { id }, data })
  revalidatePath('/gerencia/poa')
}

export async function eliminarActividad(id: string) {
  await guard()
  await prisma.actividadOperativa.delete({ where: { id } })
  revalidatePath('/gerencia/poa')
}

export async function guardarSeguimiento(data: {
  actividadId: string; periodo: number; metaProgramada: number; ejecutado: number; comentario?: string
}) {
  await guard()
  await prisma.seguimientoActividad.upsert({
    where: { actividadId_periodo: { actividadId: data.actividadId, periodo: data.periodo } },
    create: data,
    update: { metaProgramada: data.metaProgramada, ejecutado: data.ejecutado, comentario: data.comentario },
  })
  revalidatePath('/gerencia/poa')
  revalidatePath('/gerencia/dashboard')
}

// ── Indicadores (KPIs) ───────────────────────────────────────────────────────

export async function crearIndicador(data: {
  nombre: string; objetivoId?: string; accionId?: string; formula?: string; unidad?: string
  sentido?: string; frecuencia?: string; lineaBase?: number; meta?: number
  departamento?: string; responsableId?: string
}) {
  await guard()
  await prisma.indicador.create({ data })
  revalidatePath('/gerencia/indicadores')
}

export async function actualizarIndicador(id: string, data: {
  nombre?: string; objetivoId?: string | null; formula?: string; unidad?: string
  sentido?: string; frecuencia?: string; lineaBase?: number | null; meta?: number | null
  departamento?: string | null; responsableId?: string | null
}) {
  await guard()
  await prisma.indicador.update({ where: { id }, data })
  revalidatePath('/gerencia/indicadores')
}

export async function eliminarIndicador(id: string) {
  await guard()
  await prisma.indicador.delete({ where: { id } })
  revalidatePath('/gerencia/indicadores')
}

export async function guardarMedicion(data: {
  indicadorId: string; anio: number; periodo: number; valor: number; comentario?: string
}) {
  await guard()
  await prisma.medicionIndicador.upsert({
    where: { indicadorId_anio_periodo: { indicadorId: data.indicadorId, anio: data.anio, periodo: data.periodo } },
    create: data,
    update: { valor: data.valor, comentario: data.comentario },
  })
  revalidatePath('/gerencia/indicadores')
  revalidatePath('/gerencia/dashboard')
}

export async function eliminarMedicion(id: string) {
  await guard()
  await prisma.medicionIndicador.delete({ where: { id } })
  revalidatePath('/gerencia/indicadores')
}

// ── Riesgos ──────────────────────────────────────────────────────────────────

export async function crearRiesgo(data: {
  descripcion: string; objetivoId?: string; codigo?: string; causa?: string; categoria?: string
  probabilidad: number; impacto: number; departamento?: string; responsableId?: string
  planMitigacion?: string; estado?: string; fechaRevision?: string
}) {
  await guard()
  const { fechaRevision, ...rest } = data
  await prisma.riesgo.create({ data: { ...rest, fechaRevision: optDate(fechaRevision) } })
  revalidatePath('/gerencia/riesgos')
  revalidatePath('/gerencia/dashboard')
}

export async function actualizarRiesgo(id: string, data: {
  descripcion?: string; objetivoId?: string | null; codigo?: string; causa?: string; categoria?: string
  probabilidad?: number; impacto?: number; departamento?: string | null; responsableId?: string | null
  planMitigacion?: string; estado?: string; fechaRevision?: string | null
}) {
  await guard()
  const { fechaRevision, ...rest } = data
  await prisma.riesgo.update({
    where: { id },
    data: { ...rest, ...(fechaRevision !== undefined ? { fechaRevision: optDate(fechaRevision) } : {}) },
  })
  revalidatePath('/gerencia/riesgos')
  revalidatePath('/gerencia/dashboard')
}

export async function eliminarRiesgo(id: string) {
  await guard()
  await prisma.riesgo.delete({ where: { id } })
  revalidatePath('/gerencia/riesgos')
  revalidatePath('/gerencia/dashboard')
}

// ── Proyectos ────────────────────────────────────────────────────────────────

export async function crearProyecto(data: {
  nombre: string; objetivoId?: string; descripcion?: string; sponsorId?: string; gerenteId?: string
  departamento?: string; fechaInicioPlan?: string; fechaFinPlan?: string
  presupuesto?: number; estado?: string; avance?: number
}) {
  await guard()
  const { fechaInicioPlan, fechaFinPlan, ...rest } = data
  await prisma.proyectoEstrategico.create({
    data: { ...rest, fechaInicioPlan: optDate(fechaInicioPlan), fechaFinPlan: optDate(fechaFinPlan) },
  })
  revalidatePath('/gerencia/proyectos')
  revalidatePath('/gerencia/dashboard')
}

export async function actualizarProyecto(id: string, data: {
  nombre?: string; objetivoId?: string | null; descripcion?: string; sponsorId?: string | null
  gerenteId?: string | null; departamento?: string | null
  fechaInicioPlan?: string | null; fechaFinPlan?: string | null
  fechaInicioReal?: string | null; fechaFinReal?: string | null
  presupuesto?: number | null; estado?: string; avance?: number
}) {
  await guard()
  const { fechaInicioPlan, fechaFinPlan, fechaInicioReal, fechaFinReal, ...rest } = data
  await prisma.proyectoEstrategico.update({
    where: { id },
    data: {
      ...rest,
      ...(fechaInicioPlan !== undefined ? { fechaInicioPlan: optDate(fechaInicioPlan) } : {}),
      ...(fechaFinPlan !== undefined ? { fechaFinPlan: optDate(fechaFinPlan) } : {}),
      ...(fechaInicioReal !== undefined ? { fechaInicioReal: optDate(fechaInicioReal) } : {}),
      ...(fechaFinReal !== undefined ? { fechaFinReal: optDate(fechaFinReal) } : {}),
    },
  })
  revalidatePath('/gerencia/proyectos')
  revalidatePath('/gerencia/dashboard')
}

export async function eliminarProyecto(id: string) {
  await guard()
  await prisma.proyectoEstrategico.delete({ where: { id } })
  revalidatePath('/gerencia/proyectos')
  revalidatePath('/gerencia/dashboard')
}

export async function crearHito(data: { proyectoId: string; nombre: string; fechaPlan?: string; orden?: number }) {
  await guard()
  const { fechaPlan, ...rest } = data
  await prisma.hitoProyecto.create({ data: { ...rest, fechaPlan: optDate(fechaPlan) } })
  revalidatePath('/gerencia/proyectos')
}

export async function toggleHito(id: string) {
  await guard()
  const hito = await prisma.hitoProyecto.findUnique({ where: { id } })
  if (!hito) throw new Error('No encontrado')
  await prisma.hitoProyecto.update({
    where: { id },
    data: { completado: !hito.completado, fechaReal: !hito.completado ? new Date() : null },
  })
  revalidatePath('/gerencia/proyectos')
}

export async function eliminarHito(id: string) {
  await guard()
  await prisma.hitoProyecto.delete({ where: { id } })
  revalidatePath('/gerencia/proyectos')
}

// ── Acciones de mejora (CAPA) ────────────────────────────────────────────────

export async function crearMejora(data: {
  origen: string; descripcion: string; codigo?: string; auditoriaId?: string; causaRaiz?: string
  accion?: string; departamento?: string; responsableId?: string; fechaCompromiso?: string; estado?: string
}) {
  await guard()
  const { fechaCompromiso, ...rest } = data
  await prisma.accionMejora.create({ data: { ...rest, fechaCompromiso: optDate(fechaCompromiso) } })
  revalidatePath('/gerencia/mejoras')
  revalidatePath('/gerencia/dashboard')
}

export async function actualizarMejora(id: string, data: {
  origen?: string; descripcion?: string; codigo?: string; auditoriaId?: string | null; causaRaiz?: string
  accion?: string; departamento?: string | null; responsableId?: string | null
  fechaCompromiso?: string | null; fechaCierre?: string | null; estado?: string; eficaciaVerificada?: boolean
}) {
  await guard()
  const { fechaCompromiso, fechaCierre, ...rest } = data
  await prisma.accionMejora.update({
    where: { id },
    data: {
      ...rest,
      ...(fechaCompromiso !== undefined ? { fechaCompromiso: optDate(fechaCompromiso) } : {}),
      ...(fechaCierre !== undefined ? { fechaCierre: optDate(fechaCierre) } : {}),
    },
  })
  revalidatePath('/gerencia/mejoras')
  revalidatePath('/gerencia/dashboard')
}

export async function eliminarMejora(id: string) {
  await guard()
  await prisma.accionMejora.delete({ where: { id } })
  revalidatePath('/gerencia/mejoras')
  revalidatePath('/gerencia/dashboard')
}
