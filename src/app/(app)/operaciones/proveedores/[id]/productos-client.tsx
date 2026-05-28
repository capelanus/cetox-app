'use client'

import { useState, useTransition } from 'react'
import { X, Plus } from 'lucide-react'
import { actualizarProductosProveedor } from '@/app/actions/proveedores'

interface Props {
  proveedorId: string
  productosIniciales: string[]
}

export default function ProductosProveedor({ proveedorId, productosIniciales }: Props) {
  const [productos, setProductos] = useState<string[]>(productosIniciales)
  const [input, setInput] = useState('')
  const [isPending, startTransition] = useTransition()

  function agregarProducto() {
    const nuevo = input.trim()
    if (!nuevo || productos.includes(nuevo)) {
      setInput('')
      return
    }
    const nuevos = [...productos, nuevo]
    setProductos(nuevos)
    setInput('')
    startTransition(async () => {
      await actualizarProductosProveedor(proveedorId, nuevos)
    })
  }

  function quitarProducto(producto: string) {
    const nuevos = productos.filter(p => p !== producto)
    setProductos(nuevos)
    startTransition(async () => {
      await actualizarProductosProveedor(proveedorId, nuevos)
    })
  }

  return (
    <div className="space-y-3">
      {/* Tag pills */}
      <div className="flex flex-wrap gap-2 min-h-[28px]">
        {productos.length === 0 ? (
          <p className="text-sm text-gray-400">Sin productos registrados</p>
        ) : (
          productos.map(p => (
            <span
              key={p}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#13602C]/10 text-[#13602C] text-xs font-medium"
            >
              {p}
              <button
                type="button"
                onClick={() => quitarProducto(p)}
                disabled={isPending}
                className="text-[#13602C]/60 hover:text-red-500 transition-colors disabled:opacity-40"
                aria-label={`Quitar ${p}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
        {isPending && <span className="text-xs text-gray-400 self-center">Guardando...</span>}
      </div>

      {/* Add product input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarProducto() } }}
          placeholder="Agregar producto (Enter o +)"
          disabled={isPending}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C] disabled:opacity-40"
        />
        <button
          type="button"
          onClick={agregarProducto}
          disabled={isPending || !input.trim()}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#13602C] text-white text-sm hover:bg-[#0e4a21] disabled:opacity-40 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar
        </button>
      </div>
    </div>
  )
}
