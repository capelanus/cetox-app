'use client'

import { useRouter } from 'next/navigation'
import { TrendingUp } from 'lucide-react'
import { MESES, soles } from '@/lib/contabilidad'

interface Mes { periodo: number; ingPlan: number; ingReal: number; egrPlan: number; egrReal: number }

export function FlujoCajaClient({ anio, meses }: { anio: number; meses: Mes[] }) {
  const router = useRouter()
  const anios = [anio - 1, anio, anio + 1]

  // Saldos acumulados (proyectado usa plan; real usa ejecutado)
  let acumProy = 0, acumReal = 0
  const filas = meses.map(m => {
    const netoProy = m.ingPlan - m.egrPlan
    const netoReal = m.ingReal - m.egrReal
    acumProy += netoProy
    acumReal += netoReal
    return { ...m, netoProy, netoReal, acumProy, acumReal }
  })

  const maxAbs = Math.max(1, ...filas.map(f => Math.max(Math.abs(f.netoProy), Math.abs(f.netoReal))))
  const totIngProy = filas.reduce((a, f) => a + f.ingPlan, 0)
  const totEgrProy = filas.reduce((a, f) => a + f.egrPlan, 0)

  return (
    <div className="max-w-6xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-1">
            <TrendingUp className="w-4 h-4" /> Contabilidad y Finanzas
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Flujo de caja proyectado {anio}</h1>
          <p className="text-sm text-slate-500">Ingresos menos egresos por mes, con saldo acumulado. Se alimenta del presupuesto.</p>
        </div>
        <select value={anio} onChange={e => router.push(`/gerencia/contabilidad/flujo-caja?anio=${e.target.value}`)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm h-fit">
          {anios.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Mini label="Ingresos proyectados" value={soles(totIngProy)} color="#10b981" />
        <Mini label="Egresos proyectados" value={soles(totEgrProy)} color="#f97316" />
        <Mini label="Flujo neto anual" value={soles(totIngProy - totEgrProy)} color={totIngProy - totEgrProy >= 0 ? '#10b981' : '#ef4444'} />
        <Mini label="Saldo acumulado (real)" value={soles(acumReal)} color={acumReal >= 0 ? '#10b981' : '#ef4444'} />
      </div>

      {/* Gráfico de barras neto proyectado */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Flujo neto mensual proyectado</p>
        <div className="flex items-end justify-between gap-1 h-40">
          {filas.map(f => {
            const h = (Math.abs(f.netoProy) / maxAbs) * 100
            const pos = f.netoProy >= 0
            return (
              <div key={f.periodo} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div className="w-full flex flex-col items-center justify-end" style={{ height: '100%' }}>
                  <div className="w-full max-w-[28px] rounded-t transition-all"
                    style={{ height: `${h}%`, backgroundColor: pos ? '#10b981' : '#ef4444', minHeight: f.netoProy !== 0 ? 2 : 0 }} />
                </div>
                <span className="text-[9px] text-slate-400 mt-1">{MESES[f.periodo - 1]}</span>
                <span className="absolute -top-5 opacity-0 group-hover:opacity-100 text-[10px] font-semibold bg-slate-800 text-white px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                  {soles(f.netoProy)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400">
              <th className="text-left font-semibold px-4 py-2.5">Mes</th>
              <th className="text-right font-semibold px-3 py-2.5">Ingresos</th>
              <th className="text-right font-semibold px-3 py-2.5">Egresos</th>
              <th className="text-right font-semibold px-3 py-2.5">Neto proyect.</th>
              <th className="text-right font-semibold px-3 py-2.5">Neto real</th>
              <th className="text-right font-semibold px-4 py-2.5">Saldo acum. (real)</th>
            </tr>
          </thead>
          <tbody>
            {filas.map(f => (
              <tr key={f.periodo} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-4 py-2 font-medium text-slate-600">{MESES[f.periodo - 1]}</td>
                <td className="px-3 py-2 text-right text-emerald-600">{soles(f.ingPlan)}</td>
                <td className="px-3 py-2 text-right text-orange-500">{soles(f.egrPlan)}</td>
                <td className={`px-3 py-2 text-right font-semibold ${f.netoProy >= 0 ? 'text-slate-700' : 'text-red-500'}`}>{soles(f.netoProy)}</td>
                <td className="px-3 py-2 text-right text-slate-500">{soles(f.netoReal)}</td>
                <td className={`px-4 py-2 text-right font-bold ${f.acumReal >= 0 ? 'text-slate-800' : 'text-red-500'}`}>{soles(f.acumReal)}</td>
              </tr>
            ))}
          </tbody>
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
