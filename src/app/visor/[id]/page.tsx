import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { getDepartamento } from '@/lib/calidad-constants'
import { PdfViewer } from './pdf-viewer'
import { IframeViewer } from './iframe-viewer'

export default async function VisorPage({
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

  const urlBase  = doc.archivoUrl.split('?')[0]
  const esPdf    = /\.pdf$/i.test(urlBase)
  const esImagen = /\.(png|jpe?g|gif|webp|svg)$/i.test(urlBase)
  const proxyUrl = `/api/documentos-calidad/${id}/ver`

  return (
    <div className="flex flex-col bg-slate-900" style={{ height: '100dvh', userSelect: 'none' }}>
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700 shrink-0">
        <a href="/documentos" className="text-slate-300 hover:text-white text-sm transition-colors">
          ← Volver
        </a>
        <span className="text-slate-400 text-sm">|</span>
        <span className="text-white text-sm font-medium truncate">{doc.nombre}</span>
        <span className="ml-auto text-xs text-slate-500 shrink-0">Solo lectura · Calidad</span>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        {esPdf ? (
          <PdfViewer src={proxyUrl} />
        ) : esImagen ? (
          <IframeViewer src={proxyUrl} title={doc.nombre} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
               className="text-slate-300 text-sm">
            Este tipo de archivo no puede previsualizarse en el navegador.
          </div>
        )}
      </div>
    </div>
  )
}
