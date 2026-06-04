import { requireNotAnalista } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import {
  FileText,
  ClipboardList,
  TestTube,
  FileCheck,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Wrench,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import { DashboardPipeline } from '@/components/dashboard-pipeline'
import type { StageCount } from '@/components/dashboard-pipeline'
import { getResumenEquipos } from '@/app/actions/equipos'
import { DashboardCharts } from '@/components/dashboard-charts'

/* ─── KPI Card ───────────────────────────────────────────────────────────── */

interface KpiCardProps {
  title:    string
  value:    number
  subtitle: string
  icon:     React.ReactNode
  color:    string
  bg:       string
}

function KpiCard({ title, value, subtitle, icon, color, bg }: KpiCardProps) {
  return (
    <div className="cetox-card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#808080', fontFamily: 'var(--font-montserrat)' }}>
            {title}
          </p>
          <p
            className="text-4xl font-bold leading-none"
            style={{ color, fontFamily: 'var(--font-oswald)' }}
          >
            {value}
          </p>
        </div>
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
          style={{ backgroundColor: bg }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <p className="text-xs" style={{ color: '#808080', fontFamily: 'var(--font-montserrat)' }}>
        {subtitle}
      </p>
    </div>
  )
}

/* ─── Página ─────────────────────────────────────────────────────────────── */

export default async function DashboardPage() {
  const session = await requireNotAnalista()

  const [
    cotPendientes,
    setsEnCurso,
    odasPendientes,
    informesRevisar,
    cotTotales,
    setsTotales,
    cotByEstado,
    setsByEstado,
    odasByEstado,
    informesByEstado,
    resumenEquipos,
    cotRecientes,
    setsRecientes,
  ] = await Promise.all([
    prisma.cotizacion.count({ where: { deletedAt: null, estado: { in: ['BORRADOR', 'EN_REVISION', 'ENVIADA'] } } }),
    prisma.sET.count({ where: { estado: { in: ['EMITIDA', 'EN_EJECUCION'] } } }),
    prisma.oDA.count({ where: { estado: { in: ['EMITIDA', 'RECIBIDA', 'EN_EJECUCION'] } } }),
    prisma.informe.count({ where: { estado: { in: ['BORRADOR', 'EN_REVISION_CALIDAD', 'EN_FIRMA_GERENCIA'] } } }),
    prisma.cotizacion.count({ where: { deletedAt: null } }),
    prisma.sET.count({ where: { estado: { not: 'ANULADO' } } }),
    prisma.cotizacion.groupBy({ by: ['estado'], where: { deletedAt: null }, _count: { estado: true } }),
    prisma.sET.groupBy({ by: ['estado'], where: { estado: { not: 'ANULADO' } }, _count: { estado: true } }),
    prisma.oDA.groupBy({ by: ['estado'], _count: { estado: true } }),
    prisma.informe.groupBy({ by: ['estado'], _count: { estado: true } }),
    getResumenEquipos().catch(() => null),
    // Monthly data: last 6 months
    prisma.cotizacion.findMany({
      where: { deletedAt: null, fechaEmision: { gte: new Date(new Date().setMonth(new Date().getMonth() - 5, 1)) } },
      select: { fechaEmision: true },
    }),
    prisma.sET.findMany({
      where: { estado: { not: 'ANULADO' }, fechaIngreso: { gte: new Date(new Date().setMonth(new Date().getMonth() - 5, 1)) } },
      select: { fechaIngreso: true },
    }),
  ])

  const normalize = (rows: { estado: string; _count: { estado: number } }[]): StageCount[] =>
    rows.map(r => ({ estado: r.estado, count: r._count.estado }))

  // ── Monthly chart data (last 6 months) ──────────────────────────────────
  const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const now   = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return { year: d.getFullYear(), month: d.getMonth(), label: MESES_CORTOS[d.getMonth()] }
  })

  function countByMonth(items: { fecha: Date }[], year: number, month: number) {
    return items.filter(i => i.fecha.getFullYear() === year && i.fecha.getMonth() === month).length
  }

  const cotFechas  = cotRecientes.map(c  => ({ fecha: c.fechaEmision }))
  const setsFechas = setsRecientes.map(s => ({ fecha: s.fechaIngreso }))

  const monthlyData = months.map(m => ({
    mes:          m.label,
    cotizaciones: countByMonth(cotFechas,  m.year, m.month),
    ensayos:      countByMonth(setsFechas, m.year, m.month),
  }))

  // ── Estado colors for pie chart ──────────────────────────────────────────
  const ESTADO_COLORS: Record<string, string> = {
    BORRADOR:     '#94a3b8',
    EN_REVISION:  '#f59e0b',
    ENVIADA:      '#3b82f6',
    APROBADA:     '#10b981',
    RECHAZADA:    '#ef4444',
    ANULADA:      '#6b7280',
    EN_EJECUCION: '#8b5cf6',
    COMPLETADA:   '#13602C',
  }
  const estadosPie = cotByEstado.map(r => ({
    estado: r.estado,
    count:  r._count.estado,
    color:  ESTADO_COLORS[r.estado] ?? '#94a3b8',
  }))

  const hora = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })
  const fecha = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Lima' })

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-3xl font-bold tracking-wide uppercase"
            style={{ color: '#13602C', fontFamily: 'var(--font-oswald)', letterSpacing: '0.04em' }}
          >
            Dashboard
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#808080', fontFamily: 'var(--font-montserrat)' }}>
            Bienvenido, <span className="font-semibold" style={{ color: '#13602C' }}>{session?.user.name}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: '#808080', fontFamily: 'var(--font-montserrat)' }}>
            {fecha.charAt(0).toUpperCase() + fecha.slice(1)}
          </p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: '#13602C', fontFamily: 'var(--font-oswald)', letterSpacing: '0.05em' }}>
            {hora} hrs
          </p>
        </div>
      </div>

      {/* ── Separador técnico ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1" style={{ backgroundColor: '#CCE3DE' }} />
        <span className="text-[10px] font-semibold uppercase tracking-widest px-2" style={{ color: '#4AC3B2', fontFamily: 'var(--font-oswald)' }}>
          Indicadores operativos
        </span>
        <div className="h-px flex-1" style={{ backgroundColor: '#CCE3DE' }} />
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
        <KpiCard
          title="Cotizaciones activas"
          value={cotPendientes}
          subtitle="Borrador · En revisión · Enviadas"
          icon={<FileText className="h-5 w-5" />}
          color="#13602C"
          bg="#DCF0E4"
        />
        <KpiCard
          title="SET en curso"
          value={setsEnCurso}
          subtitle="Emitidas · En ejecución"
          icon={<ClipboardList className="h-5 w-5" />}
          color="#d97706"
          bg="#FEF3C7"
        />
        <KpiCard
          title="ODA pendientes"
          value={odasPendientes}
          subtitle="Emitidas · Recibidas · En ejecución"
          icon={<TestTube className="h-5 w-5" />}
          color="#ea580c"
          bg="#FFEDD5"
        />
        <KpiCard
          title="Informes a revisar"
          value={informesRevisar}
          subtitle="Borrador · Rev. calidad · Firma gerencia"
          icon={<FileCheck className="h-5 w-5" />}
          color="#4AC3B2"
          bg="#CCEFE9"
        />
      </div>

      {/* ── Stats secundarios ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 mt-4">
        {[
          {
            label: 'Cotizaciones totales',
            value: cotTotales,
            icon: <TrendingUp className="h-4 w-4" />,
            color: '#13602C',
          },
          {
            label: 'SETs totales',
            value: setsTotales,
            icon: <Clock className="h-4 w-4" />,
            color: '#13602C',
          },
          {
            label: 'Tasa de cierre',
            value: cotTotales > 0
              ? `${Math.round(((cotTotales - cotPendientes) / cotTotales) * 100)}%`
              : '—',
            icon: <CheckCircle className="h-4 w-4" />,
            color: '#4AC3B2',
          },
        ].map(({ label, value, icon, color }) => (
          <div
            key={label}
            className="flex items-center gap-4 px-5 py-4 rounded-xl"
            style={{ backgroundColor: '#CCE3DE' }}
          >
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
              style={{ backgroundColor: 'white' }}
            >
              <span style={{ color }}>{icon}</span>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: '#808080', fontFamily: 'var(--font-montserrat)' }}>
                {label}
              </p>
              <p className="text-xl font-bold leading-none mt-0.5" style={{ color, fontFamily: 'var(--font-oswald)' }}>
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Gráficos ── */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1" style={{ backgroundColor: '#CCE3DE' }} />
        <span className="text-[10px] font-semibold uppercase tracking-widest px-2" style={{ color: '#4AC3B2', fontFamily: 'var(--font-oswald)' }}>
          Actividad y distribución
        </span>
        <div className="h-px flex-1" style={{ backgroundColor: '#CCE3DE' }} />
      </div>
      <DashboardCharts monthly={monthlyData} estados={estadosPie} />

      {/* ── Equipment alerts ── */}
      {resumenEquipos && (resumenEquipos.vencidos > 0 || resumenEquipos.proximos > 0) && (
        <div className="mb-6 mt-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1" style={{ backgroundColor: '#CCE3DE' }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest px-2" style={{ color: '#4AC3B2', fontFamily: 'var(--font-oswald)' }}>
              Alertas de equipos
            </span>
            <div className="h-px flex-1" style={{ backgroundColor: '#CCE3DE' }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {resumenEquipos.vencidos > 0 && (
              <Link
                href="/equipos?estado=VENCIDO"
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0" style={{ backgroundColor: 'rgba(220,38,38,0.1)' }}>
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-700" style={{ fontFamily: 'var(--font-montserrat)' }}>
                    {resumenEquipos.vencidos} equipo{resumenEquipos.vencidos !== 1 ? 's' : ''} con mantenimiento vencido
                  </p>
                  <p className="text-[11px] text-red-500">Requieren atención inmediata</p>
                </div>
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              </Link>
            )}
            {resumenEquipos.proximos > 0 && (
              <Link
                href="/equipos?estado=PROXIMO"
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0" style={{ backgroundColor: 'rgba(217,119,6,0.1)' }}>
                  <Wrench className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-700" style={{ fontFamily: 'var(--font-montserrat)' }}>
                    {resumenEquipos.proximos} equipo{resumenEquipos.proximos !== 1 ? 's' : ''} con mantenimiento próximo
                  </p>
                  <p className="text-[11px] text-amber-500">Programar con proveedor</p>
                </div>
                <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Pipeline ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1" style={{ backgroundColor: '#CCE3DE' }} />
        <span className="text-[10px] font-semibold uppercase tracking-widest px-2" style={{ color: '#4AC3B2', fontFamily: 'var(--font-oswald)' }}>
          Pipeline de trabajo
        </span>
        <div className="h-px flex-1" style={{ backgroundColor: '#CCE3DE' }} />
      </div>

      <DashboardPipeline
        cotizaciones={normalize(cotByEstado)}
        sets={normalize(setsByEstado)}
        odas={normalize(odasByEstado)}
        informes={normalize(informesByEstado)}
      />
    </div>
  )
}
