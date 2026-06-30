'use client'
import { useState, useTransition } from 'react'
import { CreditCard, Upload, CheckCircle, ExternalLink, FileText } from 'lucide-react'
import { subirComprobantePago } from '@/app/actions/ordenes-compra'

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
  comprobantePagoUrl: string | null
  items: Item[]
  moneda: string
}

export default function ComprobantePago({ ocId, facturaOcUrl, comprobantePagoUrl, items, moneda }: Props) {
  const [uploading, setUploading] = useState(false)
  const [localUrl, setLocalUrl] = useState<string | null>(comprobantePagoUrl)
  const [, startTransition] = useTransition()

  const itemsConFactura = items.filter(i => i.facturaUrl)

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
        startTransition(async () => {
          await subirComprobantePago(ocId, data.url)
        })
      }
    } catch {
      alert('Error al subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-gray-400" />
        <span className="font-semibold text-gray-700">Facturas y pago</span>
      </div>

      {/* Facturas del proveedor (read-only para calidad) */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Facturas adjuntas por logística</p>
        {facturaOcUrl ? (
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">Factura de la OC completa</span>
            <a
              href={facturaOcUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-xs text-[#13602C] hover:underline font-medium"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Ver factura
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Sin factura adjunta aún</p>
        )}
        {itemsConFactura.length > 0 && (
          <div className="mt-2 space-y-1">
            {items.map((item, i) => item.facturaUrl ? (
              <div key={item.id} className="flex items-center gap-2">
                <span className="text-xs text-gray-400">#{i + 1}</span>
                <span className="text-sm text-gray-700 truncate flex-1">{item.descripcion}</span>
                <span className="text-xs text-gray-400">{moneda} {item.subtotal.toFixed(2)}</span>
                <a
                  href={item.facturaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-[#13602C] hover:underline font-medium"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ver
                </a>
              </div>
            ) : null)}
          </div>
        )}
      </div>

      {/* Comprobante de pago (upload by calidad) */}
      <div className="px-5 py-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Comprobante de pago</p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Comprobante de transferencia / pago</p>
            <p className="text-xs text-gray-400 mt-0.5">Voucher de pago al proveedor</p>
          </div>
          <div className="flex items-center gap-2">
            {localUrl && (
              <a
                href={localUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[#13602C] hover:underline font-medium"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Ver comprobante
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
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
                  {localUrl ? 'Reemplazar' : 'Subir comprobante'}
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
        </div>
      </div>
    </div>
  )
}
