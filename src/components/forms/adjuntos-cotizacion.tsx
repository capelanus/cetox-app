'use client'

import { useRef, useState } from 'react'
import { Paperclip, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { ARCHIVOS_ACEPTADOS, iconoDe, formatTamano } from '@/components/archivo-icono'
import { eliminarArchivoSubido } from '@/app/actions/archivos'

interface Adjunto { nombre: string; url: string; tamano: number }

// Adjuntos mientras se llena el formulario de cotización. Los archivos se
// suben al instante (así el usuario ve que entraron) y viajan como campos
// ocultos; es crearCotizacion quien los vincula a la cotización recién creada,
// porque antes de guardar no existe un id al que colgarlos.
export function AdjuntosCotizacion() {
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([])
  const [subiendo, setSubiendo] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? [])
    if (archivos.length === 0) return
    setSubiendo(true)
    try {
      for (const file of archivos) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (!data.url) throw new Error('sin url')
        setAdjuntos(prev => [...prev, { nombre: file.name, url: data.url, tamano: file.size }])
      }
    } catch {
      toast.error('No se pudo subir el archivo. Inténtalo de nuevo.')
    } finally {
      setSubiendo(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function quitar(a: Adjunto) {
    setAdjuntos(prev => prev.filter(x => x.url !== a.url))
    // El archivo ya está en el almacén; si no va a quedar en la cotización, se borra.
    eliminarArchivoSubido(a.url).catch(() => {})
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Paperclip className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-semibold text-slate-700">Documentos del cliente</span>
        <span className="text-xs text-slate-400">Word, Excel, PDF, imágenes o correos (.eml) · opcional</span>
      </div>

      {adjuntos.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {adjuntos.map(a => {
            const { Icono, color } = iconoDe(a.nombre)
            return (
              <li key={a.url} className="flex items-center gap-3 px-3 py-2">
                <Icono className={`w-4 h-4 shrink-0 ${color}`} />
                <span className="text-sm text-slate-800 truncate flex-1">{a.nombre}</span>
                <span className="text-xs text-slate-400">{formatTamano(a.tamano)}</span>
                <button type="button" onClick={() => quitar(a)} className="text-slate-300 hover:text-red-600" title="Quitar">
                  <X className="w-4 h-4" />
                </button>
                <input type="hidden" name="documentos" value={JSON.stringify(a)} />
              </li>
            )
          })}
        </ul>
      )}

      <label className="inline-flex items-center gap-1.5 cursor-pointer text-sm px-3 py-1.5 rounded-lg border border-[#13602C] text-[#13602C] hover:bg-green-50 transition-colors">
        {subiendo ? <span className="text-slate-400">Subiendo...</span> : (<><Upload className="w-4 h-4" />Adjuntar documentos</>)}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ARCHIVOS_ACEPTADOS}
          className="hidden"
          onChange={handleChange}
          disabled={subiendo}
        />
      </label>
    </div>
  )
}
