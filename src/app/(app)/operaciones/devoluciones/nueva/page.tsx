'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { crearDevolucion } from '@/app/actions/devoluciones'

interface Recepcion {
  id: string
  numero: number
  anio: number
  items: { descripcion: string; cantidadRecibida: number; unidad: string }[]
  ordenCompra: { proveedor: { razonSocial: string } }
}

interface DevItem {
  descripcion: string
  cantidad: number
  unidad: string
  motivo: string
}

export default function NuevaDevolucionPage() {
  const searchParams = useSearchParams()
  const recParam = searchParams.get('rec')

  const [recepciones, setRecepciones] = useState<Recepcion[]>([])
  const [selectedRec, setSelectedRec] = useState<string>(recParam || '')
  const [items, setItems] = useState<DevItem[]>([{ descripcion: '', cantidad: 1, unidad: 'Unidad', motivo: '' }])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/operaciones/recepciones')
      .then(r => r.json())
      .then((data: Recepcion[]) => {
        setRecepciones(data)
        setLoading(false)
        if (recParam) {
          const rec = data.find((r: Recepcion) => r.id === recParam)
          if (rec?.items?.length) {
            setItems(rec.items.map(item => ({
              descripcion: item.descripcion,
              cantidad: item.cantidadRecibida,
              unidad: item.unidad,
              motivo: '',
            })))
          }
        }
      })
      .catch(() => setLoading(false))
  }, [recParam])

  const addItem = () => setItems(prev => [...prev, { descripcion: '', cantidad: 1, unidad: 'Unidad', motivo: '' }])
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof DevItem, value: string | number) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  async function handleSubmit(formData: FormData) {
    formData.set('items', JSON.stringify(items))
    await crearDevolucion(formData)
  }

  if (loading) return <div className="p-6 text-gray-500">Cargando...</div>

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/operaciones/devoluciones">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Volver</Button>
        </Link>
        <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>Nueva Devolución</h1>
      </div>

      <form action={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Información</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Recepción *</label>
              <select
                name="recepcionId"
                required
                value={selectedRec}
                onChange={e => setSelectedRec(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
              >
                <option value="">Seleccionar recepción...</option>
                {recepciones.map(rec => (
                  <option key={rec.id} value={rec.id}>
                    REC-{String(rec.numero).padStart(4, '0')}-{rec.anio} — {rec.ordenCompra.proveedor.razonSocial}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select name="tipo" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]">
                <option value="TOTAL">Total</option>
                <option value="PARCIAL">Parcial</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo general *</label>
              <textarea name="motivo" required rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Ítems a devolver</h2>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-1" />Agregar
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
                <div className="col-span-3">
                  <label className="block text-xs text-gray-500 mb-1">Motivo específico</label>
                  <input
                    value={item.motivo}
                    onChange={e => updateItem(i, 'motivo', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
                  />
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
        </div>

        <div className="flex gap-3">
          <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">Registrar devolución</Button>
          <Link href="/operaciones/devoluciones">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
