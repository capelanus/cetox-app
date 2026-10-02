'use client'

import { useRef, useState, useTransition } from 'react'
import { Paperclip, Upload, Trash2 } from 'lucide-react'
import { adjuntarDocumentoCotizacion, eliminarDocumentoCotizacion } from '@/app/actions/cotizaciones'
import { ARCHIVOS_ACEPTADOS as ACEPTADOS, iconoDe, sePuedeVerEnLinea, formatTamano } from '@/components/archivo-icono'

interface Documento {
  id: string
  nombre: string
  url: string
  tamano: number | null
  subidoPor: string
  fecha: string
}

export default function DocumentosCotizacion({ cotizacionId, documentos, puedeEditar }: {
  cotizacionId: string
  documentos: Documento[]
  puedeEditar: boolean
}) {
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? [])
    if (archivos.length === 0) return
    setSubiendo(true)
    setError('')
    try {
      for (const file of archivos) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (!data.url) throw new Error('sin url')
        await adjuntarDocumentoCotizacion(cotizacionId, file.name, data.url, file.size)
      }
      startTransition(() => {})
    } catch {
      setError('No se pudo subir el archivo. Inténtalo de nuevo.')
    } finally {
      setSubiendo(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Paperclip className="w-4 h-4 text-slate-400" />
        <h2 className="font-semibold text-slate-700 text-sm">Documentos adjuntos</h2>
        <span className="text-xs text-slate-400">Word, Excel, PDF, imágenes o correos (.eml) enviados por el cliente</span>
      </div>

      {documentos.length === 0 ? (
        <p className="text-sm text-slate-400 italic">Sin documentos adjuntos</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {documentos.map(doc => {
            const { Icono, color } = iconoDe(doc.nombre)
            return (
              <li key={doc.id} className="flex items-center gap-3 py-2">
                <Icono className={`w-5 h-5 shrink-0 ${color}`} />
                <div className="min-w-0 flex-1">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#13602C] hover:underline block truncate"
                  >
                    {doc.nombre}
                  </a>
                  <p className="text-xs text-slate-400">
                    {doc.subidoPor} · {doc.fecha}
                    {doc.tamano ? ` · ${formatTamano(doc.tamano)}` : ''}
                    {!sePuedeVerEnLinea(doc.nombre) && ' · se descarga'}
                  </p>
                </div>
                {puedeEditar && (
                  <form action={eliminarDocumentoCotizacion.bind(null, doc.id)}>
                    <button type="submit" className="text-slate-300 hover:text-red-600" title="Eliminar documento">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {puedeEditar && (
        <div className="mt-4 flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-sm px-3 py-1.5 rounded-lg border border-[#13602C] text-[#13602C] hover:bg-green-50 transition-colors">
            {subiendo ? <span className="text-slate-400">Subiendo...</span> : (<><Upload className="w-4 h-4" />Adjuntar documentos</>)}
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACEPTADOS}
              className="hidden"
              onChange={handleChange}
              disabled={subiendo}
            />
          </label>
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      )}
    </div>
  )
}
