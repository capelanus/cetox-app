'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Upload, X, FileText, FileSpreadsheet } from 'lucide-react'
import { cargarResultado } from '@/app/actions/oda'

interface PendingFile {
  file: File
  preview: string | null
  isImage: boolean
}

interface Props {
  odaId: string
  initialTexto?: string
  initialImagenes?: string[]
  initialArchivos?: string[]
}

function FileIcon({ type }: { type: string }) {
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('xlsx')) {
    return <FileSpreadsheet className="h-8 w-8 text-green-600" />
  }
  return <FileText className="h-8 w-8 text-blue-600" />
}

export function ResultadoForm({ odaId, initialTexto = '', initialImagenes = [], initialArchivos = [] }: Props) {
  const [texto, setTexto] = useState(initialTexto)
  const [pending, setPending] = useState<PendingFile[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff']
  const ALLOWED_DOCS = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ]

  const addFiles = useCallback((files: File[]) => {
    files.forEach((file) => {
      const isImage = ALLOWED_IMAGE.includes(file.type)
      const isDoc = ALLOWED_DOCS.includes(file.type)
      if (!isImage && !isDoc) return
      const preview = isImage ? URL.createObjectURL(file) : null
      setPending((p) => [...p, { file, preview, isImage }])
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const el = dropZoneRef.current
    if (!el) return

    const onDragOver = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragging(true) }
    const onDragEnter = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragging(true) }
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault(); e.stopPropagation()
      if (!el.contains(e.relatedTarget as Node)) setDragging(false)
    }
    const onDrop = (e: DragEvent) => {
      e.preventDefault(); e.stopPropagation(); setDragging(false)
      if (e.dataTransfer?.files?.length) addFiles(Array.from(e.dataTransfer.files))
    }

    el.addEventListener('dragover', onDragOver)
    el.addEventListener('dragenter', onDragEnter)
    el.addEventListener('dragleave', onDragLeave)
    el.addEventListener('drop', onDrop)
    return () => {
      el.removeEventListener('dragover', onDragOver)
      el.removeEventListener('dragenter', onDragEnter)
      el.removeEventListener('dragleave', onDragLeave)
      el.removeEventListener('drop', onDrop)
    }
  }, [addFiles])

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const imageItems = Array.from(e.clipboardData.items).filter((i) => i.type.startsWith('image/'))
      if (imageItems.length === 0) return
      e.preventDefault()
      addFiles(imageItems.map((i) => i.getAsFile()).filter(Boolean) as File[])
    },
    [addFiles]
  )

  const removePending = (idx: number) => {
    setPending((p) => {
      const item = p[idx]
      if (item.preview) URL.revokeObjectURL(item.preview)
      return p.filter((_, i) => i !== idx)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const fd = new FormData()
    fd.set('resultadoTexto', texto)
    let imgIdx = 0
    let docIdx = 0
    pending.forEach((pf) => {
      if (pf.isImage) {
        fd.append(`imagen_${imgIdx++}`, pf.file)
      } else {
        fd.append(`archivo_${docIdx++}`, pf.file)
      }
    })
    try {
      await cargarResultado(odaId, fd)
    } catch (err) {
      if ((err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw err
      console.error(err)
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="resultadoTexto">Resultado del ensayo *</Label>
        <Textarea
          id="resultadoTexto"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onPaste={handlePaste}
          rows={6}
          required
          placeholder="Ingrese los resultados obtenidos... también puede pegar capturas con Ctrl+V / Cmd+V"
        />
        <p className="text-xs text-slate-400">
          Pegue imágenes directamente aquí con{' '}
          <kbd className="px-1 py-0.5 bg-slate-100 rounded text-xs">Ctrl+V</kbd>
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Archivos adjuntos</Label>
        <div
          ref={dropZoneRef}
          className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors select-none ${
            dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-6 w-6 mx-auto text-slate-400 mb-1.5" />
          <p className="text-sm text-slate-500">
            Arrastre archivos aquí o{' '}
            <span className="text-blue-600 font-medium">seleccione archivos</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Imágenes (PNG, JPG, BMP, TIFF) · Documentos (PDF, Word .docx, Excel .xlsx)
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.docx,.doc,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
        />
      </div>

      {/* Previously saved images */}
      {initialImagenes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">Imágenes guardadas ({initialImagenes.length})</p>
          <div className="flex flex-wrap gap-2">
            {initialImagenes.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer">
                <img
                  src={url}
                  alt={`Resultado ${i + 1}`}
                  className="h-24 w-24 object-cover rounded-lg border border-slate-200 hover:opacity-80 transition-opacity"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Previously saved docs */}
      {initialArchivos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">Documentos guardados ({initialArchivos.length})</p>
          <div className="flex flex-wrap gap-2">
            {initialArchivos.map((url, i) => {
              const filename = url.split('/').pop() ?? `archivo-${i + 1}`
              return (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm hover:bg-slate-50 text-slate-700"
                >
                  <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                  {filename}
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* Pending new files */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">Nuevos archivos a subir ({pending.length})</p>
          <div className="flex flex-wrap gap-2">
            {pending.map((pf, i) => (
              <div key={i} className="relative">
                {pf.isImage && pf.preview ? (
                  <img
                    src={pf.preview}
                    alt={`Nueva ${i + 1}`}
                    className="h-24 w-24 object-cover rounded-lg border border-slate-200"
                  />
                ) : (
                  <div className="h-24 w-24 flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-2 text-center">
                    <FileIcon type={pf.file.type} />
                    <span className="text-xs text-slate-500 mt-1 truncate w-full text-center">{pf.file.name.split('.').pop()?.toUpperCase()}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removePending(i)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button type="submit" disabled={submitting} style={{ backgroundColor: '#1F4E79' }}>
        {submitting ? 'Guardando...' : 'Guardar resultado y crear informe'}
      </Button>
    </form>
  )
}
