'use client'

import Link from 'next/link'
import {
  Wallet, TrendingUp, TrendingDown, PieChart, Building2, FileText, ArrowRight, Users, FlaskConical,
} from 'lucide-react'
import { MESES, soles, pctEjecucion, colorEjecucion, colorMargen } from '@/lib/contabilidad'

interface TopItem { nombre: string; margen: number; pct: number | null }
interface Data {
  anio: number
  ingPlan: number; ingReal: number; egrPlan: number; egrReal: number; centrosCount: number
  meses: { periodo: number; neto: number }[]
  topClientes: TopItem[]; topServicios: TopItem[]
  documentos: { id: string; nombre: string; url: string; categoria: string | null; createdAt: string }[]
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })

export function ContabilidadDashboard({ data }: { data: Data }) {
  const resultProy = data.ingPlan - data.egrPlan
  const resultReal = data.ingReal - data.egrReal
  const pctEgr = pctEjecucion(data.egrPlan, data.egrReal)
  const maxAbs = Math.max(1, ...data.meses.map(m => Math.abs(m.neto)))

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-1">
          <Wallet className="w-4 h-4" /> Contabilidad y Finanzas
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Panel financiero · {data.anio}</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Ingresos ejecutados" value={soles(data.ingReal)}
          sub={`de ${soles(data.ingPlan)} plan`} color="#10b981" href="/gerencia/contabilidad/presupuesto" />
        <Kpi icon={<TrendingDown className="w-4 h-4" />} label="Egresos ejecutados" value={soles(data.egrReal)}
          sub={pctEgr !== null ? `${pctEgr}% del presupuesto` : 'sin plan'} color={colorEjecucion(pctEgr, 'EGRESO')} href="/gerencia/contabilidad/presupuesto" />
        <Kpi icon={<Wallet className="w-4 h-4" />} label="Resultado real" value={soles(resultReal)}
          sub={`Proyectado: ${soles(resultProy)}`} color={resultReal >= 0 ? '#10b981' : '#ef4444'} href="/gerencia/contabilidad/flujo-caja" />
        <Kpi icon={<Building2 className="w-4 h-4" />} label="Centros de costo" value={String(data.centrosCount)}
          color="#8b5cf6" href="/gerencia/contabilidad/centros-costo" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Flujo de caja mini */}
        <Card title="Flujo de caja proyectado" icon={<TrendingUp className="w-4 h-4" />} className="lg:col-span-2"
          href="/gerencia/contabilidad/flujo-caja">
          <div className="flex items-end justify-between gap-1 h-32 mt-2">
            {data.meses.map(m => {
              const h = (Math.abs(m.neto) / maxAbs) * 100
              const pos = m.neto >= 0
              return (
                <div key={m.periodo} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <div className="w-full max-w-[24px] rounded-t" style={{ height: `${h}%`, backgroundColor: pos ? '#10b981' : '#ef4444', minHeight: m.neto !== 0 ? 2 : 0 }} />
                  <span className="text-[9px] text-slate-400 mt-1">{MESES[m.periodo - 1]}</span>
                  <span className="absolute -top-5 opacity-0 group-hover:opacity-100 text-[10px] font-semibold bg-slate-800 text-white px-1.5 py-0.5 rounded whitespace-nowrap z-10">{soles(m.neto)}</span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Documentos recientes */}
        <Card title="Documentos recientes" icon={<FileText className="w-4 h-4" />} href="/gerencia/contabilidad/documentos">
          {data.documentos.length === 0 ? <Empty text="Sin documentos." /> : (
            <div className="space-y-1.5">
              {data.documentos.map(d => (
                <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50">
                  <FileText className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="flex-1 text-xs text-slate-600 truncate">{d.nombre}</span>
                  <span className="text-[10px] text-slate-400">{fmtDate(d.createdAt)}</span>
                </a>
              ))}
            </div>
          )}
        </Card>

        {/* Top clientes */}
        <TopCard title="Rentabilidad por cliente" icon={<Users className="w-4 h-4" />} items={data.topClientes} />
        {/* Top servicios */}
        <TopCard title="Rentabilidad por servicio" icon={<FlaskConical className="w-4 h-4" />} items={data.topServicios} />

        {/* Accesos rápidos */}
        <Card title="Accesos" icon={<PieChart className="w-4 h-4" />}>
          <div className="space-y-1.5">
            {[
              ['Presupuesto', '/gerencia/contabilidad/presupuesto'],
              ['Flujo de caja', '/gerencia/contabilidad/flujo-caja'],
              ['Centros de costo', '/gerencia/contabilidad/centros-costo'],
              ['Rentabilidad', '/gerencia/contabilidad/rentabilidad'],
              ['Documentos', '/gerencia/contabilidad/documentos'],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 text-xs text-slate-600 group">
                {label}<ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function Kpi({ icon, label, value, sub, color, href }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string; href: string
}) {
  return (
    <Link href={href} className="bg-white rounded-xl border border-slate-200 px-4 py-3.5 shadow-sm hover:shadow-md transition-shadow block">
      <div className="flex items-center gap-1.5 mb-1.5" style={{ color }}>{icon}<span className="text-[11px] text-slate-500 font-medium">{label}</span></div>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </Link>
  )
}

function Card({ title, icon, children, className = '', href }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; className?: string; href?: string
}) {
  const head = (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2 text-slate-700"><span className="text-emerald-600">{icon}</span><h2 className="text-sm font-bold">{title}</h2></div>
      {href && <ArrowRight className="w-4 h-4 text-slate-300" />}
    </div>
  )
  const body = <div className={`bg-white rounded-xl border border-slate-200 p-4 shadow-sm ${className}`}>{head}{children}</div>
  return href ? <Link href={href} className={`block hover:shadow-md transition-shadow rounded-xl ${className}`}>{body}</Link> : body
}

function TopCard({ title, icon, items }: { title: string; icon: React.ReactNode; items: TopItem[] }) {
  const max = Math.max(1, ...items.map(i => Math.abs(i.margen)))
  return (
    <Card title={title} icon={icon} href="/gerencia/contabilidad/rentabilidad">
      {items.length === 0 ? <Empty text="Sin registros." /> : (
        <div className="space-y-2">
          {items.map(i => (
            <div key={i.nombre}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 truncate max-w-[60%]">{i.nombre}</span>
                <span className="font-semibold" style={{ color: colorMargen(i.pct) }}>{soles(i.margen)} {i.pct !== null && `(${i.pct}%)`}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(Math.abs(i.margen) / max) * 100}%`, backgroundColor: colorMargen(i.pct) }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="text-xs text-slate-400 py-4 text-center">{text}</p>
}
