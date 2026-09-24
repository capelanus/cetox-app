'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'

interface Props {
  // Suma de los ítems de la línea. Es la base de cálculo, pero no manda: el
  // usuario puede sobrescribir cualquier casilla porque las cotizaciones del
  // proveedor a veces ya vienen con IGV incluido o con percepción sumada.
  subtotalItems: number
  moneda?: string
  defaults?: { subtotal?: number; igv?: number; percepcion?: number; total?: number }
}

const IGV_TASA = 0.18

export default function TotalesEditables({ subtotalItems, moneda = '', defaults }: Props) {
  const [igvIncluido, setIgvIncluido] = useState(false)
  const [override, setOverride] = useState<{ subtotal?: number; igv?: number; percepcion?: number; total?: number }>(
    defaults ?? {},
  )

  const subtotalAuto = igvIncluido ? subtotalItems / (1 + IGV_TASA) : subtotalItems
  const subtotal = override.subtotal ?? subtotalAuto
  const igv = override.igv ?? subtotal * IGV_TASA
  const percepcion = override.percepcion ?? 0
  const total = override.total ?? subtotal + igv + percepcion

  const editado = (['subtotal', 'igv', 'total'] as const).some(c => override[c] !== undefined)
  const set = (campo: keyof typeof override, valor: string) => {
    const n = parseFloat(valor)
    setOverride(prev => ({ ...prev, [campo]: Number.isFinite(n) ? n : 0 }))
  }

  const campo = (label: string, name: keyof typeof override, valor: number, destacado = false) => (
    <div className="flex items-center justify-between gap-3">
      <label className={`text-sm ${destacado ? 'font-bold text-[#13602C]' : 'text-gray-500'}`}>{label}</label>
      <input
        type="number"
        step={0.01}
        min={0}
        name={name}
        value={valor.toFixed(2)}
        onChange={e => set(name, e.target.value)}
        className={`w-32 border rounded px-2 py-1 text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-[#13602C] ${
          override[name] !== undefined ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
        } ${destacado ? 'font-bold' : ''}`}
      />
    </div>
  )

  return (
    <div className="border-t border-gray-100 pt-4 space-y-2 min-w-[300px] ml-auto">
      <label className="flex items-center gap-2 text-xs text-gray-600 justify-end cursor-pointer">
        <input
          type="checkbox"
          checked={igvIncluido}
          // Se rehacen subtotal/IGV/total desde los ítems, pero la percepción es
          // un dato aparte que el usuario ya tecleó y no debe perderse.
          onChange={e => { setIgvIncluido(e.target.checked); setOverride(prev => ({ percepcion: prev.percepcion })) }}
          className="w-3.5 h-3.5 accent-[#13602C]"
        />
        Los precios ya incluyen IGV
      </label>

      {campo(`Subtotal ${moneda}`, 'subtotal', subtotal)}
      {campo('IGV (18%)', 'igv', igv)}
      {campo('Percepción', 'percepcion', percepcion)}
      {campo('Total', 'total', total, true)}

      {editado && (
        <button
          type="button"
          onClick={() => setOverride(prev => ({ percepcion: prev.percepcion }))}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 ml-auto"
        >
          <RotateCcw className="w-3 h-3" />Recalcular desde los ítems
        </button>
      )}
    </div>
  )
}
