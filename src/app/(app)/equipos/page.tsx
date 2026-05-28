import { requireRol } from '@/lib/roles'
import Link from 'next/link'
import {
  Wrench,
  AlertTriangle,
  Clock,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
  Microscope,
  Beaker,
  Building2,
  Ruler,
} from 'lucide-react'
import { getEquipos, getResumenEquipos } from '@/app/actions/equipos'
import { type EstadoEquipo, mesLabel } from '@/lib/equipos-utils'

// ── Types & helpers ───────────────────────────────────────────────────────────

const AREA_LABELS: Record<string, string> = {
  B:   'Biología',
  Q:   'Química',
  M:   'Microbiología',
  AD:  'Administración',
  CAL: 'Calibración',
}

const AREA_ICONS: Record<string, React.ElementType> = {
  B:   Microscope,
  Q:   FlaskConical,
  M:   Beaker,
  AD:  Building2,
  CAL: Ruler,
}

const ESTADO_CONFIG: Record<EstadoEquipo, {
  label:   string
  icon:    React.ElementType
  bg:      string
  fg:      string
  border:  string
  dot:     string
}> = {
  VENCIDO:    { label: 'Vencido',    icon: AlertTriangle,   bg: '#fef2f2', fg: '#dc2626', border: '#fecaca', dot: '#ef4444' },
  PROXIMO:    { label: 'Próximo',    icon: Clock,           bg: '#fffbeb', fg: '#d97706', border: '#fde68a', dot: '#f59e0b' },
  PROGRAMADO: { label: 'Programado', icon: CalendarCheck2,  bg: '#eff6ff', fg: '#2563eb', border: '#bfdbfe', dot: '#3b82f6' },
  AL_DIA:     { label: 'Al día',     icon: CheckCircle2,    bg: '#f0fdf4', fg: '#16a34a', border: '#bbf7d0', dot: '#22c55e' },
}

const TIPO_CONFIG: Record<string, { label: string; color: string }> = {
  PREVENTIVO:   { label: 'Prev.',   color: '#ef4444' },
  CALIBRACION:  { label: 'Cal.',    color: '#2563eb' },
  VERIFICACION: { label: 'Verif.',  color: '#6b7280' },
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, bg, muted }: {
  label:  string
  value:  number
  icon:   React.ElementType
  color:  string
  bg:     string
  muted?: boolean
}) {
  return (
    <div
      className="cetox-card p-4 flex items-center gap-3"
      style={{ opacity: muted ? 0.7 : 1 }}
    >
      <div
        className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
        style={{ backgroundColor: bg }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <div
          className="text-2xl font-bold leading-none"
          style={{ fontFamily: 'var(--font-oswald)', color }}
        >
          {value}
        </div>
        <div className="text-xs text-slate-500 mt-0.5" style={{ fontFamily: 'var(--font-montserrat)' }}>
          {label}
        </div>
      </div>
    </div>
  )
}

// ── Filter bar ────────────────────────────────────────────────────────────────

function FiltrosBadge({ area, estado }: { area?: string; estado?: string }) {
  const areas  = ['B', 'Q', 'M', 'AD', 'CAL']
  const estados: EstadoEquipo[] = ['VENCIDO', 'PROXIMO', 'PROGRAMADO', 'AL_DIA']

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Area filter */}
      <div className="flex gap-1 flex-wrap">
        {areas.map(a => (
          <Link
            key={a}
            href={`/equipos${a === area ? '' : `?area=${a}${estado ? `&estado=${estado}` : ''}`}`}
            className="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
            style={{
              fontFamily:      'var(--font-montserrat)',
              backgroundColor: a === area ? '#1F4E79' : 'rgba(0,0,0,0.05)',
              color:           a === area ? 'white'   : '#64748b',
            }}
          >
            {AREA_LABELS[a]}
          </Link>
        ))}
      </div>

      <div style={{ width: 1, height: 20, backgroundColor: '#e2e8f0' }} />

      {/* Status filter */}
      <div className="flex gap-1 flex-wrap">
        {estados.map(e => {
          const cfg = ESTADO_CONFIG[e]
          return (
            <Link
              key={e}
              href={`/equipos${e === estado ? '' : `?estado=${e}${area ? `&area=${area}` : ''}`}`}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
              style={{
                fontFamily:      'var(--font-montserrat)',
                backgroundColor: e === estado ? cfg.fg   : 'rgba(0,0,0,0.05)',
                color:           e === estado ? 'white' : '#64748b',
              }}
            >
              {cfg.label}
            </Link>
          )
        })}
      </div>

      {(area || estado) && (
        <Link
          href="/equipos"
          className="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
          style={{ fontFamily: 'var(--font-montserrat)', backgroundColor: 'rgba(0,0,0,0.05)', color: '#64748b' }}
        >
          × Limpiar
        </Link>
      )}
    </div>
  )
}

// ── Equipment row ─────────────────────────────────────────────────────────────

function EquipoRow({ equipo }: { equipo: Awaited<ReturnType<typeof getEquipos>>[number] }) {
  const cfg    = ESTADO_CONFIG[equipo.estadoGeneral]
  const Icon   = cfg.icon
  const AreaIcon = AREA_ICONS[equipo.area ?? 'AD'] ?? Building2

  const tareasProximas = equipo.tareas
    .filter(t => !t.completado)
    .sort((a, b) => (a.anio * 12 + a.mes) - (b.anio * 12 + b.mes))
    .slice(0, 3)

  return (
    <Link
      href={`/equipos/${equipo.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
    >
      {/* Status dot */}
      <div
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: cfg.dot }}
      />

      {/* Area icon */}
      <div
        className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
        style={{ backgroundColor: 'rgba(31,78,121,0.07)' }}
      >
        <AreaIcon className="w-4 h-4" style={{ color: '#1F4E79' }} />
      </div>

      {/* Code + name */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span
            className="text-[11px] font-bold"
            style={{ fontFamily: 'var(--font-oswald)', color: '#4AC3B2', letterSpacing: '0.05em' }}
          >
            {equipo.codigo}
          </span>
          <span
            className="text-sm font-semibold text-slate-800 truncate"
            style={{ fontFamily: 'var(--font-montserrat)' }}
          >
            {equipo.nombre}
          </span>
        </div>
        {equipo.area && (
          <span className="text-[10px] text-slate-400">
            {AREA_LABELS[equipo.area] ?? equipo.area}
            {equipo.categoria !== 'GENERAL' ? ` · ${equipo.categoria}` : ''}
          </span>
        )}
      </div>

      {/* Upcoming tasks chips */}
      <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
        {tareasProximas.map(t => {
          const tcfg = TIPO_CONFIG[t.tipo] ?? { label: t.tipo, color: '#64748b' }
          const ecfg = ESTADO_CONFIG[t.estado]
          return (
            <span
              key={t.id}
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
              style={{
                backgroundColor: ecfg.bg,
                color:           ecfg.fg,
                borderColor:     ecfg.border,
              }}
            >
              {mesLabel(t.mes)} · {tcfg.label}
            </span>
          )
        })}
        {equipo.tareas.filter(t => !t.completado).length === 0 && (
          <span className="text-[10px] text-slate-400">Sin tareas pendientes</span>
        )}
      </div>

      {/* Status badge */}
      <div
        className="flex items-center gap-1 px-2 py-1 rounded-lg flex-shrink-0"
        style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        <Icon className="w-3 h-3 flex-shrink-0" style={{ color: cfg.fg }} />
        <span
          className="text-[10px] font-semibold"
          style={{ fontFamily: 'var(--font-montserrat)', color: cfg.fg }}
        >
          {cfg.label}
        </span>
      </div>

      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 group-hover:text-slate-500 transition-colors" />
    </Link>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function EquiposPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string; estado?: string; buscar?: string }>
}) {
  await requireRol(['ADMINISTRACION', 'GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'JEFE_OPERACIONES'])

  const params  = await searchParams
  const area    = params.area
  const estado  = params.estado as EstadoEquipo | undefined
  const buscar  = params.buscar

  const [resumen, equipos] = await Promise.all([
    getResumenEquipos(),
    getEquipos({ area, estado, buscar }),
  ])

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#1F4E79 0%,#2d6fa8 100%)' }}
          >
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1
              className="text-xl font-bold text-slate-900 leading-none"
              style={{ fontFamily: 'var(--font-oswald)', letterSpacing: '0.06em' }}
            >
              EQUIPOS & MANTENIMIENTO
            </h1>
            <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: 'var(--font-montserrat)' }}>
              Programa 2026 · Mantenimiento, Calibración y Verificación
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Vencidos"
          value={resumen.vencidos}
          icon={AlertTriangle}
          color="#dc2626"
          bg="rgba(220,38,38,0.1)"
        />
        <StatCard
          label="Próximos (30 días)"
          value={resumen.proximos}
          icon={Clock}
          color="#d97706"
          bg="rgba(217,119,6,0.1)"
        />
        <StatCard
          label="Programados"
          value={resumen.programados}
          icon={CalendarCheck2}
          color="#2563eb"
          bg="rgba(37,99,235,0.1)"
        />
        <StatCard
          label="Al día"
          value={resumen.alDia}
          icon={CheckCircle2}
          color="#16a34a"
          bg="rgba(22,163,74,0.1)"
          muted
        />
      </div>

      {/* ── Alert banner ── */}
      {resumen.vencidos > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
          style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
        >
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700" style={{ fontFamily: 'var(--font-montserrat)' }}>
            <strong>{resumen.vencidos} equipos</strong> tienen mantenimiento, calibración o verificación vencidos.
            Revísalos y coordina con el proveedor externo.
          </p>
          <Link
            href="/equipos?estado=VENCIDO"
            className="ml-auto text-xs font-semibold text-red-700 underline flex-shrink-0"
            style={{ fontFamily: 'var(--font-montserrat)' }}
          >
            Ver vencidos
          </Link>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="mb-4">
        <FiltrosBadge area={area} estado={estado} />
      </div>

      {/* ── Equipment list ── */}
      <div className="cetox-card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <p
            className="text-[10px] font-semibold tracking-widest uppercase"
            style={{ color: 'rgba(74,195,178,0.8)', fontFamily: 'var(--font-montserrat)' }}
          >
            {equipos.length} equipo{equipos.length !== 1 ? 's' : ''}
            {area ? ` · ${AREA_LABELS[area] ?? area}` : ''}
            {estado ? ` · ${ESTADO_CONFIG[estado as EstadoEquipo]?.label ?? estado}` : ''}
          </p>

          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3">
            {(['VENCIDO', 'PROXIMO', 'PROGRAMADO', 'AL_DIA'] as EstadoEquipo[]).map(e => (
              <div key={e} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ESTADO_CONFIG[e].dot }} />
                <span className="text-[10px] text-slate-400" style={{ fontFamily: 'var(--font-montserrat)' }}>
                  {ESTADO_CONFIG[e].label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {equipos.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm" style={{ fontFamily: 'var(--font-montserrat)' }}>
              No hay equipos con ese filtro
            </p>
          </div>
        ) : (
          <div>
            {equipos.map((eq, i) => (
              <div key={eq.id} style={{ borderBottom: i < equipos.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                <EquipoRow equipo={eq} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Leyenda de tipos ── */}
      <div className="mt-4 flex flex-wrap gap-4 px-1">
        <p className="text-[10px] text-slate-400" style={{ fontFamily: 'var(--font-montserrat)' }}>
          Tipos de tarea:
        </p>
        {Object.entries(TIPO_CONFIG).map(([tipo, cfg]) => (
          <div key={tipo} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
            <span className="text-[10px] text-slate-400" style={{ fontFamily: 'var(--font-montserrat)' }}>
              {tipo === 'PREVENTIVO' ? 'Mantenimiento Preventivo' : tipo === 'CALIBRACION' ? 'Calibración' : 'Verificación'}
            </span>
          </div>
        ))}
      </div>

    </div>
  )
}
