'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { crearRequerimiento } from '@/app/actions/requerimientos'

const AREAS = ['QUIMICA', 'BIOLOGIA', 'MICROBIOLOGIA', 'CALIDAD', 'GERENCIA', 'ADMINISTRACION', 'OPERACIONES', 'OTRA']
const AREA_LABELS: Record<string, string> = {
  QUIMICA: 'Química',
  BIOLOGIA: 'Biología',
  MICROBIOLOGIA: 'Microbiología',
  CALIDAD: 'Calidad',
  GERENCIA: 'Gerencia',
  ADMINISTRACION: 'Administración',
  OPERACIONES: 'Operaciones',
  OTRA: 'Otra',
}

interface Item {
  descripcion: string
  cantidad: number
  unidad: string
  especificaciones: string
}

export default function NuevoRequerimientoPage() {
  const [items, setItems] = useState<Item[]>([{ descripcion: '', cantidad: 1, unidad: 'Unidad', especificaciones: '' }])

  const addItem = () => setItems(prev => [...prev, { descripcion: '', cantidad: 1, unidad: 'Unidad', especificaciones: '' }])
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof Item, value: string | number) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  async function handleSubmit(formData: FormData) {
    formData.set('items', JSON.stringify(items))
    await crearRequerimiento(formData)
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/operaciones/requerimientos">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Volver</Button>
        </Link>
        <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>Nuevo Requerimiento</h1>
      </div>
      <form action={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Información general</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Área solicitante *</label>
              <select name="areaSolicitante" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]">
                {AREAS.map(a => <option key={a} value={a}>{AREA_LABELS[a]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urgencia</label>
              <select name="urgencia" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]">
                <option value="NORMAL">Normal</option>
                <option value="URGENTE">Urgente</option>
                <option value="MUY_URGENTE">Muy urgente</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción general *</label>
              <textarea name="descripcion" required rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Justificación</label>
              <textarea name="justificacion" rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha requerida</label>
              <input name="fechaRequerida" type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Productos / Servicios requeridos</h2>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-1" />Agregar
            </Button>
          </div>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 rounded-lg">
                <div className="col-span-5">
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
                  <label className="block text-xs text-gray-500 mb-1">Especificaciones</label>
                  <input
                    value={item.especificaciones}
                    onChange={e => updateItem(i, 'especificaciones', e.target.value)}
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
          <Button type="submit" className="bg-[#13602C] hover:bg-[#0e4a21] text-white">Crear requerimiento</Button>
          <Link href="/operaciones/requerimientos">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
