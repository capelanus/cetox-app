import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { getDepartamento } from '@/lib/calidad-constants'
import { ArrowLeft } from 'lucide-react'

export default async function DocumentoViewerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const { rol, area } = session.user

  const doc = await prisma.documentoCalidad.findUnique({
    where: { id },
    include: { accesos: { select: { departamento: true } } },
  })
  if (!doc) notFound()

  const esCalidad = rol === 'DIRECTOR_CALIDAD' || rol === 'COORDINADOR_CALIDAD' || rol === 'SUPER_ADMIN'
  if (!esCalidad) {
    const dept = getDepartamento(rol, area)
    const tieneAcceso = dept && doc.accesos.some(a => a.departamento === dept)
    if (!tieneAcceso) notFound()
  }

  const url = doc.archivoUrl.split('?')[0].toLowerCase()
  const esPdf    = url.endsWith('.pdf')
  const esImagen = /\.(png|jpe?g|gif|webp|svg)$/.test(url)
  const src      = `/api/documentos-calidad/${id}/ver`

  return (
    <div
      className="fixed inset-0 flex flex-col bg-slate-900"
      style={{ userSelect: 'none' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700 shrink-0">
        <button
          onClick={() => window.close()}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Cerrar
        </button>
        <span className="text-slate-400 text-sm">|</span>
        <span className="text-white text-sm font-medium truncate">{doc.nombre}</span>
        <span className="ml-auto text-xs text-slate-500 shrink-0">Solo lectura · Calidad</span>
      </div>

      {/* Viewer */}
      <div className="flex-1 relative">
        {(esPdf || esImagen) ? (
          <iframe
            src={esPdf ? `${src}#toolbar=0&navpanes=0&scrollbar=0` : src}
            className="absolute inset-0 w-full h-full border-0"
            title={doc.nombre}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-sm">
            Este tipo de archivo no puede previsualizarse en el navegador.
          </div>
        )}
      </div>
    </div>
  )
}
