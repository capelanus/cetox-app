'use client'

import { useState, useTransition } from 'react'
import { FileText, FileImage, File as FileIcon, Trash2, Upload, ExternalLink, Loader2 } from 'lucide-react'
import { agregarDocumentoAuditoria, eliminarDocumentoAuditoria } from '@/app/actions/auditorias'

interface Doc {
  id:         string
  nombre:     string
  archivoUrl: string
  createdAt:  string
}

interface Props {
  auditoriaId: string
  documentos:  Doc[]
}

function iconForUrl(url: string) {
  const ext = url.split('.').pop()?.toLowerCase()
  if (['png','jpg','jpeg','gif','webp'].includes(ext ?? '')) return FileImage
  if (ext === 'pdf') return FileText
  return FileIcon
}

export default function AuditoriaDocs({ auditoriaId, documentos }: Props) {
  const [uploading, setUploading]     = useState(false)
  const [eliminandoId, setEliminando] = useState<string | null>(null)
  const [nombre, setNombre]           = useState('')
  const [, startTransition]           = useTransition()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const n = nombre.trim() || file.name
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res  = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        startTransition(async () => {
          await agregarDocumentoAuditoria(auditoriaId, n, data.url)
        })
        setNombre('')
        e.target.value = ''
      }
    } catch {
      alert('Error al subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  function handleEliminar(docId: string, nombre: string) {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return
    setEliminando(docId)
    startTransition(async () => {
      try {
        await eliminarDocumentoAuditoria(docId)
      } catch {
        alert('Error al eliminar')
      } finally {
        setEliminando(null)
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-700">
        Documentos adjuntos
      </div>

      {/* Upload */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Nombre del documento (opcional)</label>
          <input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej. Informe de no conformidades"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#13602C]"
          />
        </div>
        <label className={`flex items-center gap-1.5 cursor-pointer text-sm px-4 py-2 rounded-lg border transition-colors ${
          uploading ? 'border-gray-200 text-gray-400' : 'border-[#13602C] text-[#13602C] hover:bg-green-50'
        }`}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Subiendo…' : 'Adjuntar archivo'}
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
        </label>
      </div>

      {/* List */}
      {documentos.length === 0 ? (
        <div className="px-5 py-6 text-sm text-gray-400 text-center">
          No hay documentos adjuntos aún.
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {documentos.map(doc => {
            const Icon = iconForUrl(doc.archivoUrl)
            return (
              <li key={doc.id} className="px-5 py-3 flex items-center gap-3" style={{ opacity: eliminandoId === doc.id ? 0.4 : 1 }}>
                <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 flex-1 truncate">{doc.nombre}</span>
                <a
                  href={doc.archivoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#13602C] hover:underline flex items-center gap-1 text-xs"
                >
                  Ver <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => handleEliminar(doc.id, doc.nombre)}
                  disabled={eliminandoId === doc.id}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  {eliminandoId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
