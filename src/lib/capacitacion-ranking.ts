import { prisma } from '@/lib/prisma'
import { AREA_LABELS, ROL_LABELS } from '@/lib/constants'
import { ORDEN_ACTIVIDADES, type Actividad } from '@/lib/capacitacion'

export interface FilaRanking {
  usuarioId: string
  nombre: string
  area: string
  notas: Partial<Record<Actividad, number>>
  /** Promedio de las tres pruebas; null mientras falte alguna. */
  final: number | null
  /** Cuándo terminó la última de las tres (desempate: antes gana). */
  terminadoEn: string | null
  ultimaActividad: string
  /** Puesto en el ranking; solo para quien ya tiene nota final. */
  puesto: number | null
}

/**
 * Ranking de la evaluación final. Con nota final: ordenado por nota y, a
 * igual nota, por quién terminó antes. Después, quienes van a medias.
 */
export async function obtenerRanking() {
  const notas = await prisma.capacitacionNota.findMany({
    include: { usuario: { select: { id: true, nombre: true, rol: true, area: true } } },
  })

  const porPersona = new Map<string, { base: Omit<FilaRanking, 'final' | 'terminadoEn' | 'puesto' | 'ultimaActividad'>; fechas: Date[] }>()
  for (const n of notas) {
    const u = n.usuario
    const p = porPersona.get(u.id) ?? {
      base: { usuarioId: u.id, nombre: u.nombre, area: (u.area && AREA_LABELS[u.area]) || ROL_LABELS[u.rol] || u.rol, notas: {} },
      fechas: [],
    }
    if ((ORDEN_ACTIVIDADES as string[]).includes(n.actividad)) {
      p.base.notas[n.actividad as Actividad] = n.nota
      p.fechas.push(n.createdAt)
    }
    porPersona.set(u.id, p)
  }

  const filas: FilaRanking[] = [...porPersona.values()].map(({ base, fechas }) => {
    const completo = ORDEN_ACTIVIDADES.every(a => base.notas[a] !== undefined)
    const ultima = new Date(Math.max(...fechas.map(f => f.getTime())))
    return {
      ...base,
      final: completo
        ? Math.round((ORDEN_ACTIVIDADES.reduce((s, a) => s + (base.notas[a] ?? 0), 0) / ORDEN_ACTIVIDADES.length) * 10) / 10
        : null,
      terminadoEn: completo ? ultima.toISOString() : null,
      ultimaActividad: ultima.toISOString(),
      puesto: null,
    }
  })

  const conFinal = filas.filter(f => f.final !== null)
    .sort((a, b) => (b.final! - a.final!) || a.terminadoEn!.localeCompare(b.terminadoEn!))
  conFinal.forEach((f, i) => { f.puesto = i + 1 })
  const enCurso = filas.filter(f => f.final === null)
    .sort((a, b) => Object.keys(b.notas).length - Object.keys(a.notas).length || a.nombre.localeCompare(b.nombre, 'es'))

  const promedio = conFinal.length
    ? Math.round((conFinal.reduce((s, f) => s + f.final!, 0) / conFinal.length) * 10) / 10
    : null

  return { ranking: [...conFinal, ...enCurso], resumen: { participantes: filas.length, conFinal: conFinal.length, promedio } }
}
