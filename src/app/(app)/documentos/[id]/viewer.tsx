'use client'

import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Props {
  docId: string
  nombre: string
  esPdf: boolean
  esImagen: boolean
}

export function SecureViewer({ docId, nombre, esPdf, esImagen }: Props) {
  const viewerUrl = `/api/documentos-calidad/${docId}/ver`

  useEffect(() => {
    // Bloquear clic derecho
    const bloquear = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('contextmenu', bloquear)

    // Bloquear atajos de teclado de descarga/impresión
    const bloquearTeclas = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && (e.key === 's' || e.key === 'p' || e.key === 'u')) {
        e.preventDefault()
      }
    }
    document.addEventListener('keydown', bloquearTeclas)

    return () => {
      document.removeEventListener('contextmenu', bloquear)
      document.removeEventListener('keydown', bloquearTeclas)
    }
  }, [])

  return (
    <div className="-mx-8 -my-6 flex flex-col bg-slate-900 select-none overflow-hidden" style={{ userSelect: 'none', height: 'calc(100vh - 49px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700 shrink-0">
        <Link
          href="/documentos"
          className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
        <span className="text-slate-400 text-sm">|</span>
        <span className="text-white text-sm font-medium truncate">{nombre}</span>
        <span className="ml-auto text-xs text-slate-500 shrink-0">Solo lectura · Calidad</span>
      </div>

      {/* Viewer area */}
      <div className="flex-1 relative overflow-hidden">
        {(esPdf || esImagen) ? (
          <>
            <iframe
              src={`${viewerUrl}${esPdf ? '#toolbar=0&navpanes=0&scrollbar=0' : ''}`}
              className="w-full h-full border-0"
              title={nombre}
              sandbox="allow-same-origin allow-scripts"
            />
            {/* Capa transparente sobre el iframe para bloquear el menú contextual del PDF */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ zIndex: 10 }}
              onContextMenu={e => e.preventDefault()}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-center text-slate-300 p-8">
            <div className="max-w-sm">
              <p className="text-lg font-semibold mb-2">Previsualización no disponible</p>
              <p className="text-slate-400 text-sm">
                Este tipo de archivo no puede visualizarse directamente en el navegador.
                Contacta al área de Calidad si necesitas acceso al contenido.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
