import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { PoaClient } from './poa-client'

export const dynamic = 'force-dynamic'

const ROLES = ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION'] as const

export default async function PoaPage({ searchParams }: { searchParams: Promise<{ anio?: string }> }) {
  await requireRol([...ROLES])
  const sp = await searchParams
  const anio = sp.anio ? parseInt(sp.anio) : new Date().getFullYear()

  const [plan, actividades, usuarios] = await Promise.all([
    prisma.planEstrategico.findFirst({
      where: { activo: true },
      orderBy: { createdAt: 'desc' },
      include: { objetivos: { orderBy: { orden: 'asc' }, include: { acciones: { orderBy: { orden: 'asc' } } } } },
    }),
    prisma.actividadOperativa.findMany({
      where: { anio },
      orderBy: { createdAt: 'asc' },
      include: { seguimientos: { orderBy: { periodo: 'asc' } }, accion: { select: { codigo: true } } },
    }),
    prisma.usuario.findMany({
      where: { activo: true }, select: { id: true, nombre: true }, orderBy: { nombre: 'asc' },
    }),
  ])

  const accionesFlat = (plan?.objetivos ?? []).flatMap(o =>
    o.acciones.map(a => ({ id: a.id, codigo: a.codigo, nombre: a.nombre, oei: o.codigo })),
  )

  return <PoaClient anio={anio} actividades={actividades} acciones={accionesFlat} usuarios={usuarios} tienePlan={!!plan} />
}
