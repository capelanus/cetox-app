'use server'

import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'
import { revalidatePath } from 'next/cache'
import {
  type EstadoEquipo,
  type EquipoConEstado,
  calcularEstado,
  estadoGeneral,
} from '@/lib/equipos-utils'

export type { EstadoEquipo, TareaConEstado, EquipoConEstado } from '@/lib/equipos-utils'

// ── Internal helper ───────────────────────────────────────────────────────────

function enriquecerEquipo(eq: {
  id: string; codigo: string; nombre: string; area: string | null
  categoria: string; activo: boolean; notas: string | null; ultimoServicio: Date | null
  tareas: { id: string; tipo: string; mes: number; anio: number; completado: boolean; fechaReal: Date | null; nota: string | null }[]
}): EquipoConEstado {
  const tareasConEstado = eq.tareas.map(t => ({
    ...t,
    estado: calcularEstado(t.mes, t.anio, t.completado),
  }))

  const hoy   = new Date()
  const ahora = hoy.getFullYear() * 12 + (hoy.getMonth() + 1)
  const proxima = tareasConEstado
    .filter(t => !t.completado)
    .sort((a, b) => (a.anio * 12 + a.mes) - (b.anio * 12 + b.mes))
    .find(t => (t.anio * 12 + t.mes) >= ahora - 1) ?? null

  return {
    ...eq,
    tareas:        tareasConEstado,
    estadoGeneral: estadoGeneral(tareasConEstado),
    proximaTarea:  proxima ? { mes: proxima.mes, anio: proxima.anio, tipo: proxima.tipo } : null,
  }
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getEquipos(filtros?: {
  area?:   string
  estado?: EstadoEquipo
  buscar?: string
}) {
  await requireRol(['GERENTE_TECNICO', 'DIRECTOR_CALIDAD'])

  const equipos = await prisma.equipo.findMany({
    where: {
      activo: true,
      ...(filtros?.area   ? { area: filtros.area }   : {}),
      ...(filtros?.buscar ? {
        OR: [
          { codigo: { contains: filtros.buscar, mode: 'insensitive' } },
          { nombre: { contains: filtros.buscar, mode: 'insensitive' } },
        ]
      } : {}),
    },
    include: {
      tareas: {
        where:   { anio: { gte: 2026 } },
        orderBy: [{ anio: 'asc' }, { mes: 'asc' }],
      },
    },
    orderBy: { codigo: 'asc' },
  })

  const enriquecidos = equipos.map(enriquecerEquipo)

  if (filtros?.estado) {
    return enriquecidos.filter(e => e.estadoGeneral === filtros.estado)
  }
  return enriquecidos
}

export async function getEquipo(id: string) {
  await requireRol(['GERENTE_TECNICO', 'DIRECTOR_CALIDAD'])

  const eq = await prisma.equipo.findUnique({
    where: { id },
    include: {
      tareas: {
        orderBy: [{ anio: 'asc' }, { mes: 'asc' }],
      },
    },
  })

  if (!eq) return null
  return enriquecerEquipo(eq)
}

export async function getResumenEquipos() {
  await requireRol(['GERENTE_TECNICO', 'DIRECTOR_CALIDAD'])

  const equipos = await prisma.equipo.findMany({
    where:   { activo: true },
    include: { tareas: { where: { anio: { gte: 2026 } } } },
  })

  const enriquecidos = equipos.map(enriquecerEquipo)

  return {
    total:       enriquecidos.length,
    vencidos:    enriquecidos.filter(e => e.estadoGeneral === 'VENCIDO').length,
    proximos:    enriquecidos.filter(e => e.estadoGeneral === 'PROXIMO').length,
    programados: enriquecidos.filter(e => e.estadoGeneral === 'PROGRAMADO').length,
    alDia:       enriquecidos.filter(e => e.estadoGeneral === 'AL_DIA').length,
  }
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function toggleTareaCompleta(tareaId: string, completado: boolean, nota?: string) {
  await requireRol(['GERENTE_TECNICO', 'DIRECTOR_CALIDAD'])

  const tarea = await prisma.tareaEquipo.update({
    where: { id: tareaId },
    data: {
      completado,
      fechaReal: completado ? new Date() : null,
      nota:      nota ?? null,
    },
    include: { equipo: true },
  })

  if (completado) {
    await prisma.equipo.update({
      where: { id: tarea.equipoId },
      data:  { ultimoServicio: new Date() },
    })
  }

  revalidatePath('/equipos')
  revalidatePath(`/equipos/${tarea.equipoId}`)
  return tarea
}

export async function crearTarea(data: {
  equipoId: string
  tipo:     string
  mes:      number
  anio:     number
  nota?:    string
}) {
  await requireRol(['GERENTE_TECNICO', 'DIRECTOR_CALIDAD'])

  const tarea = await prisma.tareaEquipo.create({
    data: {
      equipoId:   data.equipoId,
      tipo:       data.tipo,
      mes:        data.mes,
      anio:       data.anio,
      nota:       data.nota ?? null,
      completado: false,
    },
  })

  revalidatePath('/equipos')
  revalidatePath(`/equipos/${data.equipoId}`)
  return tarea
}

export async function crearEquipo(data: {
  codigo:     string
  nombre:     string
  area?:      string
  categoria?: string
  notas?:     string
}) {
  await requireRol(['ADMINISTRACION', 'GERENTE_TECNICO'])

  const equipo = await prisma.equipo.create({
    data: {
      codigo:    data.codigo.trim().toUpperCase(),
      nombre:    data.nombre.trim(),
      area:      data.area      ?? null,
      categoria: data.categoria ?? 'GENERAL',
      notas:     data.notas     ?? null,
    },
  })

  revalidatePath('/equipos')
  return equipo
}

export async function actualizarNotaEquipo(id: string, notas: string) {
  await requireRol(['GERENTE_TECNICO', 'DIRECTOR_CALIDAD'])

  await prisma.equipo.update({ where: { id }, data: { notas } })
  revalidatePath('/equipos')
  revalidatePath(`/equipos/${id}`)
}
