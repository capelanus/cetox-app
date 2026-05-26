'use client'

import { useState } from 'react'
import { crearInventarioItem } from '@/app/actions/inventario'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Save } from 'lucide-react'

export default function NuevoItemForm() {
  const [sending, setSending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setSending(true)
    await crearInventarioItem(formData)
  }

  return (
    <form action={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cód. Orden</label>
          <input
            name="codOrden"
            placeholder="Ej: AC03294000"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
          <input
            name="unidad"
            placeholder="Ej: L, kg, unid, caja..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción <span className="text-red-500">*</span>
        </label>
        <textarea
          name="descripcion"
          required
          rows={2}
          placeholder="Nombre y especificación del producto..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C] resize-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <input
            name="categoria"
            placeholder="Ej: Reactivos, Vidriería..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock inicial</label>
          <input
            name="stock"
            type="number"
            defaultValue={0}
            min={0}
            step={0.01}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
          <input
            name="stockMinimo"
            type="number"
            min={0}
            step={0.01}
            placeholder="Opcional"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
        <textarea
          name="notas"
          rows={2}
          placeholder="Observaciones, proveedor habitual, ubicación en almacén..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C] resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={sending}
          className="bg-[#13602C] hover:bg-[#0e4a21] text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {sending ? 'Guardando...' : 'Guardar ítem'}
        </Button>
        <Link href="/operaciones/inventario">
          <Button type="button" variant="outline">Cancelar</Button>
        </Link>
      </div>
    </form>
  )
}
