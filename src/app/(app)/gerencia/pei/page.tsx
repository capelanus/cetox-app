import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { PeiClient } from './pei-client'

export const dynamic = 'force-dynamic'

const ROLES = ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION'] as const

export default async function PeiPage() {
  await requireRol([...ROLES])

  const [plan, usuarios] = await Promise.all([
    prisma.planEstrategico.findFirst({
      where: { activo: true },
      orderBy: { createdAt: 'desc' },
      include: {
        objetivos: {
          orderBy: { orden: 'asc' },
          include: { acciones: { orderBy: { orden: 'asc' } } },
        },
      },
    }),
    prisma.usuario.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, rol: true },
      orderBy: { nombre: 'asc' },
    }),
  ])

  return <PeiClient plan={plan} usuarios={usuarios} />
}
