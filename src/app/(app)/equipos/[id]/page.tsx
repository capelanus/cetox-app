import { requireRol } from '@/lib/roles'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Wrench,
  AlertTriangle,
  Clock,
  CalendarCheck2,
  CheckCircle2,
  FlaskConical,
  Microscope,
  Beaker,
  Building2,
  Ruler,
  Info,
} from 'lucide-react'
import { getEquipo } from '@/app/actions/equipos'
import { type EstadoEquipo, mesLabel } from '@/lib/equipos-utils'
import { TareaActions } from './tarea-actions'

// ── Config ────────────────────────────────────────────────────────────────────

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
  label:  string
  icon:   React.ElementType
  bg:     string
  fg:     string
  border: string
}> = {
  VENCIDO:    { label: 'Vencido',    icon: AlertTriangle,  bg: '#fef2f2', fg: '#dc2626', border: '#fecaca' },
  PROXIMO:    { label: 'Próximo',    icon: Clock,          bg: '#fffbeb', fg: '#d97706', border: '#fde68a' },
  PROGRAMADO: { label: 'Programado', icon: CalendarCheck2, bg: '#eff6ff', fg: '#2563eb', border: '#bfdbfe' },
  AL_DIA:     { label: 'Al día',     icon: CheckCircle2,   bg: '#f0fdf4', fg: '#16a34a', border: '#bbf7d0' },
}

const TIPO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PREVENTIVO:   { label: 'Mantenimiento Preventivo', color: '#dc2626', bg: 'rgba(220,38,38,0.08)'  },
  CALIBRACION:  { label: 'Calibración',              color: '#2563eb', bg: 'rgba(37,99,235,0.08)'  },
  VERIFICACION: { label: 'Verificación',             color: '#6b7280', bg: 'rgba(107,114,128,0.08)' },
}

const MESES_NOMBRES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function EquipoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRol(['ADMINISTRACION', 'GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'JEFE_OPERACIONES'])

  const { id } = await params
  const equipo = await getEquipo(id)
  if (!equipo) notFound()

  const AreaIcon  = AREA_ICONS[equipo.area ?? 'AD'] ?? Building2
  const estadoCfg = ESTADO_CONFIG[equipo.estadoGeneral]
  const EstadoIcon = estadoCfg.icon

  // Group tasks by year & month
  const tareasPorMes = new Map<string, typeof equipo.tareas>()
  for (const t of equipo.tareas) {
    const key = `${t.anio}-${String(t.mes).padStart(2, '0')}`
    if (!tareasPorMes.has(key)) tareasPorMes.set(key, [])
    tareasPorMes.get(key)!.push(t)
  }
  const mesesOrdenados = [...tareasPorMes.entries()].sort(([a], [b]) => a.localeCompare(b))

  // Progress
  const total    = equipo.tareas.length
  const done     = equipo.tareas.filter(t => t.completado).length
  const pct      = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* ── Back ── */}
      <Link
        href="/equipos"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition mb-5"
        style={{ fontFamily: 'var(--font-montserrat)' }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver a Equipos
      </Link>

      {/* ── Header card ── */}
      <div className="cetox-card p-5 mb-5">
        <div className="flex flex-wrap items-start gap-4">

          {/* Area icon */}
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#13602C 0%,#2d6fa8 100%)' }}
          >
            <AreaIcon className="w-6 h-6 text-white" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-sm font-bold"
                style={{ fontFamily: 'var(--font-oswald)', color: '#4AC3B2', letterSpacing: '0.07em' }}
              >
                {equipo.codigo}
              </span>
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                style={{ backgroundColor: estadoCfg.bg, color: estadoCfg.fg, borderColor: estadoCfg.border }}
              >
                <EstadoIcon className="w-3 h-3" />
                {estadoCfg.label}
              </div>
            </div>
            <h1
              className="text-lg font-bold text-slate-900 mt-0.5"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              {equipo.nombre}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              {equipo.area && (
                <span className="text-xs text-slate-500">
                  Área: <strong>{AREA_LABELS[equipo.area] ?? equipo.area}</strong>
                </span>
              )}
              {equipo.categoria !== 'GENERAL' && (
                <span className="text-xs text-slate-500">
                  Categoría: <strong>{equipo.categoria}</strong>
                </span>
              )}
              {equipo.ultimoServicio && (
                <span className="text-xs text-slate-500">
                  Último servicio:{' '}
                  <strong>{new Date(equipo.ultimoServicio).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Progress circle */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div
              className="flex items-center justify-center w-14 h-14 rounded-full border-4 font-bold text-lg"
              style={{
                borderColor:      pct === 100 ? '#22c55e' : pct > 50 ? '#3b82f6' : '#ef4444',
                color:            pct === 100 ? '#22c55e' : pct > 50 ? '#2563eb' : '#dc2626',
                fontFamily:       'var(--font-oswald)',
              }}
            >
              {pct}%
            </div>
            <span className="text-[10px] text-slate-400" style={{ fontFamily: 'var(--font-montserrat)' }}>
              {done}/{total} completadas
            </span>
          </div>
        </div>

        {/* Notes */}
        {equipo.notas && (
          <div
            className="flex items-start gap-2 mt-4 p-3 rounded-lg text-xs"
            style={{ backgroundColor: 'rgba(74,195,178,0.07)', border: '1px solid rgba(74,195,178,0.2)' }}
          >
            <Info className="w-3.5 h-3.5 text-[#4AC3B2] flex-shrink-0 mt-0.5" />
            <span className="text-slate-600" style={{ fontFamily: 'var(--font-montserrat)' }}>
              {equipo.notas}
            </span>
          </div>
        )}
      </div>

      {/* ── Maintenance timeline ── */}
      <div className="mb-2">
        <p
          className="text-[10px] font-semibold tracking-widest uppercase mb-3 px-1"
          style={{ color: 'rgba(74,195,178,0.8)', fontFamily: 'var(--font-montserrat)' }}
        >
          Programa de mantenimiento 2026
        </p>
      </div>

      {mesesOrdenados.length === 0 ? (
        <div className="cetox-card py-12 text-center">
          <Wrench className="w-8 h-8 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm" style={{ fontFamily: 'var(--font-montserrat)' }}>
            No hay tareas programadas para 2026
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {mesesOrdenados.map(([key, tareas]) => {
            const [anio, mesStr] = key.split('-')
            const mes            = parseInt(mesStr, 10)
            const mesNombre      = MESES_NOMBRES[mes] ?? mesLabel(mes)
            const allDone        = tareas.every(t => t.completado)

            // Is this month in the past?
            const hoy  = new Date()
            const past = (parseInt(anio) * 12 + mes) < (hoy.getFullYear() * 12 + hoy.getMonth() + 1)

            return (
              <div
                key={key}
                className="cetox-card overflow-hidden"
                style={{ opacity: allDone ? 0.75 : 1 }}
              >
                {/* Month header */}
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold"
                      style={{
                        backgroundColor: allDone ? '#f0fdf4' : past ? '#fef2f2' : '#eff6ff',
                        color:           allDone ? '#16a34a' : past ? '#dc2626' : '#2563eb',
                        fontFamily:      'var(--font-oswald)',
                      }}
                    >
                      {mes}
                    </div>
                    <span
                      className="text-sm font-semibold text-slate-800"
                      style={{ fontFamily: 'var(--font-montserrat)' }}
                    >
                      {mesNombre} {anio}
                    </span>
                  </div>
                  {allDone && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                  {!allDone && past && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                    >
                      VENCIDO
                    </span>
                  )}
                </div>

                {/* Tasks */}
                {tareas.map(tarea => {
                  const tcfg = TIPO_CONFIG[tarea.tipo] ?? { label: tarea.tipo, color: '#64748b', bg: '#f8fafc' }
                  return (
                    <TareaActions key={tarea.id} tarea={tarea} tipoCfg={tcfg} />
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Type legend ── */}
      <div className="mt-5 flex flex-wrap gap-4 px-1">
        {Object.entries(TIPO_CONFIG).map(([tipo, cfg]) => (
          <div key={tipo} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
            <span className="text-[10px] text-slate-400" style={{ fontFamily: 'var(--font-montserrat)' }}>
              {cfg.label}
            </span>
          </div>
        ))}
      </div>

    </div>
  )
}
