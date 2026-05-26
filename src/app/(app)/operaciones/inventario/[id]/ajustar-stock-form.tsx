'use client'

import { useState } from 'react'
import { ajustarStock } from '@/app/actions/inventario'
import { ArrowDown, ArrowUp, Settings2 } from 'lucide-react'

interface Props {
  itemId: string
  stockActual: number
  unidad: string
}

export default function AjustarStockForm({ itemId, stockActual, unidad }: Props) {
  const [tipo, setTipo] = useState<'ENTRADA' | 'SALIDA' | 'AJUSTE'>('ENTRADA')
  const [cantidad, setCantidad] = useState('')
  const [sending, setSending] = useState(false)

  const adjust = ajustarStock.bind(null, itemId)

  const preview = () => {
    const n = parseFloat(cantidad) || 0
    if (tipo === 'ENTRADA') return stockActual + n
    if (tipo === 'SALIDA') return Math.max(0, stockActual - n)
    return n // AJUSTE
  }

  async function handleSubmit(formData: FormData) {
    setSending(true)
    await adjust(formData)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h2 className="font-semibold text-gray-700">Ajustar stock</h2>

      <form action={handleSubmit} className="space-y-4">
        <input type="hidden" name="tipo" value={tipo} />

        {/* Tipo selector */}
        <div className="flex gap-2">
          {([['ENTRADA', 'Entrada', 'bg-green-50 border-green-400 text-green-700'],
             ['SALIDA',  'Salida',  'bg-red-50 border-red-400 text-red-700'],
             ['AJUSTE',  'Ajuste manual', 'bg-blue-50 border-blue-400 text-blue-700']
           ] as const).map(([val, label, active]) => (
            <button
              key={val}
              type="button"
              onClick={() => setTipo(val)}
              className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                tipo === val ? active : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {val === 'ENTRADA' && <ArrowDown className="w-3.5 h-3.5 inline-block mr-1" />}
              {val === 'SALIDA'  && <ArrowUp   className="w-3.5 h-3.5 inline-block mr-1" />}
              {val === 'AJUSTE'  && <Settings2  className="w-3.5 h-3.5 inline-block mr-1" />}
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {tipo === 'AJUSTE' ? 'Nuevo stock' : 'Cantidad'}
            </label>
            <input
              name="cantidad"
              type="number"
              min={0.01}
              step={0.01}
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              required
              placeholder="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
            />
          </div>
          <div className="pb-0.5 text-sm text-gray-500 min-w-max">
            {cantidad && (
              <span>
                → <strong className={tipo === 'SALIDA' && preview() === 0 ? 'text-red-500' : 'text-[#13602C]'}>
                  {preview() % 1 === 0 ? preview() : preview().toFixed(2)} {unidad}
                </strong>
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={sending || !cantidad}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#13602C] text-white hover:bg-[#0e4a21] disabled:opacity-50 transition-colors"
          >
            {sending ? 'Guardando...' : 'Aplicar'}
          </button>
        </div>
      </form>
    </div>
  )
}
