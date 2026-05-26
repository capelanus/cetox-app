'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { crearRecepcion } from '@/app/actions/recepciones'

interface OC {
  id: string
  numero: number
  anio: number
  items: { descripcion: string; cantidad: number; unidad: string }[]
  proveedor: { razonSocial: string }
}

interface RecepcionItem {
  descripcion: string
  cantidadEsperada: number
  cantidadRecibida: number
  unidad: string
  conforme: boolean
  observacion: string
}

export default function NuevaRecepcionPage() {
  const searchParams = useSearchParams()
  const ocParam = searchParams.get('oc')

  const [ocs, setOcs] = useState<OC[]>([])
  const [selectedOC, setSelectedOC] = useState<string>(ocParam || '')
  const [items, setItems] = useState<RecepcionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/operaciones/ordenes-compra')
      .then(r => r.json())
      .then((data: OC[]) => {
        setOcs(data)
        setLoading(false)
        if (ocParam) {
          const oc = data.find((o: OC) => o.id === ocParam)
          if (oc?.items?.length) {
            setItems(oc.items.map(item => ({
              descripcion: item.descripcion,
              cantidadEsperada: item.cantidad,
              cantidadRecibida: item.cantidad,
              unidad: item.unidad,
              conforme: true,
              observacion: '',
            })))
          }
        }
      })
      .catch(() => setLoading(false))
  }, [ocParam])

  const handleOCChange = (ocId: string) => {
    setSelectedOC(ocId)
    const oc = ocs.find(o => o.id === ocId)
    if (oc?.items?.length) {
      setItems(oc.items.map(item => ({
        descripcion: item.descripcion,
        cantidadEsperada: item.cantidad,
        cantidadRecibida: item.cantidad,
        unidad: item.unidad,
        conforme: true,
        observacion: '',
      })))
    } else {
      setItems([])
    }
  }

  const updateItem = (i: number, field: keyof RecepcionItem, value: string | number | boolean) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  async function handleSubmit(formData: FormData) {
    formData.set('items', JSON.stringify(items))
    await crearRecepcion(formData)
  }

  if (loading) return <div className="p-6 text-gray-500">Cargando...</div>

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/operaciones/recepciones">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Volver</Button>
        </Link>
        <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>Nueva Recepción</h1>
      </div>

      <form action={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Información</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orden de Compra *</label>
              <select
                name="ordenCompraId"
                required
                value={selectedOC}
                onChange={e => handleOCChange(e.target.value)}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones generales</label>
              <textarea name="observaciones" rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
          </div>
        </div>

        {items.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-700">Verificación de ítems</h2>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <p className="text-xs text-gray-500">Descripción</p>
                      <p className="text-sm font-medium">{item.descripcion}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Esperado</p>
                      <p className="text-sm font-mono">{item.cantidadEsperada} {item.unidad}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Recibido</label>
                      <input
                        type="number"
                        value={item.cantidadRecibida}
                        min={0}
                        step={0.01}
                        onChange={e => updateItem(i, 'cantidadRecibida', parseFloat(e.target.value))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
                      />
                    </div>
                    <div className="col-span-2 flex items-center gap-2 pt-4">
                      <input
                        type="checkbox"
                        id={`conforme-${i}`}
                        checked={item.conforme}
                        onChange={e => updateItem(i, 'conforme', e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor={`conforme-${i}`} className="text-sm text-gray-700">Conforme</label>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Observación</label>
                      <input
                        value={item.observacion}
                        onChange={e => updateItem(i, 'observacion', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
                      />
                    </div>
                  </div>
                  {!item.conforme && (
                    <p className="text-xs text-amber-600 font-medium">Este ítem será marcado como no conforme</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={!selectedOC || items.length === 0} className="bg-[#13602C] hover:bg-[#0e4a21] text-white">
            Registrar recepción
          </Button>
          <Link href="/operaciones/recepciones">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
