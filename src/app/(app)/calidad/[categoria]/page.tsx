import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { DocsCalidadSection } from './docs-section'

const CATEGORIAS: Record<string, { label: string; db: string }> = {
  formatos:       { label: 'Formatos',       db: 'FORMATO' },
  procedimientos: { label: 'Procedimientos', db: 'PROCEDIMIENTO' },
  instructivos:   { label: 'Instructivos',   db: 'INSTRUCTIVO' },
}

export default async function CalidadCategoriaPage({
  params,
}: {
  params: Promise<{ categoria: string }>
}) {
  await requireRol(['DIRECTOR_CALIDAD', 'COORDINADOR_CALIDAD'])
  const { categoria } = await params

  const meta = CATEGORIAS[categoria]
  if (!meta) notFound()

  const documentos = await prisma.documentoCalidad.findMany({
    where: { categoria: meta.db },
    include: {
      subidoPor: { select: { nombre: true } },
      accesos:   { select: { departamento: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">{meta.label}</h1>
      <DocsCalidadSection
        categoria={meta.db}
        categoriaLabel={meta.label}
        documentos={documentos.map(d => ({
          id: d.id,
          nombre: d.nombre,
          archivoUrl: d.archivoUrl,
          createdAt: d.createdAt,
          subidoPor: d.subidoPor,
          accesos: d.accesos,
        }))}
      />
    </div>
  )
}
