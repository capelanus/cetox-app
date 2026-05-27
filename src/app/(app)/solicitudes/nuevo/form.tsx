'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Trash2, Send } from 'lucide-react'
import { crearRequerimiento } from '@/app/actions/requerimientos'

interface Item {
  descripcion: string
  cantidad: number
  unidad: string
  especificaciones: string
}

const AREA_LABELS: Record<string, string> = {
  QUIMICA:        'Química',
  BIOLOGIA:       'Biología',
  MICROBIOLOGIA:  'Microbiología',
  CALIDAD:        'Calidad',
  GERENCIA:       'Gerencia',
  ADMINISTRACION: 'Administración',
  OPERACIONES:    'Operaciones',
  OTRA:           'Otra',
}

export default function NuevaSolicitudForm({ areaDeducida }: { areaDeducida: string }) {
  const [items, setItems] = useState<Item[]>([
    { descripcion: '', cantidad: 1, unidad: '', especificaciones: '' },
  ])
  const [sending, setSending] = useState(false)

  const addItem = () =>
    setItems(prev => [...prev, { descripcion: '', cantidad: 1, unidad: '', especificaciones: '' }])

  const removeItem = (i: number) =>
    setItems(prev => prev.filter((_, idx) => idx !== i))

  const updateItem = (i: number, field: keyof Item, value: string | number) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))

  async function handleSubmit(formData: FormData) {
    setSending(true)
    formData.set('items', JSON.stringify(items))
    formData.set('areaSolicitante', areaDeducida)
    await crearRequerimiento(formData)
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/solicitudes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Nueva Solicitud de Compra
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Se enviará directamente al área de Operaciones
          </p>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-5">
        {/* Área (read-only desde servidor) */}
        <div className="bg-[#EAF4F4] rounded-xl border border-[#4AC3B2]/30 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#13602C] flex items-center justify-center flex-shrink-0">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Solicita desde</p>
            <p className="font-semibold text-[#13602C]">{AREA_LABELS[areaDeducida] ?? areaDeducida}</p>
          </div>
          <input type="hidden" name="areaSolicitante" value={areaDeducida} />
        </div>

        {/* Info general */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700">Detalle de la solicitud</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ¿Qué necesitas? <span className="text-red-500">*</span>
            </label>
            <input
              name="descripcion"
              required
              placeholder="Ej: Reactivos para análisis microbiológico, materiales de laboratorio..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Justificación / Motivo
            </label>
            <textarea
              name="justificacion"
              rows={2}
              placeholder="Indica por qué se necesita este material o servicio..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urgencia</label>
              <select
                name="urgencia"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
              >
                <option value="NORMAL">Normal</option>
                <option value="URGENTE">Urgente</option>
                <option value="MUY_URGENTE">Muy urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">¿Lo necesito para?</label>
              <input
                name="fechaRequerida"
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Productos o servicios requeridos</h2>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-1" />Agregar ítem
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
                <div className="col-span-5">
                  {i === 0 && <label className="block text-xs text-gray-500 mb-1">Descripción del producto/servicio</label>}
                  <input
                    value={item.descripcion}
                    onChange={e => updateItem(i, 'descripcion', e.target.value)}
                    required
                    placeholder="Ej: Agar nutritivo, guantes nitrilo..."
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
                  />
                </div>
                <div className="col-span-2">
                  {i === 0 && <label className="block text-xs text-gray-500 mb-1">Cantidad</label>}
                  <input
                    type="number"
                    value={item.cantidad}
                    min={0.01}
                    step={0.01}
                    onChange={e => updateItem(i, 'cantidad', parseFloat(e.target.value) || 0)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
                  />
                </div>
                <div className="col-span-2">
                  {i === 0 && <label className="block text-xs text-gray-500 mb-1">Unidad <span className="text-gray-400">(opcional)</span></label>}
                  <input
                    value={item.unidad}
                    onChange={e => updateItem(i, 'unidad', e.target.value)}
                    placeholder="Unid, kg, L..."
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
                  />
                </div>
                <div className="col-span-2">
                  {i === 0 && <label className="block text-xs text-gray-500 mb-1">Especificaciones</label>}
                  <input
                    value={item.especificaciones}
                    onChange={e => updateItem(i, 'especificaciones', e.target.value)}
                    placeholder="Opcional"
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Aviso */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <strong>ℹ️ Nota:</strong> Tu solicitud se enviará automáticamente al área de Operaciones.
          Puedes ver el estado del proceso en <strong>Mis Solicitudes</strong>.
        </div>

        {/* Acciones */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={sending}
            className="bg-[#13602C] hover:bg-[#0e4a21] text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Enviando...' : 'Enviar solicitud'}
          </Button>
          <Link href="/solicitudes">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
