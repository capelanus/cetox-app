'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { registrarFactura } from '@/app/actions/facturas-proveedor'

interface OC {
  id: string
  numero: number
  anio: number
  proveedor: { razonSocial: string }
  total: number
  moneda: string
}

export default function NuevaFacturaPage() {
  const searchParams = useSearchParams()
  const ocParam = searchParams.get('oc')

  const [ocs, setOcs] = useState<OC[]>([])
  const [selectedOC, setSelectedOC] = useState<string>(ocParam || '')
  const [subtotal, setSubtotal] = useState('')
  const [loading, setLoading] = useState(true)

  const igv = subtotal ? (parseFloat(subtotal) * 0.18).toFixed(2) : '0.00'
  const total = subtotal ? (parseFloat(subtotal) * 1.18).toFixed(2) : '0.00'

  useEffect(() => {
    fetch('/api/operaciones/ordenes-compra')
      .then(r => r.json())
      .then((data: OC[]) => {
        setOcs(data)
        setLoading(false)
        if (ocParam) {
          const oc = data.find((o: OC) => o.id === ocParam)
          if (oc) {
            const sub = (oc.total / 1.18).toFixed(2)
            setSubtotal(sub)
          }
        }
      })
      .catch(() => setLoading(false))
  }, [ocParam])

  if (loading) return <div className="p-6 text-gray-500">Cargando...</div>

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/operaciones/facturas">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Volver</Button>
        </Link>
        <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>Registrar Factura</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form action={registrarFactura} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Orden de Compra *</label>
              <select
                name="ordenCompraId"
                required
                value={selectedOC}
                onChange={e => setSelectedOC(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
              >
                <option value="">Seleccionar OC...</option>
                {ocs.map(oc => (
                  <option key={oc.id} value={oc.id}>
                    OC-{String(oc.numero).padStart(4, '0')}-{oc.anio} — {oc.proveedor.razonSocial}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serie</label>
              <input name="serie" placeholder="F001" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
              <input name="numero" required placeholder="00001234" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
              <select name="moneda" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]">
                <option value="PEN">PEN (Soles)</option>
                <option value="USD">USD (Dólares)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de emisión *</label>
              <input name="fechaEmision" type="date" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha vencimiento</label>
              <input name="fechaVencimiento" type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtotal *</label>
              <input
                name="subtotal"
                type="number"
                required
                min={0}
                step={0.01}
                value={subtotal}
                onChange={e => setSubtotal(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IGV (calculado)</label>
              <input
                name="igv"
                type="number"
                value={igv}
                readOnly
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500"
              />
            </div>
            <div className="col-span-2 flex justify-end">
              <div className="text-sm space-y-1 min-w-[180px]">
                <div className="flex justify-between font-bold text-[#13602C]">
                  <span>Total:</span>
                  <span className="font-mono">{total}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="bg-[#13602C] hover:bg-[#0e4a21] text-white">Registrar factura</Button>
            <Link href="/operaciones/facturas">
              <Button type="button" variant="outline">Cancelar</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
