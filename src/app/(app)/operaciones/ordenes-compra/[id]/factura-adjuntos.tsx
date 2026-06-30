'use client'
import { useState, useTransition } from 'react'
import { Paperclip, Upload, CheckCircle, X, ExternalLink } from 'lucide-react'
import { adjuntarFacturaOC, adjuntarFacturaItem } from '@/app/actions/ordenes-compra'

interface Item {
  id: string
  descripcion: string
  cantidad: number
  unidad: string
  precioUnitario: number
  subtotal: number
  facturaUrl: string | null
}

interface Props {
  ocId: string
  facturaOcUrl: string | null
  items: Item[]
  moneda: string
}

function UploadBtn({
  label,
  currentUrl,
  onUploaded,
}: {
  label: string
  currentUrl: string | null
  onUploaded: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [localUrl, setLocalUrl] = useState<string | null>(currentUrl)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        setLocalUrl(data.url)
        onUploaded(data.url)
      }
    } catch {
      alert('Error al subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {localUrl ? (
        <a
          href={localUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-[#13602C] hover:underline font-medium"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Ver factura
          <ExternalLink className="w-3 h-3" />
        </a>
      ) : null}
      <label className={`flex items-center gap-1 cursor-pointer text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
        localUrl
          ? 'border-gray-200 text-gray-500 hover:bg-gray-50'
          : 'border-[#13602C] text-[#13602C] hover:bg-green-50'
      }`}>
        {uploading ? (
          <span className="text-gray-400">Subiendo...</span>
        ) : (
          <>
            <Upload className="w-3.5 h-3.5" />
            {localUrl ? 'Reemplazar' : label}
          </>
        )}
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />
      </label>
    </div>
  )
}

export default function FacturaAdjuntos({ ocId, facturaOcUrl, items, moneda }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleOCUpload(url: string) {
    startTransition(async () => {
      await adjuntarFacturaOC(ocId, url)
    })
  }

  function handleItemUpload(itemId: string, url: string) {
    startTransition(async () => {
      await adjuntarFacturaItem(itemId, url)
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="font-semibold text-gray-700 flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-gray-400" />
          Facturas adjuntas
        </span>
        {isPending && <span className="text-xs text-gray-400">Guardando...</span>}
      </div>

      {/* Factura de la OC completa */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Factura de la OC completa</p>
          <p className="text-xs text-gray-400 mt-0.5">Un documento que cubre todos los ítems de la orden</p>
        </div>
        <UploadBtn
          label="Adjuntar factura"
          currentUrl={facturaOcUrl}
          onUploaded={handleOCUpload}
        />
      </div>

      {/* Facturas por ítem */}
      <div className="divide-y divide-gray-50">
        {items.map((item, i) => (
          <div key={item.id} className="px-5 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 flex-shrink-0">#{i + 1}</span>
                <p className="text-sm text-gray-700 truncate">{item.descripcion}</p>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 ml-4">
                {item.cantidad} {item.unidad} × {item.precioUnitario.toFixed(2)} = {moneda} {item.subtotal.toFixed(2)}
              </p>
            </div>
            <UploadBtn
              label="Adjuntar"
              currentUrl={item.facturaUrl}
              onUploaded={(url) => handleItemUpload(item.id, url)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
