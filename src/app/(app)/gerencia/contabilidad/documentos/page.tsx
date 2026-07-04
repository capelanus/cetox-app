import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { DocumentosClient } from './documentos-client'

export const dynamic = 'force-dynamic'

const ROLES = ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION'] as const

export default async function DocumentosPage() {
  await requireRol([...ROLES])

  const [documentos, centros, usuarios] = await Promise.all([
    prisma.documentoFinanciero.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.centroCosto.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' }, select: { id: true, nombre: true } }),
    prisma.usuario.findMany({ where: { activo: true }, select: { id: true, nombre: true } }),
  ])

  const ser = documentos.map(d => ({ ...d, createdAt: d.createdAt.toISOString() }))
  return <DocumentosClient documentos={ser} centros={centros} usuarios={usuarios} />
}
