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
} from 'lucide-react'
import { DashboardPipeline } from '@/components/dashboard-pipeline'
import type { StageCount } from '@/components/dashboard-pipeline'

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
  ] = await Promise.all([
    prisma.cotizacion.count({ where: { deletedAt: null, estado: { in: ['BORRADOR', 'EN_REVISION', 'ENVIADA'] } } }),
    prisma.sET.count({ where: { estado: { in: ['EMITIDA', 'EN_EJECUCION'] } } }),
    prisma.oDA.count({ where: { estado: { in: ['EMITIDA', 'RECIBIDA', 'EN_EJECUCION'] } } }),
    prisma.informe.count({ where: { estado: { in: ['BORRADOR', 'EN_REVISION_CALIDAD', 'EN_FIRMA_GERENCIA'] } } }),
    prisma.cotizacion.count({ where: { deletedAt: null } }),
    prisma.sET.count(),
    prisma.cotizacion.groupBy({ by: ['estado'], where: { deletedAt: null }, _count: { estado: true } }),
    prisma.sET.groupBy({ by: ['estado'], _count: { estado: true } }),
    prisma.oDA.groupBy({ by: ['estado'], _count: { estado: true } }),
    prisma.informe.groupBy({ by: ['estado'], _count: { estado: true } }),
  ])

  const normalize = (rows: { estado: string; _count: { estado: number } }[]): StageCount[] =>
    rows.map(r => ({ estado: r.estado, count: r._count.estado }))

  const hora = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  const fecha = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

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
