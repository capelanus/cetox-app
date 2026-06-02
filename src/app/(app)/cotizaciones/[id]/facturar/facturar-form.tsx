'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { generarFacturaClienteConItems } from '@/app/actions/facturacion'
import { formatMoneda, formatNumCotizacion } from '@/lib/format'
import { CheckSquare, Square, ArrowLeft, FileText, Loader2, AlertCircle } from 'lucide-react'

export interface ItemFacturable {
  itemId:   string          // CotizacionItem.id
  nombre:   string          // ensayo.nombre
  muestra:  string | null   // muestra.nombre si aplica
  costo:    number
  moneda:   'USD' | 'PEN'
}

interface Props {
  cotizacionId:  string
  numCotizacion: string
  clienteNombre: string
  items:         ItemFacturable[]
  igvRate:       number   // 0.18
}

export function FacturarForm({ cotizacionId, numCotizacion, clienteNombre, items, igvRate }: Props) {
  const router   = useRouter()
  const [pending, startTransition] = useTransition()
  const [checked, setChecked]      = useState<Record<string, boolean>>(
    Object.fromEntries(items.map(i => [i.itemId, true]))   // todos marcados por defecto
  )
  const [error, setError] = useState('')

  const selectedItems  = items.filter(i => checked[i.itemId])
  const subtotal        = selectedItems.reduce((s, i) => s + i.costo, 0)
  const igv             = subtotal * igvRate
  const total           = subtotal + igv
  const moneda          = items[0]?.moneda ?? 'USD'

  function toggleAll(val: boolean) {
    setChecked(Object.fromEntries(items.map(i => [i.itemId, val])))
  }

  function handleSubmit() {
    if (selectedItems.length === 0) {
      setError('Selecciona al menos un ensayo para facturar.')
      return
    }
    setError('')
    startTransition(async () => {
      try {
        const result = await generarFacturaClienteConItems(cotizacionId, selectedItems)
        if ('error' in result) {
          setError(result.error)
        } else {
          router.push(`/facturacion/${result.id}`)
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error al generar la factura.')
      }
    })
  }

  const allChecked  = items.every(i => checked[i.itemId])
  const noneChecked = items.every(i => !checked[i.itemId])

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg transition-colors"
          style={{ color: '#64748b' }}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="cetox-page-title">Generar Factura</h1>
          <p className="cetox-page-subtitle">
            {numCotizacion} · {clienteNombre}
          </p>
        </div>
      </div>

      {/* Instrucción */}
      <div
        className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5"
        style={{ backgroundColor: '#EAF4F4', border: '1px solid rgba(74,195,178,0.3)' }}
      >
        <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#4AC3B2' }} />
        <p className="text-sm" style={{ color: '#4A3728' }}>
          Selecciona los ensayos que deseas incluir en esta factura. Puedes facturar todos o solo una parte de la cotización.
        </p>
      </div>

      {/* Select all / none */}
      <div className="flex items-center gap-3 mb-3 px-1">
        <button
          onClick={() => toggleAll(true)}
          disabled={allChecked}
          className="text-xs font-semibold transition-opacity disabled:opacity-40"
          style={{ color: '#13602C' }}
        >
          Seleccionar todos
        </button>
        <span style={{ color: '#cbd5e1' }}>·</span>
        <button
          onClick={() => toggleAll(false)}
          disabled={noneChecked}
          className="text-xs font-semibold transition-opacity disabled:opacity-40"
          style={{ color: '#64748b' }}
        >
          Quitar todos
        </button>
        <span className="ml-auto text-xs" style={{ color: '#94a3b8' }}>
          {selectedItems.length} de {items.length} seleccionados
        </span>
      </div>

      {/* Items list */}
      <div className="cetox-card overflow-hidden mb-5">
        {items.map((item, idx) => {
          const isChecked = checked[item.itemId]
          return (
            <label
              key={item.itemId}
              className="flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors"
              style={{
                borderBottom: idx < items.length - 1 ? '1px solid #f1f5f9' : 'none',
                backgroundColor: isChecked ? 'rgba(74,195,178,0.05)' : 'transparent',
              }}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                className="sr-only"
                checked={isChecked}
                onChange={e => setChecked(prev => ({ ...prev, [item.itemId]: e.target.checked }))}
              />
              {isChecked
                ? <CheckSquare className="h-5 w-5 flex-shrink-0" style={{ color: '#13602C' }} />
                : <Square     className="h-5 w-5 flex-shrink-0" style={{ color: '#cbd5e1' }} />
              }

              {/* Item info */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: isChecked ? '#1e293b' : '#94a3b8' }}
                >
                  {item.nombre}
                </p>
                {item.muestra && (
                  <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                    Muestra: {item.muestra}
                  </p>
                )}
              </div>

              {/* Costo */}
              <span
                className="text-sm font-mono font-bold flex-shrink-0"
                style={{ color: isChecked ? '#13602C' : '#cbd5e1' }}
              >
                {formatMoneda(item.costo, item.moneda)}
              </span>
            </label>
          )
        })}
      </div>

      {/* Totals */}
      <div
        className="rounded-xl p-4 mb-5 space-y-2"
        style={{ backgroundColor: '#f8faf9', border: '1px solid #e2e8f0' }}
      >
        <div className="flex justify-between text-sm">
          <span style={{ color: '#64748b' }}>Subtotal</span>
          <span className="font-medium">{formatMoneda(subtotal, moneda)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: '#64748b' }}>IGV (18%)</span>
          <span className="font-medium">{formatMoneda(igv, moneda)}</span>
        </div>
        <div
          className="flex justify-between pt-2 mt-1"
          style={{ borderTop: '1px solid #e2e8f0' }}
        >
          <span className="font-bold" style={{ color: '#1e293b' }}>Total a facturar</span>
          <span className="font-bold text-lg" style={{ color: '#13602C' }}>
            {formatMoneda(total, moneda)}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-4 text-sm"
          style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#7f1d1d' }}
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          className="cetox-btn-secondary flex-1 py-2.5"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={pending || selectedItems.length === 0}
          className="cetox-btn-primary flex-1 py-2.5 flex items-center justify-center gap-2"
        >
          {pending
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando…</>
            : <>Confirmar factura ({selectedItems.length} ensayo{selectedItems.length !== 1 ? 's' : ''})</>
          }
        </button>
      </div>
    </div>
  )
}
