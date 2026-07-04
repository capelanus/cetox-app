import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { FlujoCajaClient } from './flujo-caja-client'

export const dynamic = 'force-dynamic'

const ROLES = ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION'] as const

export default async function FlujoCajaPage({ searchParams }: { searchParams: Promise<{ anio?: string }> }) {
  await requireRol([...ROLES])
  const sp = await searchParams
  const anio = sp.anio ? parseInt(sp.anio) : new Date().getFullYear()

  const partidas = await prisma.partidaPresupuestal.findMany({
    where: { anio },
    include: { lineas: { select: { periodo: true, planificado: true, ejecutado: true } } },
  })

  // Acumular por mes
  const meses = Array.from({ length: 12 }, (_, i) => ({
    periodo: i + 1, ingPlan: 0, ingReal: 0, egrPlan: 0, egrReal: 0,
  }))
  for (const p of partidas) {
    for (const l of p.lineas) {
      const m = meses[l.periodo - 1]
      if (!m) continue
      if (p.tipo === 'INGRESO') { m.ingPlan += l.planificado; m.ingReal += l.ejecutado }
      else { m.egrPlan += l.planificado; m.egrReal += l.ejecutado }
    }
  }

  return <FlujoCajaClient anio={anio} meses={meses} />
}
