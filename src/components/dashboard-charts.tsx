'use client'

import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface MonthlyPoint {
  mes:           string   // "Ene", "Feb", etc.
  cotizaciones:  number
  ensayos:       number
}

interface EstadoPoint {
  estado: string
  count:  number
  color:  string
}

interface Props {
  monthly:  MonthlyPoint[]
  estados:  EstadoPoint[]
}

// ── Paleta ────────────────────────────────────────────────────────────────────

const TEAL   = '#4AC3B2'
const GREEN  = '#13602C'
const MINT   = '#9EE3DA'

// ── Custom tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?:  string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl px-3 py-2 shadow-lg text-xs"
      style={{
        backgroundColor: 'var(--card)',
        border:          '1px solid var(--border)',
        color:           'var(--foreground)',
      }}
    >
      {label && <p className="font-semibold mb-1">{label}</p>}
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Section title ─────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-widest mb-4"
      style={{ color: '#4AC3B2', fontFamily: 'var(--font-oswald)' }}
    >
      {children}
    </p>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DashboardCharts({ monthly, estados }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">

      {/* ── Área: Actividad mensual (span 2 cols) ── */}
      <div className="cetox-card p-5 lg:col-span-2">
        <SectionTitle>Actividad últimos 6 meses</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={monthly} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCot" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={GREEN}  stopOpacity={0.25} />
                <stop offset="95%" stopColor={GREEN}  stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradEns" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={TEAL}   stopOpacity={0.25} />
                <stop offset="95%" stopColor={TEAL}   stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
            <Area
              type="monotone"
              dataKey="cotizaciones"
              name="Cotizaciones"
              stroke={GREEN}
              strokeWidth={2}
              fill="url(#gradCot)"
              dot={{ r: 3, fill: GREEN }}
              activeDot={{ r: 5 }}
            />
            <Area
              type="monotone"
              dataKey="ensayos"
              name="Ensayos"
              stroke={TEAL}
              strokeWidth={2}
              fill="url(#gradEns)"
              dot={{ r: 3, fill: TEAL }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Pie: Estados de cotizaciones ── */}
      <div className="cetox-card p-5">
        <SectionTitle>Cotizaciones por estado</SectionTitle>
        <div className="flex flex-col items-center gap-4">
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={estados}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={68}
                dataKey="count"
                nameKey="estado"
                paddingAngle={3}
                strokeWidth={0}
              >
                {estados.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const p = payload[0]
                  return (
                    <div
                      className="rounded-xl px-3 py-2 shadow-lg text-xs"
                      style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                    >
                      <span className="font-semibold">{p.name}: </span>
                      <span>{p.value}</span>
                    </div>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="w-full space-y-1.5">
            {estados.map(e => (
              <div key={e.estado} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                  <span style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-montserrat)' }}>
                    {e.estado.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>{e.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
