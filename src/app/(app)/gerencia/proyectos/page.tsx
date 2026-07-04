import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { ProyectosClient } from './proyectos-client'

export const dynamic = 'force-dynamic'

const ROLES = ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION'] as const

export default async function ProyectosPage() {
  await requireRol([...ROLES])

  const [proyectos, plan, usuarios] = await Promise.all([
    prisma.proyectoEstrategico.findMany({
      orderBy: { createdAt: 'desc' },
      include: { hitos: { orderBy: { orden: 'asc' } } },
    }),
    prisma.planEstrategico.findFirst({
      where: { activo: true }, orderBy: { createdAt: 'desc' },
      include: { objetivos: { orderBy: { orden: 'asc' }, select: { id: true, codigo: true, nombre: true } } },
    }),
    prisma.usuario.findMany({ where: { activo: true }, select: { id: true, nombre: true }, orderBy: { nombre: 'asc' } }),
  ])

  const objetivos = (plan?.objetivos ?? []).map(o => ({ id: o.id, codigo: o.codigo, nombre: o.nombre }))
  const ser = proyectos.map(p => ({
    ...p,
    fechaInicioPlan: p.fechaInicioPlan?.toISOString() ?? null,
    fechaFinPlan: p.fechaFinPlan?.toISOString() ?? null,
    fechaInicioReal: p.fechaInicioReal?.toISOString() ?? null,
    fechaFinReal: p.fechaFinReal?.toISOString() ?? null,
    hitos: p.hitos.map(h => ({ ...h, fechaPlan: h.fechaPlan?.toISOString() ?? null, fechaReal: h.fechaReal?.toISOString() ?? null })),
  }))
  return <ProyectosClient proyectos={ser} objetivos={objetivos} usuarios={usuarios} />
}
