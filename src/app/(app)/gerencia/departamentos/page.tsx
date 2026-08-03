import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { DEPARTAMENTOS } from '@/lib/planeamiento'
import { obtenerEgresosLogistica } from '@/lib/egresos-logistica'
import { obtenerProduccionLab } from '@/lib/produccion-lab'
import { DepartamentosClient } from './departamentos-client'

export const dynamic = 'force-dynamic'

const ROLES = ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION'] as const

export default async function DepartamentosPage({ searchParams }: { searchParams: Promise<{ anio?: string }> }) {
  await requireRol([...ROLES])
  const sp = await searchParams
  const anio = sp.anio ? parseInt(sp.anio) : new Date().getFullYear()

  const [partidas, centros, proyectos, usuarios, egresos, produccion] = await Promise.all([
    // Partidas de egreso del año con su centro (para departamento) y líneas mensuales
    prisma.partidaPresupuestal.findMany({
      where: { anio, tipo: 'EGRESO' },
      select: { centroCosto: { select: { departamento: true } }, lineas: { select: { periodo: true, planificado: true } } },
    }),
    prisma.centroCosto.findMany({ where: { activo: true }, select: { departamento: true, responsableId: true } }),
    prisma.proyectoEstrategico.findMany({ select: { departamento: true, nombre: true, estado: true, avance: true } }),
    prisma.usuario.findMany({ where: { activo: true }, select: { id: true, nombre: true } }),
    obtenerEgresosLogistica(anio),
    obtenerProduccionLab(anio),
  ])

  const nombreDe = (id: string | null | undefined) => (id ? usuarios.find(u => u.id === id)?.nombre ?? null : null)

  // Presupuesto planificado mensual por departamento
  const planMensual: Record<string, number[]> = {}
  for (const p of partidas) {
    const depto = p.centroCosto?.departamento
    if (!depto) continue
    const arr = (planMensual[depto] ??= Array(12).fill(0))
    for (const l of p.lineas) arr[l.periodo - 1] += l.planificado
  }

  const data = DEPARTAMENTOS.map((d) => {
    const key = d.key
    const asignadoMensual = planMensual[key] ?? Array(12).fill(0)
    const asignado = asignadoMensual.reduce((a, b) => a + b, 0)
    const facturadoMensual = egresos.mensualPorDepto[key]?.facturado ?? Array(12).fill(0)
    const ejecutado = facturadoMensual.reduce((a, b) => a + b, 0)

    // Responsable: del centro de costo del departamento
    const centro = centros.find(c => c.departamento === key)
    const responsable = nombreDe(centro?.responsableId)

    // Proyecto más relevante del departamento (en curso primero, si no el de mayor avance)
    const proyectosDepto = proyectos.filter(p => p.departamento === key)
    const proyecto = proyectosDepto.find(p => p.estado === 'EN_CURSO')
      ?? proyectosDepto.sort((a, b) => b.avance - a.avance)[0]
      ?? null

    return {
      key, label: d.label, responsable, asignado, ejecutado,
      asignadoMensual, facturadoMensual,
      produccionMensual: produccion[key] ?? Array(12).fill(0),
      proyecto: proyecto ? { nombre: proyecto.nombre, estado: proyecto.estado, avance: proyecto.avance } : null,
      proyectosCount: proyectosDepto.length,
    }
  })

  return <DepartamentosClient anio={anio} departamentos={data} />
}
