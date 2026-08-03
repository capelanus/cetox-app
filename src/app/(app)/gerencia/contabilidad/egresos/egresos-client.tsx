'use client'

import { useRouter } from 'next/navigation'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { TrendingDown, Truck } from 'lucide-react'
import { MESES, soles, solesCompact } from '@/lib/contabilidad'

interface DeptoRow { departamento: string; label: string; comprometido: number; facturado: number; pagado: number }
interface Serie { comprometido: number[]; facturado: number[]; pagado: number[] }

const COL = { comprometido: '#94a3b8', facturado: '#f97316', pagado: '#0891b2' }

function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-1.5" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-semibold">{soles(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export function EgresosClient({ anio, porDepto, totales, mensualGlobal }: {
  anio: number; porDepto: DeptoRow[]; totales: { comprometido: number; facturado: number; pagado: number }; mensualGlobal: Serie
}) {
  const router = useRouter()
  const anios = [anio - 1, anio, anio + 1]

  const chartData = MESES.map((mes, i) => ({
    mes,
    Comprometido: Math.round(mensualGlobal.comprometido[i]),
    Facturado: Math.round(mensualGlobal.facturado[i]),
    Pagado: Math.round(mensualGlobal.pagado[i]),
  }))

  return (
    <div className="max-w-6xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-1">
            <Truck className="w-4 h-4" /> Contabilidad y Finanzas
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Egresos de Logística {anio}</h1>
          <p className="text-sm text-slate-500">Gasto real extraído del módulo de Logística, por departamento y mes.</p>
        </div>
        <select value={anio} onChange={e => router.push(`/gerencia/contabilidad/egresos?anio=${e.target.value}`)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm h-fit">
          {anios.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Mini label="Comprometido (OC)" value={soles(totales.comprometido)} color={COL.comprometido} />
        <Mini label="Facturado (devengado)" value={soles(totales.facturado)} color={COL.facturado} />
        <Mini label="Pagado (caja)" value={soles(totales.pagado)} color={COL.pagado} />
      </div>

      {/* Gráfico mensual */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <TrendingDown className="w-4 h-4" /> Egresos mensuales
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => solesCompact(v)} width={54} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Facturado" fill={COL.facturado} radius={[3, 3, 0, 0]} maxBarSize={22} />
            <Bar dataKey="Pagado" fill={COL.pagado} radius={[3, 3, 0, 0]} maxBarSize={22} />
            <Line type="monotone" dataKey="Comprometido" stroke={COL.comprometido} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla por departamento */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400">
              <th className="text-left font-semibold px-4 py-2.5">Departamento</th>
              <th className="text-right font-semibold px-4 py-2.5">Comprometido</th>
              <th className="text-right font-semibold px-4 py-2.5">Facturado</th>
              <th className="text-right font-semibold px-4 py-2.5">Pagado</th>
            </tr>
          </thead>
          <tbody>
            {porDepto.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-400">Sin egresos registrados en Logística para {anio}.</td></tr>
            ) : porDepto.map((d) => (
              <tr key={d.departamento} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-4 py-2.5 font-medium text-slate-700">{d.label}</td>
                <td className="px-4 py-2.5 text-right text-slate-500">{soles(d.comprometido)}</td>
                <td className="px-4 py-2.5 text-right font-semibold" style={{ color: COL.facturado }}>{soles(d.facturado)}</td>
                <td className="px-4 py-2.5 text-right" style={{ color: COL.pagado }}>{soles(d.pagado)}</td>
              </tr>
            ))}
          </tbody>
          {porDepto.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 font-bold text-slate-800">
                <td className="px-4 py-2.5">Total</td>
                <td className="px-4 py-2.5 text-right">{soles(totales.comprometido)}</td>
                <td className="px-4 py-2.5 text-right">{soles(totales.facturado)}</td>
                <td className="px-4 py-2.5 text-right">{soles(totales.pagado)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

function Mini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
    </div>
  )
}
