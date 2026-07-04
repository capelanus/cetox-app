import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { IndicadoresClient } from './indicadores-client'

export const dynamic = 'force-dynamic'

const ROLES = ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION'] as const

export default async function IndicadoresPage() {
  await requireRol([...ROLES])
  const anio = new Date().getFullYear()

  const [indicadores, plan, usuarios] = await Promise.all([
    prisma.indicador.findMany({
      orderBy: { createdAt: 'asc' },
      include: { mediciones: { where: { anio }, orderBy: { periodo: 'asc' } } },
    }),
    prisma.planEstrategico.findFirst({
      where: { activo: true }, orderBy: { createdAt: 'desc' },
      include: { objetivos: { orderBy: { orden: 'asc' }, select: { id: true, codigo: true, nombre: true } } },
    }),
    prisma.usuario.findMany({ where: { activo: true }, select: { id: true, nombre: true }, orderBy: { nombre: 'asc' } }),
  ])

  const objetivos = (plan?.objetivos ?? []).map(o => ({ id: o.id, codigo: o.codigo, nombre: o.nombre }))
  return <IndicadoresClient anio={anio} indicadores={indicadores} objetivos={objetivos} usuarios={usuarios} />
}
