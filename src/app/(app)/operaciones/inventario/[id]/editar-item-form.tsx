'use client'

import { useState, useTransition } from 'react'
import { actualizarInventarioItem, eliminarInventarioItem } from '@/app/actions/inventario'
import { Save, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface ItemData {
  id: string
  codOrden: string
  descripcion: string
  unidad: string
  categoria: string
  stock: number
  stockMinimo?: number
  notas: string
  activo: boolean
}

export default function EditarItemForm({ item }: { item: ItemData }) {
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [isPending, startTransition] = useTransition()

  const actualizar = actualizarInventarioItem.bind(null, item.id)

  async function handleSubmit(formData: FormData) {
    setSending(true)
    await actualizar(formData)
  }

  function handleEliminar() {
    if (!confirm('¿Eliminar este ítem del inventario? Esta acción no se puede deshacer.')) return
    startTransition(async () => {
      await eliminarInventarioItem(item.id)
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-700">Editar datos del ítem</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <>
          <form action={handleSubmit} className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cód. Orden</label>
                <input
                  name="codOrden"
                  defaultValue={item.codOrden}
                  placeholder="Opcional"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                <input
                  name="unidad"
                  defaultValue={item.unidad}
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
                defaultValue={item.descripcion}
                required
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C] resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <input
                  name="categoria"
                  defaultValue={item.categoria}
                  placeholder="Ej: Reactivos, Vidriería..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock actual</label>
                <input
                  name="stock"
                  type="number"
                  defaultValue={item.stock}
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
                  defaultValue={item.stockMinimo}
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
                defaultValue={item.notas}
                rows={2}
                placeholder="Observaciones, proveedor habitual, ubicación en almacén..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C] resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="activo"
                type="checkbox"
                name="activo"
                defaultChecked={item.activo}
                value="true"
                className="rounded border-gray-300 text-[#13602C] focus:ring-[#13602C]"
              />
              <label htmlFor="activo" className="text-sm text-gray-700">Ítem activo</label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={sending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[#13602C] text-white hover:bg-[#0e4a21] disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {sending ? 'Guardando...' : 'Guardar cambios'}
              </button>

              {/* Delete button sits OUTSIDE the form — no nested <form> */}
              <button
                type="button"
                disabled={isPending}
                onClick={handleEliminar}
                className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
