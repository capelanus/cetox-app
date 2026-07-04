import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { PresupuestoClient } from './presupuesto-client'

export const dynamic = 'force-dynamic'

const ROLES = ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION'] as const

export default async function PresupuestoPage({ searchParams }: { searchParams: Promise<{ anio?: string }> }) {
  await requireRol([...ROLES])
  const sp = await searchParams
  const anio = sp.anio ? parseInt(sp.anio) : new Date().getFullYear()

  const [partidas, centros] = await Promise.all([
    prisma.partidaPresupuestal.findMany({
      where: { anio },
      orderBy: [{ tipo: 'asc' }, { createdAt: 'asc' }],
      include: { lineas: { orderBy: { periodo: 'asc' } }, centroCosto: { select: { nombre: true } } },
    }),
    prisma.centroCosto.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' }, select: { id: true, nombre: true } }),
  ])

  return <PresupuestoClient anio={anio} partidas={partidas} centros={centros} />
}
