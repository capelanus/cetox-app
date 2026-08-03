import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ProyectoDetalleClient } from './proyecto-detalle-client'

export const dynamic = 'force-dynamic'

const ROLES = ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION'] as const

export default async function ProyectoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol([...ROLES])
  const { id } = await params

  const [proyecto, usuarios] = await Promise.all([
    prisma.proyectoEstrategico.findUnique({
      where: { id },
      include: {
        tareas: { orderBy: [{ orden: 'asc' }, { createdAt: 'asc' }] },
        hitos: { orderBy: { orden: 'asc' } },
      },
    }),
    prisma.usuario.findMany({ where: { activo: true }, select: { id: true, nombre: true }, orderBy: { nombre: 'asc' } }),
  ])
  if (!proyecto) notFound()

  const proyectoSer = {
    id: proyecto.id,
    nombre: proyecto.nombre,
    descripcion: proyecto.descripcion,
    estado: proyecto.estado,
    avance: proyecto.avance,
    gerenteId: proyecto.gerenteId,
    departamento: proyecto.departamento,
    fechaInicioPlan: proyecto.fechaInicioPlan?.toISOString() ?? null,
    fechaFinPlan: proyecto.fechaFinPlan?.toISOString() ?? null,
    hitos: proyecto.hitos.map(h => ({ id: h.id, nombre: h.nombre, completado: h.completado })),
    tareas: proyecto.tareas.map(t => ({
      id: t.id, titulo: t.titulo, descripcion: t.descripcion, responsableId: t.responsableId,
      estado: t.estado, prioridad: t.prioridad,
      fechaVencimiento: t.fechaVencimiento?.toISOString() ?? null, orden: t.orden,
    })),
  }

  return <ProyectoDetalleClient proyecto={proyectoSer} usuarios={usuarios} />
}
