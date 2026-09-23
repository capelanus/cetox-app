'use client'

import { useRef, useState, useTransition } from 'react'
import { Paperclip, Upload, ExternalLink, Trash2 } from 'lucide-react'
import { adjuntarDocumentoOC, eliminarDocumentoOC } from '@/app/actions/ordenes-compra'
import { TIPO_DOCUMENTO_OC_LABELS } from '@/lib/constants'

interface Documento {
  id: string
  tipo: string
  nombre: string
  url: string
  subidoPor: string
  fecha: string
}

export default function DocumentosOC({ ocId, documentos, puedeEditar }: {
  ocId: string
  documentos: Documento[]
  puedeEditar: boolean
}) {
  const [tipo, setTipo] = useState('CONTRATO')
  const [subiendo, setSubiendo] = useState(false)
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSubiendo(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!data.url) throw new Error('sin url')
      startTransition(async () => {
        await adjuntarDocumentoOC(ocId, tipo, file.name, data.url)
      })
    } catch {
      alert('Error al subir el documento')
    } finally {
      setSubiendo(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
        <Paperclip className="w-4 h-4 text-gray-400" />
        <span className="font-semibold text-gray-700">Documentos adjuntos</span>
        <span className="text-xs text-gray-400">Contratos, guías y otros documentos de la orden</span>
      </div>

      <div className="px-5 py-4 space-y-3">
        {documentos.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Sin documentos adjuntos</p>
        ) : (
          <ul className="space-y-1.5">
            {documentos.map(doc => (
              <li key={doc.id} className="flex items-center gap-3 text-sm">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 whitespace-nowrap">
                  {TIPO_DOCUMENTO_OC_LABELS[doc.tipo] ?? doc.tipo}
                </span>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#13602C] hover:underline truncate flex items-center gap-1"
                >
                  {doc.nombre}
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
                <span className="ml-auto text-xs text-gray-400 whitespace-nowrap">{doc.subidoPor} · {doc.fecha}</span>
                {puedeEditar && (
                  <form action={eliminarDocumentoOC.bind(null, doc.id)}>
                    <button type="submit" className="text-gray-300 hover:text-red-600" title="Eliminar documento">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}

        {puedeEditar && (
          <div className="flex items-center gap-2 pt-1">
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value)}
              className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#13602C]"
            >
              {Object.entries(TIPO_DOCUMENTO_OC_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <label className="flex items-center gap-1 cursor-pointer text-xs px-2.5 py-1.5 rounded-lg border border-[#13602C] text-[#13602C] hover:bg-green-50 transition-colors">
              {subiendo ? <span className="text-gray-400">Subiendo...</span> : (<><Upload className="w-3.5 h-3.5" />Adjuntar documento</>)}
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                className="hidden"
                onChange={handleChange}
                disabled={subiendo}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
