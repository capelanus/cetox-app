'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Trash2, FileText, File, Share2, ChevronDown, ChevronUp } from 'lucide-react'
import {
  subirDocumentoCalidad,
  eliminarDocumentoCalidad,
  toggleAccesoDocumento,
} from '@/app/actions/documentos-calidad'
import { DEPARTAMENTOS, type Departamento } from '@/lib/calidad-constants'

interface Acceso { departamento: string }

interface Documento {
  id: string
  nombre: string
  archivoUrl: string
  createdAt: Date | string
  subidoPor: { nombre: string }
  accesos: Acceso[]
}

interface Props {
  categoria: string
  categoriaLabel: string
  documentos: Documento[]
}

function formatFechaCorta(d: Date | string) {
  return new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function DocRow({ doc, categoria }: { doc: Documento; categoria: string }) {
  const [showShare, setShowShare] = useState(false)
  const [pending, startTransition] = useTransition()
  const esPdf = /\.pdf$/i.test(doc.archivoUrl.split('?')[0])

  function toggleDept(dept: Departamento) {
    startTransition(() => toggleAccesoDocumento(doc.id, dept))
  }

  return (
    <li className="px-5 py-3.5">
      <div className="flex items-center gap-3">
        {esPdf
          ? <FileText className="w-5 h-5 text-red-500 shrink-0" />
          : <File className="w-5 h-5 text-slate-400 shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 truncate">{doc.nombre}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {formatFechaCorta(doc.createdAt)} · {doc.subidoPor.nombre}
            {doc.accesos.length > 0 && (
              <span className="ml-2 text-green-600 font-medium">
                · Compartido con {doc.accesos.length} depto.
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowShare(v => !v)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-medium transition-colors ${
              showShare
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            Compartir
            {showShare ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button
            onClick={() => {
              if (!confirm('¿Eliminar este documento?')) return
              startTransition(() => eliminarDocumentoCalidad(doc.id, categoria))
            }}
            disabled={pending}
            className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showShare && (
        <div className="mt-3 ml-8 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
            Compartir con departamentos (solo lectura)
          </p>
          <div className="flex flex-wrap gap-2">
            {DEPARTAMENTOS.map(dept => {
              const activo = doc.accesos.some(a => a.departamento === dept.key)
              return (
                <button
                  key={dept.key}
                  onClick={() => toggleDept(dept.key as Departamento)}
                  disabled={pending}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    activo
                      ? 'bg-green-100 border-green-400 text-green-800'
                      : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  {activo ? '✓ ' : ''}{dept.label}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Los departamentos seleccionados pueden visualizar el documento pero no descargarlo.
          </p>
        </div>
      )}
    </li>
  )
}

export function DocsCalidadSection({ categoria, categoriaLabel, documentos }: Props) {
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [nombre, setNombre] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Selecciona un archivo'); return }
    if (!nombre.trim()) { setError('Ingresa un nombre'); return }
    setError('')
    setUploading(true)

    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const { url, error: uploadError } = await res.json()
      if (uploadError || !url) throw new Error(uploadError ?? 'Error al subir')

      startTransition(async () => {
        await subirDocumentoCalidad(categoria, nombre.trim(), url)
        setNombre('')
        setFile(null)
        const input = document.getElementById('doc-file-input') as HTMLInputElement
        if (input) input.value = ''
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setUploading(false)
    }
  }

  const singular = categoriaLabel.endsWith('s')
    ? categoriaLabel.slice(0, -1)
    : categoriaLabel

  return (
    <div className="space-y-6">
      {/* Upload form */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="font-semibold text-slate-700 text-sm mb-4">Subir nuevo {singular.toLowerCase()}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="doc-nombre">Nombre del documento</Label>
            <Input
              id="doc-nombre"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder={`Ej: ${singular} de análisis de agua`}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-file-input">Archivo (PDF, Word, Excel, imagen…)</Label>
            <Input
              id="doc-file-input"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            type="submit"
            disabled={uploading || isPending}
            style={{ backgroundColor: '#13602C' }}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Subiendo…' : isPending ? 'Guardando…' : 'Subir documento'}
          </Button>
        </form>
      </div>

      {/* Document list */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b bg-slate-50">
          <p className="text-sm font-semibold text-slate-600">
            {documentos.length === 0
              ? `Sin ${categoriaLabel.toLowerCase()} cargados`
              : `${documentos.length} ${categoriaLabel.toLowerCase()} cargados`}
          </p>
        </div>
        {documentos.length > 0 && (
          <ul className="divide-y">
            {documentos.map(doc => (
              <DocRow key={doc.id} doc={doc} categoria={categoria} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
