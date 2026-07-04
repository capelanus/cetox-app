'use client'

import Link from 'next/link'
import {
  LayoutDashboard, Target, ClipboardList, Gauge, ShieldAlert, Rocket, Wrench, FileCheck,
  AlertTriangle, ArrowRight, TrendingUp,
} from 'lucide-react'
import {
  SEMAFORO_COLOR, SEMAFORO_LABEL, colorCeldaMatriz, ESTADO_PROYECTO_LABEL, ESTADO_PROYECTO_COLOR,
} from '@/lib/planeamiento'

interface Data {
  anio: number
  plan: { nombre: string; anioInicio: number; anioFin: number; objetivos: number; acciones: number } | null
  globalPoa: number | null
  avancesPorDepto: { depto: string; label: string; avance: number | null; actividades: number }[]
  kpiSemaforos: { verde: number; ambar: number; rojo: number; gris: number }
  totalKpis: number
  matriz: number[][]
  riesgosActivos: number
  riesgosCriticos: { id: string; descripcion: string; prob: number; imp: number }[]
  proyEstados: Record<string, number>
  totalProyectos: number
  proyAtrasados: { id: string; nombre: string; avance: number }[]
  mejorasAbiertas: number
  mejorasVencidas: { id: string; descripcion: string; resp: string | null }[]
  auditoriasProximas: { id: string; codigo: string; fecha: string; descripcion: string | null }[]
  alertas: { tipo: string; texto: string; nivel: 'rojo' | 'ambar'; enlace: string }[]
}

const fmt = (d: string) => new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })

export function DashboardClient({ data }: { data: Data }) {
  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-1">
          <LayoutDashboard className="w-4 h-4" /> Control gerencial
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Gerencial · {data.anio}</h1>
        {data.plan
          ? <p className="text-sm text-slate-500">{data.plan.nombre} · {data.plan.objetivos} OEI · {data.plan.acciones} AEI</p>
          : <p className="text-sm text-amber-600">Sin PEI activo — <Link href="/gerencia/pei" className="underline">crea el plan</Link>.</p>}
      </div>

      {/* KPIs top row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <BigKpi icon={<TrendingUp className="w-4 h-4" />} label="Avance POA global"
          value={data.globalPoa === null ? '—' : `${data.globalPoa}%`}
          color={data.globalPoa === null ? '#94a3b8' : SEMAFORO_COLOR[data.globalPoa >= 90 ? 'verde' : data.globalPoa >= 70 ? 'ambar' : 'rojo']}
          href="/gerencia/poa" />
        <BigKpi icon={<Gauge className="w-4 h-4" />} label="KPIs en meta"
          value={`${data.kpiSemaforos.verde}/${data.totalKpis}`} color="#10b981" href="/gerencia/indicadores" />
        <BigKpi icon={<ShieldAlert className="w-4 h-4" />} label="Riesgos activos"
          value={String(data.riesgosActivos)} sub={`${data.riesgosCriticos.filter(r => r.prob * r.imp >= 15).length} críticos`} color="#f97316" href="/gerencia/riesgos" />
        <BigKpi icon={<Wrench className="w-4 h-4" />} label="Mejoras abiertas"
          value={String(data.mejorasAbiertas)} sub={data.mejorasVencidas.length ? `${data.mejorasVencidas.length} vencidas` : undefined} color="#ef4444" href="/gerencia/mejoras" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Alertas */}
        <Card title="Alertas prioritarias" icon={<AlertTriangle className="w-4 h-4" />} className="lg:col-span-2">
          {data.alertas.length === 0 ? (
            <Empty text="Sin alertas. Todo en orden." />
          ) : (
            <div className="space-y-1.5">
              {data.alertas.slice(0, 8).map((a, i) => (
                <Link key={i} href={a.enlace} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 group">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: SEMAFORO_COLOR[a.nivel] }} />
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold flex-shrink-0">{a.tipo}</span>
                  <span className="flex-1 text-xs text-slate-600 truncate">{a.texto}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Semáforo KPIs */}
        <Card title="Estado de indicadores" icon={<Gauge className="w-4 h-4" />}>
          <div className="space-y-2">
            {(['verde', 'ambar', 'rojo', 'gris'] as const).map(s => {
              const val = data.kpiSemaforos[s]
              const pct = data.totalKpis ? (val / data.totalKpis) * 100 : 0
              return (
                <div key={s}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">{SEMAFORO_LABEL[s]}</span>
                    <span className="font-semibold text-slate-700">{val}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: SEMAFORO_COLOR[s] }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Avance POA por depto */}
        <Card title="Avance POA por departamento" icon={<ClipboardList className="w-4 h-4" />} className="lg:col-span-2">
          {data.avancesPorDepto.length === 0 ? <Empty text="Sin actividades registradas este año." /> : (
            <div className="space-y-2.5">
              {data.avancesPorDepto.map(g => (
                <div key={g.depto}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">{g.label} <span className="text-slate-400">({g.actividades})</span></span>
                    <span className="font-bold text-slate-700">{g.avance === null ? '—' : `${g.avance}%`}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, g.avance ?? 0)}%`,
                      backgroundColor: (g.avance ?? 0) >= 90 ? '#10b981' : (g.avance ?? 0) >= 70 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Matriz riesgos */}
        <Card title="Mapa de riesgos" icon={<ShieldAlert className="w-4 h-4" />}>
          <MatrizMini matriz={data.matriz} />
          {data.riesgosCriticos.length > 0 && (
            <div className="mt-3 space-y-1">
              {data.riesgosCriticos.slice(0, 3).map(r => (
                <div key={r.id} className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: colorCeldaMatriz(r.prob, r.imp) }} />
                  <span className="truncate">{r.descripcion}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Proyectos */}
        <Card title="Portafolio de proyectos" icon={<Rocket className="w-4 h-4" />}>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {Object.entries(data.proyEstados).filter(([, v]) => v > 0).map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ESTADO_PROYECTO_COLOR[k] }} />
                <span className="text-slate-500">{ESTADO_PROYECTO_LABEL[k]}</span>
                <span className="font-bold text-slate-700">{v}</span>
              </span>
            ))}
            {data.totalProyectos === 0 && <Empty text="Sin proyectos." />}
          </div>
          {data.proyAtrasados.length > 0 && (
            <div className="border-t border-slate-100 pt-2">
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">Atrasados</p>
              {data.proyAtrasados.slice(0, 3).map(p => (
                <p key={p.id} className="text-[11px] text-slate-500 truncate">• {p.nombre} ({p.avance}%)</p>
              ))}
            </div>
          )}
        </Card>

        {/* Auditorías */}
        <Card title="Auditorías próximas (60 días)" icon={<FileCheck className="w-4 h-4" />}>
          {data.auditoriasProximas.length === 0 ? <Empty text="Sin auditorías programadas." /> : (
            <div className="space-y-1.5">
              {data.auditoriasProximas.slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center gap-2 text-xs">
                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold">{fmt(a.fecha)}</span>
                  <span className="text-slate-600 truncate flex-1">{a.codigo}{a.descripcion ? ` · ${a.descripcion}` : ''}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function BigKpi({ icon, label, value, sub, color, href }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string; href: string
}) {
  return (
    <Link href={href} className="bg-white rounded-xl border border-slate-200 px-4 py-3.5 shadow-sm hover:shadow-md transition-shadow block">
      <div className="flex items-center gap-1.5 text-slate-400 mb-1.5" style={{ color }}>{icon}<span className="text-[11px] text-slate-500 font-medium">{label}</span></div>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </Link>
  )
}

function Card({ title, icon, children, className = '' }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; className?: string
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 shadow-sm ${className}`}>
      <div className="flex items-center gap-2 text-slate-700 mb-3">
        <span className="text-emerald-600">{icon}</span>
        <h2 className="text-sm font-bold">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="text-xs text-slate-400 py-4 text-center">{text}</p>
}

function MatrizMini({ matriz }: { matriz: number[][] }) {
  // matriz[prob-1][imp-1]; mostrar prob 5→1 filas, imp 1→5 columnas
  return (
    <div className="inline-block">
      {[5, 4, 3, 2, 1].map(p => (
        <div key={p} className="flex">
          {[1, 2, 3, 4, 5].map(i => {
            const c = matriz[p - 1][i - 1]
            return (
              <div key={i} className="w-7 h-7 m-0.5 rounded flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: colorCeldaMatriz(p, i), opacity: c === 0 ? 0.25 : 1 }}>
                {c > 0 ? c : ''}
              </div>
            )
          })}
        </div>
      ))}
      <div className="flex text-[9px] text-slate-400 mt-0.5">
        {[1, 2, 3, 4, 5].map(i => <span key={i} className="w-7 m-0.5 text-center">{i}</span>)}
      </div>
      <p className="text-[9px] text-slate-400 text-center">Impacto → (filas: probabilidad)</p>
    </div>
  )
}
