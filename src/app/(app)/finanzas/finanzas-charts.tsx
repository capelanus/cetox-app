'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

interface ChartPoint {
  mes:       string
  facturado: number
  pagado:    number
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?:  string
}) {
  if (!active || !payload?.length) return null
  const fmt = (n: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0 }).format(n)
  return (
    <div
      className="rounded-xl px-3 py-2 shadow-lg text-xs"
      style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
    >
      {label && <p className="font-semibold mb-1">{label}</p>}
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function FinanzasCharts({ data }: { data: ChartPoint[] }) {
  return (
    <div className="cetox-card p-5">
      <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4AC3B2', fontFamily: 'var(--font-oswald)' }}>
        Facturado vs Pagado — últimos 6 meses
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Bar dataKey="facturado" name="Facturado" fill="#13602C" radius={[4, 4, 0, 0]} />
          <Bar dataKey="pagado"    name="Pagado"    fill="#4AC3B2" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
