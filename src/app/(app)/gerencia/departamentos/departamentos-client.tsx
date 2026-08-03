'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { LayoutGrid, User, TrendingUp, FlaskConical, Rocket } from 'lucide-react'
import { MESES, soles, solesCompact, pctEjecucion, colorEjecucion } from '@/lib/contabilidad'
import { ESTADO_PROYECTO_LABEL, ESTADO_PROYECTO_COLOR } from '@/lib/planeamiento'

interface Depto {
  key: string; label: string; responsable: string | null; asignado: number; ejecutado: number
  asignadoMensual: number[]; facturadoMensual: number[]; produccionMensual: number[]
  proyecto: { nombre: string; estado: string; avance: number } | null; proyectosCount: number
}

function acumulado(arr: number[]): number[] {
  let s = 0
  return arr.map((v) => (s += v))
}

function ChartTooltip({ active, payload, label, money }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; money?: boolean
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-1.5" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-semibold">{money ? soles(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  )
}

export function DepartamentosClient({ anio, departamentos }: { anio: number; departamentos: Depto[] }) {
  const router = useRouter()
  const [sel, setSel] = useState(departamentos[0]?.key ?? '')
  const anios = [anio - 1, anio, anio + 1]
  const dep = departamentos.find(d => d.key === sel) ?? departamentos[0]

  // Datos de la curva-S de ejecución presupuestal (acumulada)
  const planAcum = dep ? acumulado(dep.asignadoMensual) : []
  const ejecAcum = dep ? acumulado(dep.facturadoMensual) : []
  const curvaData = MESES.map((mes, i) => ({
    mes,
    Planificado: Math.round(planAcum[i] ?? 0),
    Ejecutado: Math.round(ejecAcum[i] ?? 0),
  }))
  const prodData = MESES.map((mes, i) => ({ mes, Informes: dep?.produccionMensual[i] ?? 0 }))

  return (
    <div className="max-w-6xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-1">
            <LayoutGrid className="w-4 h-4" /> Control gerencial
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Panel por Departamento · {anio}</h1>
          <p className="text-sm text-slate-500">Presupuesto, ejecución, avance y producción por área.</p>
        </div>
        <select value={anio} onChange={e => router.push(`/gerencia/departamentos?anio=${e.target.value}`)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm h-fit">
          {anios.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Tarjetas por departamento */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {departamentos.map((d) => {
          const pct = pctEjecucion(d.asignado, d.ejecutado)
          const col = colorEjecucion(pct, 'EGRESO')
          const activo = d.key === sel
          return (
            <button key={d.key} onClick={() => setSel(d.key)}
              className={`text-left bg-white rounded-xl border p-4 shadow-sm transition-all ${activo ? 'border-emerald-400 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-slate-800">{d.label}</p>
                {d.proyecto && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: ESTADO_PROYECTO_COLOR[d.proyecto.estado] }}>
                    {ESTADO_PROYECTO_LABEL[d.proyecto.estado] ?? d.proyecto.estado}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3">
                <User className="w-3 h-3" />{d.responsable ?? 'Sin responsable'}
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Asignado</span><span className="font-semibold text-slate-700">{soles(d.asignado)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Ejecutado (fact.)</span><span className="font-semibold" style={{ color: col }}>{soles(d.ejecutado)}</span></div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between mb-1"><span className="text-[10px] text-slate-400">Avance</span><span className="text-[11px] font-bold" style={{ color: col }}>{pct === null ? '—' : `${pct}%`}</span></div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct ?? 0)}%`, backgroundColor: col }} />
                </div>
              </div>
              {d.proyecto && (
                <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                  <Rocket className="w-3 h-3" /><span className="truncate">{d.proyecto.nombre} · {d.proyecto.avance}%</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Detalle del departamento seleccionado */}
      {dep && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Ejecución presupuestal · {dep.label}
            </p>
            <p className="text-[11px] text-slate-400 mb-3">Curva-S acumulada: planificado vs. ejecutado (facturado)</p>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={curvaData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPlan" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#94a3b8" stopOpacity={0.3} /><stop offset="100%" stopColor="#94a3b8" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gEjec" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#13602C" stopOpacity={0.35} /><stop offset="100%" stopColor="#13602C" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => solesCompact(v)} width={54} />
                <Tooltip content={<ChartTooltip money />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="Planificado" stroke="#94a3b8" strokeWidth={2} fill="url(#gPlan)" />
                <Area type="monotone" dataKey="Ejecutado" stroke="#13602C" strokeWidth={2} fill="url(#gEjec)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4" /> Producción de laboratorio · {dep.label}
            </p>
            <p className="text-[11px] text-slate-400 mb-3">Informes de ensayo emitidos por mes</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={prodData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="Informes" fill="#4AC3B2" radius={[3, 3, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
            {dep.produccionMensual.every(v => v === 0) && (
              <p className="text-[11px] text-slate-400 text-center -mt-6">Sin producción de laboratorio registrada (solo aplica a Química, Biología y Microbiología).</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
