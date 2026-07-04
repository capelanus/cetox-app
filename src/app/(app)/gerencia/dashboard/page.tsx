import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import {
  avanceActividad, cumplimientoKpi, semaforoDeCumplimiento, nivelRiesgo, estaVencida, DEPARTAMENTOS,
} from '@/lib/planeamiento'
import { DashboardClient } from './dashboard-client'

export const dynamic = 'force-dynamic'

const ROLES = ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION'] as const

export default async function DashboardGerencialPage() {
  await requireRol([...ROLES])
  const anio = new Date().getFullYear()
  const ahora = new Date()
  const en60dias = new Date(ahora.getTime() + 60 * 24 * 60 * 60 * 1000)

  const [plan, actividades, indicadores, riesgos, proyectos, mejoras, auditorias, usuarios] = await Promise.all([
    prisma.planEstrategico.findFirst({
      where: { activo: true }, orderBy: { createdAt: 'desc' },
      include: { objetivos: { include: { acciones: { select: { id: true } } } } },
    }),
    prisma.actividadOperativa.findMany({ where: { anio }, include: { seguimientos: true } }),
    prisma.indicador.findMany({ include: { mediciones: { where: { anio } } } }),
    prisma.riesgo.findMany(),
    prisma.proyectoEstrategico.findMany(),
    prisma.accionMejora.findMany(),
    prisma.auditoria.findMany({
      where: { fecha: { gte: ahora, lte: en60dias } }, orderBy: { fecha: 'asc' },
      select: { id: true, codigo: true, fecha: true, descripcion: true },
    }),
    prisma.usuario.findMany({ where: { activo: true }, select: { id: true, nombre: true } }),
  ])

  const nombreDe = (id: string | null) => (id ? usuarios.find(u => u.id === id)?.nombre ?? null : null)

  // ── POA: avance por departamento y global ──
  const avancesPorDepto = DEPARTAMENTOS.map(d => {
    const items = actividades.filter(a => a.departamento === d.key)
    const avances = items
      .map(a => avanceActividad(a.metaAnual, a.seguimientos.reduce((s, x) => s + x.ejecutado, 0)))
      .filter((v): v is number => v !== null)
    const prom = avances.length ? Math.round(avances.reduce((s, x) => s + x, 0) / avances.length) : null
    return { depto: d.key, label: d.label, avance: prom, actividades: items.length }
  }).filter(g => g.actividades > 0)

  const globalPoa = avancesPorDepto.length
    ? Math.round(avancesPorDepto.reduce((s, g) => s + (g.avance ?? 0), 0) / avancesPorDepto.length)
    : null

  // ── KPIs: semáforos ──
  const kpiSemaforos = { verde: 0, ambar: 0, rojo: 0, gris: 0 }
  const kpisRojos: { nombre: string; pct: number }[] = []
  for (const i of indicadores) {
    const um = i.mediciones.length ? i.mediciones.reduce((a, b) => (b.periodo > a.periodo ? b : a)) : null
    const pct = cumplimientoKpi(um?.valor ?? null, i.meta, i.sentido)
    const sem = semaforoDeCumplimiento(pct)
    kpiSemaforos[sem]++
    if (sem === 'rojo' && pct !== null) kpisRojos.push({ nombre: i.nombre, pct })
  }

  // ── Riesgos ──
  const riesgosActivos = riesgos.filter(r => r.estado !== 'MITIGADO')
  const matriz: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0)) // [prob-1][imp-1]
  riesgosActivos.forEach(r => { matriz[r.probabilidad - 1][r.impacto - 1]++ })
  const riesgosCriticos = riesgosActivos
    .filter(r => nivelRiesgo(r.probabilidad, r.impacto) === 'critico' || nivelRiesgo(r.probabilidad, r.impacto) === 'alto')
    .sort((a, b) => b.probabilidad * b.impacto - a.probabilidad * a.impacto)
    .slice(0, 5)
    .map(r => ({ id: r.id, descripcion: r.descripcion, prob: r.probabilidad, imp: r.impacto }))

  // ── Proyectos ──
  const proyEstados = { PLANIFICADO: 0, EN_CURSO: 0, EN_PAUSA: 0, COMPLETADO: 0, CANCELADO: 0 } as Record<string, number>
  proyectos.forEach(p => { proyEstados[p.estado] = (proyEstados[p.estado] ?? 0) + 1 })
  const proyAtrasados = proyectos
    .filter(p => p.estado !== 'COMPLETADO' && p.estado !== 'CANCELADO' && p.fechaFinPlan && p.fechaFinPlan < ahora)
    .map(p => ({ id: p.id, nombre: p.nombre, avance: p.avance }))

  // ── Mejoras ──
  const mejorasAbiertas = mejoras.filter(m => m.estado !== 'CERRADA').length
  const mejorasVencidas = mejoras.filter(m => estaVencida(m.fechaCompromiso, m.estado === 'CERRADA'))
    .map(m => ({ id: m.id, descripcion: m.descripcion, resp: nombreDe(m.responsableId) }))

  // ── Auditorías próximas ──
  const auditoriasProximas = auditorias.map(a => ({ id: a.id, codigo: a.codigo, fecha: a.fecha.toISOString(), descripcion: a.descripcion }))

  // ── Alertas consolidadas ──
  const alertas: { tipo: string; texto: string; nivel: 'rojo' | 'ambar'; enlace: string }[] = []
  kpisRojos.forEach(k => alertas.push({ tipo: 'KPI', texto: `KPI en rojo: ${k.nombre} (${k.pct}% de meta)`, nivel: 'rojo', enlace: '/gerencia/indicadores' }))
  riesgosCriticos.filter(r => nivelRiesgo(r.prob, r.imp) === 'critico').forEach(r =>
    alertas.push({ tipo: 'Riesgo', texto: `Riesgo crítico: ${r.descripcion}`, nivel: 'rojo', enlace: '/gerencia/riesgos' }))
  mejorasVencidas.forEach(m => alertas.push({ tipo: 'Mejora', texto: `Acción de mejora vencida: ${m.descripcion}`, nivel: 'rojo', enlace: '/gerencia/mejoras' }))
  proyAtrasados.forEach(p => alertas.push({ tipo: 'Proyecto', texto: `Proyecto atrasado: ${p.nombre}`, nivel: 'ambar', enlace: '/gerencia/proyectos' }))
  auditoriasProximas.forEach(a => alertas.push({ tipo: 'Auditoría', texto: `Auditoría próxima: ${a.codigo}`, nivel: 'ambar', enlace: '/auditorias' }))

  const data = {
    anio,
    plan: plan ? { nombre: plan.nombre, anioInicio: plan.anioInicio, anioFin: plan.anioFin,
      objetivos: plan.objetivos.length, acciones: plan.objetivos.reduce((s, o) => s + o.acciones.length, 0) } : null,
    globalPoa, avancesPorDepto,
    kpiSemaforos, totalKpis: indicadores.length,
    matriz, riesgosActivos: riesgosActivos.length, riesgosCriticos,
    proyEstados, totalProyectos: proyectos.length, proyAtrasados,
    mejorasAbiertas, mejorasVencidas,
    auditoriasProximas,
    alertas,
  }

  return <DashboardClient data={data} />
}
