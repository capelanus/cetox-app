import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import AuditoriaDocs from './auditoria-docs'
import { eliminarAuditoria } from '@/app/actions/auditorias'

export default async function AuditoriaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol(['DIRECTOR_CALIDAD', 'COORDINADOR_CALIDAD', 'ADMINISTRACION', 'DIRECTOR_ADMINISTRACION'])
  const { id } = await params

  const auditoria = await prisma.auditoria.findUnique({
    where: { id },
    include: {
      creadoPor:  { select: { nombre: true } },
      documentos: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!auditoria) notFound()

  const docsForClient = auditoria.documentos.map(d => ({
    id:         d.id,
    nombre:     d.nombre,
    archivoUrl: d.archivoUrl,
    createdAt:  d.createdAt.toISOString(),
  }))

  const eliminar = eliminarAuditoria.bind(null, id)

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/auditorias">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Volver</Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
            {auditoria.codigo}
          </h1>
          <p className="text-sm text-gray-500">
            {format(auditoria.fecha, "d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <form action={eliminar}
          onSubmit={e => { if (!confirm('¿Eliminar esta auditoría y todos sus documentos?')) e.preventDefault() }}>
          <Button type="submit" variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="w-4 h-4 mr-1" />Eliminar
          </Button>
        </form>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Código:</span>{' '}
          <span className="font-semibold">{auditoria.codigo}</span>
        </div>
        <div>
          <span className="text-gray-500">Fecha:</span>{' '}
          <span className="font-semibold">{format(auditoria.fecha, "d 'de' MMMM yyyy", { locale: es })}</span>
        </div>
        <div>
          <span className="text-gray-500">Creado por:</span>{' '}
          <span className="font-semibold">{auditoria.creadoPor.nombre}</span>
        </div>
        <div>
          <span className="text-gray-500">Registrado:</span>{' '}
          <span className="font-semibold">{format(auditoria.createdAt, "d MMM yyyy HH:mm", { locale: es })}</span>
        </div>
        {auditoria.descripcion && (
          <div className="col-span-2">
            <span className="text-gray-500">Descripción:</span>{' '}
            <span className="font-semibold">{auditoria.descripcion}</span>
          </div>
        )}
      </div>

      <AuditoriaDocs auditoriaId={id} documentos={docsForClient} />
    </div>
  )
}
