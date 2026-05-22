'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Upload, X } from 'lucide-react'
import { cargarResultado } from '@/app/actions/oda'

interface PendingImage {
  file: File
  preview: string
}

interface Props {
  odaId: string
  initialTexto?: string
  initialImagenes?: string[]
}

export function ResultadoForm({ odaId, initialTexto = '', initialImagenes = [] }: Props) {
  const [texto, setTexto] = useState(initialTexto)
  const [pending, setPending] = useState<PendingImage[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const addFiles = useCallback((files: File[]) => {
    files.forEach((file) => {
      const preview = URL.createObjectURL(file)
      setPending((p) => [...p, { file, preview }])
    })
  }, [])

  // Native drag-and-drop via ref — bypasses React's synthetic event system
  useEffect(() => {
    const el = dropZoneRef.current
    if (!el) return

    const onDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragging(true)
    }
    const onDragEnter = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragging(true)
    }
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      // Only clear if leaving the drop zone entirely (not entering a child)
      if (!el.contains(e.relatedTarget as Node)) setDragging(false)
    }
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragging(false)
      const files = e.dataTransfer?.files
      if (files && files.length > 0) addFiles(Array.from(files))
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
      const imageItems = Array.from(e.clipboardData.items).filter((i) =>
        i.type.startsWith('image/')
      )
      if (imageItems.length === 0) return
      e.preventDefault()
      const files = imageItems.map((i) => i.getAsFile()).filter(Boolean) as File[]
      addFiles(files)
    },
    [addFiles]
  )

  const removePending = (idx: number) => {
    setPending((p) => {
      URL.revokeObjectURL(p[idx].preview)
      return p.filter((_, i) => i !== idx)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const fd = new FormData()
    fd.set('resultadoTexto', texto)
    pending.forEach((img, i) => fd.append(`imagen_${i}`, img.file))
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
      {/* Text result */}
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

      {/* Drop zone */}
      <div className="space-y-1.5">
        <Label>Imágenes / Capturas de instrumentos</Label>
        <div
          ref={dropZoneRef}
          className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors select-none ${
            dragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-6 w-6 mx-auto text-slate-400 mb-1.5" />
          <p className="text-sm text-slate-500">
            Arrastre imágenes aquí o{' '}
            <span className="text-blue-600 font-medium">seleccione archivos</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">PNG, JPG, BMP, TIFF — múltiples archivos permitidos</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
        />
      </div>

      {/* Previously saved images */}
      {initialImagenes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">
            Imágenes guardadas ({initialImagenes.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {initialImagenes.map((url, i) => (
              <a key={i} href={`/${url}`} target="_blank" rel="noreferrer">
                <img
                  src={`/${url}`}
                  alt={`Resultado ${i + 1}`}
                  className="h-24 w-24 object-cover rounded-lg border border-slate-200 hover:opacity-80 transition-opacity"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Pending new images */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">
            Nuevas imágenes a subir ({pending.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {pending.map((img, i) => (
              <div key={i} className="relative">
                <img
                  src={img.preview}
                  alt={`Nueva ${i + 1}`}
                  className="h-24 w-24 object-cover rounded-lg border border-slate-200"
                />
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
