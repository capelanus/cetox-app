'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { crearOrdenCompra } from '@/app/actions/ordenes-compra'

interface Requerimiento {
  id: string
  numero: number
  anio: number
  descripcion: string
}

interface Proveedor {
  id: string
  razonSocial: string
  ruc: string
}

interface CotizacionProveedor {
  id: string
  numero: number
  anio: number
  proveedorId: string
  total: number
  moneda: string
  items: { descripcion: string; cantidad: number; unidad: string; precioUnitario: number }[]
}

interface LineItem {
  descripcion: string
  cantidad: number
  unidad: string
  precioUnitario: number
}

export default function NuevaOrdenCompraPage() {
  const searchParams = useSearchParams()
  const reqParam = searchParams.get('req')
  const cotParam = searchParams.get('cot')

  const [requerimientos, setRequerimientos] = useState<Requerimiento[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [cotizaciones, setCotizaciones] = useState<CotizacionProveedor[]>([])
  const [selectedReq, setSelectedReq] = useState<string>(reqParam || '')
  const [selectedCot, setSelectedCot] = useState<string>(cotParam || '')
  const [selectedProv, setSelectedProv] = useState<string>('')
  const [items, setItems] = useState<LineItem[]>([{ descripcion: '', cantidad: 1, unidad: 'Unidad', precioUnitario: 0 }])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/operaciones/requerimientos').then(r => r.json()),
      fetch('/api/operaciones/proveedores').then(r => r.json()),
      fetch('/api/operaciones/cotizaciones-proveedor').then(r => r.json()),
    ]).then(([reqs, provs, cots]) => {
      setRequerimientos(reqs)
      setProveedores(provs)
      setCotizaciones(cots)
      setLoading(false)

      // Pre-fill from cotizacion
      if (cotParam) {
        const cot = cots.find((c: CotizacionProveedor) => c.id === cotParam)
        if (cot) {
          setSelectedProv(cot.proveedorId)
          if (cot.items?.length) {
            setItems(cot.items.map((item: LineItem) => ({
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              unidad: item.unidad,
              precioUnitario: item.precioUnitario,
            })))
          }
        }
      }
    }).catch(() => setLoading(false))
  }, [cotParam])

  const addItem = () => setItems(prev => [...prev, { descripcion: '', cantidad: 1, unidad: 'Unidad', precioUnitario: 0 }])
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof LineItem, value: string | number) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const subtotal = items.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0)
  const igv = subtotal * 0.18
  const total = subtotal + igv

  async function handleSubmit(formData: FormData) {
    formData.set('items', JSON.stringify(items))
    if (selectedProv) formData.set('proveedorId', selectedProv)
    await crearOrdenCompra(formData)
  }

  if (loading) return <div className="p-6 text-gray-500">Cargando...</div>

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/operaciones/ordenes-compra">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Volver</Button>
        </Link>
        <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>Nueva Orden de Compra</h1>
      </div>

      <form action={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Información general</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Requerimiento *</label>
              <select
                name="requerimientoId"
                required
                value={selectedReq}
                onChange={e => setSelectedReq(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
              >
                <option value="">Seleccionar requerimiento...</option>
                {requerimientos.map(req => (
                  <option key={req.id} value={req.id}>
                    REQ-{String(req.numero).padStart(4, '0')}-{req.anio} — {req.descripcion}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cotización de proveedor (opcional)</label>
              <select
                name="cotizacionProveedorId"
                value={selectedCot}
                onChange={e => setSelectedCot(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
              >
                <option value="">Sin cotización asociada</option>
                {cotizaciones.filter(c => !selectedReq || c.id === cotParam).map(cot => (
                  <option key={cot.id} value={cot.id}>
                    COTP-{String(cot.numero).padStart(4, '0')}-{cot.anio} — {cot.moneda} {cot.total.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
              <select
                name="proveedorId"
                required
                value={selectedProv}
                onChange={e => setSelectedProv(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
              >
                <option value="">Seleccionar proveedor...</option>
                {proveedores.map(prov => (
                  <option key={prov.id} value={prov.id}>{prov.razonSocial} ({prov.ruc})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
              <select name="moneda" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]">
                <option value="PEN">PEN (Soles)</option>
                <option value="USD">USD (Dólares)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha entrega estimada</label>
              <input name="fechaEntregaEstimada" type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condiciones de pago</label>
              <input name="condicionesPago" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lugar de entrega</label>
              <input name="lugarEntrega" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea name="observaciones" rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Ítems de la orden</h2>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-1" />Agregar ítem
            </Button>
          </div>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 rounded-lg">
                <div className="col-span-4">
                  <label className="block text-xs text-gray-500 mb-1">Descripción</label>
                  <input
                    value={item.descripcion}
                    onChange={e => updateItem(i, 'descripcion', e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                  <input
                    type="number"
                    value={item.cantidad}
                    min={0.01}
                    step={0.01}
                    onChange={e => updateItem(i, 'cantidad', parseFloat(e.target.value))}
                    required
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Unidad</label>
                  <input
                    value={item.unidad}
                    onChange={e => updateItem(i, 'unidad', e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Precio unit.</label>
                  <input
                    type="number"
                    value={item.precioUnitario}
                    min={0}
                    step={0.01}
                    onChange={e => updateItem(i, 'precioUnitario', parseFloat(e.target.value))}
                    required
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-gray-500 mb-1">Subtotal</label>
                  <p className="text-sm font-mono text-gray-700 py-1.5">{(item.cantidad * item.precioUnitario).toFixed(2)}</p>
                </div>
                <div className="col-span-1 pt-5">
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <div className="text-sm space-y-1 min-w-[200px]">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal:</span>
                <span className="font-mono">{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">IGV (18%):</span>
                <span className="font-mono">{igv.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-[#13602C]">
                <span>Total:</span>
                <span className="font-mono">{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" className="bg-[#13602C] hover:bg-[#0e4a21] text-white">Emitir Orden de Compra</Button>
          <Link href="/operaciones/ordenes-compra">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
