'use client'

import { useState, useMemo } from 'react'
import { formatMoneda } from '@/lib/format'

const AREA_LABELS: Record<string, string> = { Q: 'Química', B: 'Biología', M: 'Microbiología' }
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

interface Ensayo { area: string }
interface Item { costo: number; ensayo: Ensayo }
interface Cliente { razonSocial: string }
interface Cotizacion {
  id: string
  numero: number
  anio: number
  sufijo: string
  moneda: string
  total: number
  subtotal: number
  fechaEmision: Date | string
  cliente: Cliente
  items: Item[]
}

interface Props {
  cotizaciones: Cotizacion[]
}

export function IngresosView({ cotizaciones }: Props) {
  const anioActual = new Date().getFullYear()
  const aniosDisponibles = [...new Set(cotizaciones.map((c) => c.anio))].sort((a, b) => b - a)
  if (!aniosDisponibles.includes(anioActual)) aniosDisponibles.unshift(anioActual)

  const [anio, setAnio] = useState(anioActual)
  const [mes, setMes] = useState(0)

  const filtradas = useMemo(() => {
    return cotizaciones.filter((c) => {
      const fecha = new Date(c.fechaEmision)
      if (c.anio !== anio) return false
      if (mes > 0 && fecha.getMonth() + 1 !== mes) return false
      return true
    })
  }, [cotizaciones, anio, mes])

  const porArea = useMemo(() => {
    const areas: Record<string, { subtotal: number; count: number }> = {}
    for (const cot of filtradas) {
      for (const item of cot.items) {
        const area = item.ensayo.area
        if (!areas[area]) areas[area] = { subtotal: 0, count: 0 }
        areas[area].subtotal += item.costo
        areas[area].count += 1
      }
    }
    return areas
  }, [filtradas])

  const porMes = useMemo(() => {
    const mesesData: Record<number, number> = {}
    for (let m = 1; m <= 12; m++) mesesData[m] = 0
    for (const cot of cotizaciones.filter((c) => c.anio === anio)) {
      const m = new Date(cot.fechaEmision).getMonth() + 1
      mesesData[m] = (mesesData[m] ?? 0) + cot.subtotal
    }
    return mesesData
  }, [cotizaciones, anio])

  const totalFiltrado = filtradas.reduce((s, c) => s + c.subtotal, 0)

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <select
          className="h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm"
          value={anio}
          onChange={(e) => setAnio(Number(e.target.value))}
        >
          {aniosDisponibles.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm"
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
        >
          <option value={0}>Todos los meses</option>
          {MESES.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
      </div>

      {/* Resumen por área */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(AREA_LABELS).map(([area, label]) => {
          const data = porArea[area] ?? { subtotal: 0, count: 0 }
          return (
            <div key={area} className="bg-white rounded-xl border shadow-sm p-5">
              <p className="text-slate-500 text-sm mb-1">{label}</p>
              <p className="text-2xl font-bold text-slate-900">
                {formatMoneda(data.subtotal, 'USD')}
              </p>
              <p className="text-slate-400 text-xs mt-1">{data.count} ensayo{data.count !== 1 ? 's' : ''}</p>
            </div>
          )
        })}
      </div>

      {/* Total */}
      <div className="bg-white rounded-xl border shadow-sm p-5 flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-sm">Total del período</p>
          <p className="text-3xl font-bold" style={{ color: '#1F4E79' }}>
            {formatMoneda(totalFiltrado, 'USD')}
          </p>
        </div>
        <p className="text-slate-400 text-sm">{filtradas.length} cotización{filtradas.length !== 1 ? 'es' : ''}</p>
      </div>

      {/* Gráfico mensual (tabla) */}
      {mes === 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="font-semibold text-slate-700 mb-4">Distribución mensual — {anio}</h3>
          <div className="space-y-2">
            {MESES.map((nombre, i) => {
              const valor = porMes[i + 1] ?? 0
              const max = Math.max(...Object.values(porMes), 1)
              const pct = (valor / max) * 100
              return (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-24 text-slate-500 text-right shrink-0">{nombre}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: '#1F4E79' }}
                    />
                  </div>
                  <span className="w-28 text-right font-medium text-slate-700 shrink-0">
                    {valor > 0 ? formatMoneda(valor, 'USD') : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Detalle de cotizaciones */}
      {filtradas.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Cotización</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Cliente</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Fecha</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtradas.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">
                    COT-{String(c.numero).padStart(4, '0')}-{c.anio}{c.sufijo}
                  </td>
                  <td className="px-4 py-3">{c.cliente.razonSocial}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(c.fechaEmision).toLocaleDateString('es-PE')}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatMoneda(c.subtotal, c.moneda as 'USD' | 'PEN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
