import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { MejorasClient } from './mejoras-client'

export const dynamic = 'force-dynamic'

const ROLES = ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION'] as const

export default async function MejorasPage() {
  await requireRol([...ROLES])

  const [mejoras, auditorias, usuarios] = await Promise.all([
    prisma.accionMejora.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.auditoria.findMany({ orderBy: { fecha: 'desc' }, select: { id: true, codigo: true, fecha: true }, take: 100 }),
    prisma.usuario.findMany({ where: { activo: true }, select: { id: true, nombre: true }, orderBy: { nombre: 'asc' } }),
  ])

  const ser = mejoras.map(m => ({
    ...m,
    fechaCompromiso: m.fechaCompromiso?.toISOString() ?? null,
    fechaCierre: m.fechaCierre?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
  }))
  const auds = auditorias.map(a => ({ id: a.id, codigo: a.codigo }))
  return <MejorasClient mejoras={ser} auditorias={auds} usuarios={usuarios} />
}
