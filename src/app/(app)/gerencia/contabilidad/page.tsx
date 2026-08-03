import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { ContabilidadDashboard } from './dashboard-client'

export const dynamic = 'force-dynamic'

const ROLES = ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION'] as const

export default async function ContabilidadPage() {
  await requireRol([...ROLES])
  const anio = new Date().getFullYear()

  const [partidas, registros, documentos, centrosCount] = await Promise.all([
    prisma.partidaPresupuestal.findMany({ where: { anio }, include: { lineas: { select: { periodo: true, planificado: true, ejecutado: true } } } }),
    prisma.registroRentabilidad.findMany({ where: { anio } }),
    prisma.documentoFinanciero.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.centroCosto.count({ where: { activo: true } }),
  ])

  // Presupuesto
  let ingPlan = 0, ingReal = 0, egrPlan = 0, egrReal = 0, opexPlan = 0, capexPlan = 0
  const meses = Array.from({ length: 12 }, () => ({ neto: 0 }))
  for (const p of partidas) {
    for (const l of p.lineas) {
      if (p.tipo === 'INGRESO') { ingPlan += l.planificado; ingReal += l.ejecutado; meses[l.periodo - 1].neto += l.planificado }
      else {
        egrPlan += l.planificado; egrReal += l.ejecutado; meses[l.periodo - 1].neto -= l.planificado
        if (p.clasificacion === 'OPEX') opexPlan += l.planificado
        else if (p.clasificacion === 'CAPEX') capexPlan += l.planificado
      }
    }
  }

  // Rentabilidad top
  const aggCliente = new Map<string, { ingreso: number; costo: number }>()
  const aggServicio = new Map<string, { ingreso: number; costo: number }>()
  for (const r of registros) {
    const costo = r.costoDirecto + r.costoIndirecto
    const c = aggCliente.get(r.clienteNombre) ?? { ingreso: 0, costo: 0 }; c.ingreso += r.ingreso; c.costo += costo; aggCliente.set(r.clienteNombre, c)
    const s = aggServicio.get(r.servicio) ?? { ingreso: 0, costo: 0 }; s.ingreso += r.ingreso; s.costo += costo; aggServicio.set(r.servicio, s)
  }
  const top = (m: Map<string, { ingreso: number; costo: number }>) =>
    [...m.entries()].map(([nombre, v]) => ({ nombre, margen: v.ingreso - v.costo, pct: v.ingreso ? Math.round(((v.ingreso - v.costo) / v.ingreso) * 100) : null }))
      .sort((a, b) => b.margen - a.margen).slice(0, 5)

  const data = {
    anio, ingPlan, ingReal, egrPlan, egrReal, opexPlan, capexPlan, centrosCount,
    meses: meses.map((m, i) => ({ periodo: i + 1, neto: m.neto })),
    topClientes: top(aggCliente),
    topServicios: top(aggServicio),
    documentos: documentos.map(d => ({ id: d.id, nombre: d.nombre, url: d.url, categoria: d.categoria, createdAt: d.createdAt.toISOString() })),
  }

  return <ContabilidadDashboard data={data} />
}
