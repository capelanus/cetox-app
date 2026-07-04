import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { CentrosCostoClient } from './centros-costo-client'

export const dynamic = 'force-dynamic'

const ROLES = ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION'] as const

export default async function CentrosCostoPage() {
  await requireRol([...ROLES])
  const anio = new Date().getFullYear()

  const [centros, usuarios] = await Promise.all([
    prisma.centroCosto.findMany({
      orderBy: { codigo: 'asc' },
      include: { partidas: { where: { anio }, include: { lineas: { select: { periodo: true, planificado: true, ejecutado: true } } } } },
    }),
    prisma.usuario.findMany({ where: { activo: true }, select: { id: true, nombre: true }, orderBy: { nombre: 'asc' } }),
  ])

  const data = centros.map(c => {
    let ingPlan = 0, ingEjec = 0, egrPlan = 0, egrEjec = 0
    for (const p of c.partidas) {
      const plan = p.lineas.reduce((a, l) => a + l.planificado, 0)
      const ejec = p.lineas.reduce((a, l) => a + l.ejecutado, 0)
      if (p.tipo === 'INGRESO') { ingPlan += plan; ingEjec += ejec } else { egrPlan += plan; egrEjec += ejec }
    }
    return {
      id: c.id, codigo: c.codigo, nombre: c.nombre, departamento: c.departamento,
      responsableId: c.responsableId, activo: c.activo, partidas: c.partidas.length,
      ingPlan, ingEjec, egrPlan, egrEjec,
    }
  })

  return <CentrosCostoClient anio={anio} centros={data} usuarios={usuarios} />
}
