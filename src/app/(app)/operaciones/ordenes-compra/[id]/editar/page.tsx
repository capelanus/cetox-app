'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { actualizarOC } from '@/app/actions/ordenes-compra'

interface CotizacionProveedor {
  id: string
  numero: number
  anio: number
  total: number
  moneda: string
}

interface LineItem {
  descripcion: string
  cantidad: number
  unidad: string
  precioUnitario: number
}

interface OCData {
  id: string
  condicionesPago: string | null
  lugarEntrega: string | null
  fechaEntregaEstimada: string | null
  observaciones: string | null
  moneda: string
  items: LineItem[]
  cotizacionesProveedor: { cotizacionProveedor: CotizacionProveedor }[]
}

export default function EditarOrdenCompraPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [oc, setOc] = useState<OCData | null>(null)
  const [allCots, setAllCots] = useState<CotizacionProveedor[]>([])
  const [items, setItems] = useState<LineItem[]>([])
  const [selectedCots, setSelectedCots] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/operaciones/ordenes-compra/${id}`).then(r => r.json()),
      fetch('/api/operaciones/cotizaciones-proveedor').then(r => r.json()),
    ]).then(([ocData, cots]) => {
      setOc(ocData)
      setItems(ocData.items)
      setSelectedCots(ocData.cotizacionesProveedor.map((j: { cotizacionProveedor: CotizacionProveedor }) => j.cotizacionProveedor.id))
      setAllCots(cots)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const addItem = () => setItems(prev => [...prev, { descripcion: '', cantidad: 1, unidad: 'Unidad', precioUnitario: 0 }])
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof LineItem, value: string | number) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }
  const toggleCot = (cotId: string, checked: boolean) => {
    setSelectedCots(prev => checked ? [...prev, cotId] : prev.filter(c => c !== cotId))
  }

  const subtotal = items.reduce((s, i) => s + i.cantidad * i.precioUnitario, 0)
  const igv = subtotal * 0.18
  const total = subtotal + igv

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    formData.set('items', JSON.stringify(items))
    selectedCots.forEach(cid => formData.append('cotizacionProveedorId', cid))
    await actualizarOC(id, formData)
  }

  if (loading) return <div className="p-6 text-gray-500">Cargando...</div>
  if (!oc) return <div className="p-6 text-red-500">No encontrado</div>

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/operaciones/ordenes-compra/${id}`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Volver</Button>
        </Link>
        <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>Editar Orden de Compra</h1>
      </div>

      <form action={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Información general</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condiciones de pago</label>
              <input
                name="condicionesPago"
                defaultValue={oc.condicionesPago ?? ''}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lugar de entrega</label>
              <input
                name="lugarEntrega"
                defaultValue={oc.lugarEntrega ?? ''}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha entrega estimada</label>
              <input
                name="fechaEntregaEstimada"
                type="date"
                defaultValue={oc.fechaEntregaEstimada?.split('T')[0] ?? ''}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea
                name="observaciones"
                rows={2}
                defaultValue={oc.observaciones ?? ''}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
              />
            </div>
            {allCots.length > 0 && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cotizaciones de proveedor vinculadas</label>
                <div className="space-y-1 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {allCots.map(cot => (
                    <label key={cot.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 rounded px-2 py-1">
                      <input
                        type="checkbox"
                        checked={selectedCots.includes(cot.id)}
                        onChange={e => toggleCot(cot.id, e.target.checked)}
                        className="w-4 h-4 accent-[#13602C]"
                      />
                      <span>COTP-{String(cot.numero).padStart(4, '0')}-{cot.anio} — {cot.moneda} {cot.total.toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
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
                <span>Total {oc.moneda}:</span>
                <span className="font-mono">{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="bg-[#13602C] hover:bg-[#0e4a21] text-white">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          <Link href={`/operaciones/ordenes-compra/${id}`}>
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
