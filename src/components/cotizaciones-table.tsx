'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatFecha, formatMoneda, formatNumCotizacion } from '@/lib/format'

const ESTADO_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador',
  EN_REVISION: 'En revisión',
  ENVIADA: 'Enviada',
  ACEPTADA: 'Aceptada',
  RECHAZADA: 'Rechazada',
  VENCIDA: 'Vencida',
}

interface Ensayo {
  id: string
  nombre: string
  codigo: string
  area: string
}

interface CotizacionItem {
  ensayo: Ensayo
}

interface CotizacionMuestra {
  id: string
  nombre: string
  orden: number
  items: CotizacionItem[]
}

interface Cotizacion {
  id: string
  numero: number
  anio: number
  sufijo: string
  cliente: { razonSocial: string }
  creadoPor: { nombre: string }
  fechaEmision: Date | string
  vigenciaHasta: Date | string
  total: number
  moneda: string
  estado: string
  items: CotizacionItem[]
  muestras: CotizacionMuestra[]
}

interface Props {
  cotizaciones: Cotizacion[]
  ensayos: Ensayo[]
}

export function CotizacionesTable({ cotizaciones, ensayos }: Props) {
  const [filtroEnsayo, setFiltroEnsayo] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const filtradas = cotizaciones.filter((c) => {
    if (filtroEstado && c.estado !== filtroEstado) return false
    if (filtroEnsayo && !c.items.some((it) => it.ensayo.id === filtroEnsayo)) return false
    return true
  })

  return (
    <div>
      {/* Filtros */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          className="h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm"
          value={filtroEnsayo}
          onChange={(e) => setFiltroEnsayo(e.target.value)}
        >
          <option value="">Todos los ensayos</option>
          {ensayos.map((e) => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </select>
        {(filtroEstado || filtroEnsayo) && (
          <button
            className="text-sm text-slate-500 hover:text-slate-800 underline"
            onClick={() => { setFiltroEstado(''); setFiltroEnsayo('') }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Número</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Cliente</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Fecha</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Vigencia</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Total</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtradas.map((c) => (
              <tr
                key={c.id}
                className="hover:bg-slate-50"
                onMouseEnter={(e) => { setHoveredId(c.id); setTooltipPos({ x: e.clientX, y: e.clientY }) }}
                onMouseMove={(e) => { if (hoveredId === c.id) setTooltipPos({ x: e.clientX, y: e.clientY }) }}
                onMouseLeave={() => setHoveredId(null)}
              >
                <td className="px-4 py-3 font-mono text-xs font-medium">
                  {formatNumCotizacion(c.numero, c.anio, c.sufijo)}
                </td>
                <td className="px-4 py-3 font-medium">{c.cliente.razonSocial}</td>
                <td className="px-4 py-3 text-slate-600">{formatFecha(c.fechaEmision)}</td>
                <td className="px-4 py-3 text-slate-600">{formatFecha(c.vigenciaHasta)}</td>
                <td className="px-4 py-3 font-medium">
                  {formatMoneda(c.total, c.moneda as 'USD' | 'PEN')}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    className={
                      c.estado === 'ACEPTADA'
                        ? 'bg-green-100 text-green-700'
                        : c.estado === 'RECHAZADA'
                          ? 'bg-red-100 text-red-700'
                          : ''
                    }
                    variant={
                      c.estado === 'RECHAZADA' ? 'destructive' :
                      c.estado === 'EN_REVISION' ? 'outline' :
                      c.estado === 'VENCIDA' ? 'secondary' : 'default'
                    }
                  >
                    {ESTADO_LABELS[c.estado] ?? c.estado}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/cotizaciones/${c.id}`} className="text-blue-600 hover:underline text-sm">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No hay cotizaciones
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tooltip rendered outside overflow-hidden to avoid clipping */}
      {(() => {
        const hovered = hoveredId ? filtradas.find((c) => c.id === hoveredId) : null
        if (!hovered) return null
        const hasMuestras = hovered.muestras.length > 0
        const hasItems = hasMuestras
          ? hovered.muestras.some((m) => m.items.length > 0)
          : hovered.items.length > 0
        if (!hasItems) return null

        return (
          <div
            style={{ position: 'fixed', left: tooltipPos.x + 14, top: tooltipPos.y + 10, zIndex: 9999, pointerEvents: 'none' }}
            className="bg-white border rounded-lg shadow-lg p-3 min-w-56 max-w-xs text-xs"
          >
            {hasMuestras ? (
              <div className="space-y-2">
                {hovered.muestras.map((m, idx) => (
                  <div key={m.id}>
                    <p className="font-semibold text-slate-700">
                      Muestra {idx + 1}{m.nombre ? `: ${m.nombre}` : ''}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {m.items.map((it, i) => (
                        <li key={i} className="text-slate-600 pl-2">• {it.ensayo.nombre}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <p className="font-semibold text-slate-700 mb-2">Ensayos:</p>
                <ul className="space-y-1">
                  {hovered.items.map((it, i) => (
                    <li key={i} className="text-slate-600">• {it.ensayo.nombre}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )
      })()}
    </div>
  )
}
