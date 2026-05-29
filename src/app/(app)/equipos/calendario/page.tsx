import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { calcularEstado } from '@/lib/equipos-utils'
import Link from 'next/link'
import { Calendar, ChevronLeft, ChevronRight, Wrench } from 'lucide-react'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const TIPO_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  PREVENTIVO:   { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  CALIBRACION:  { bg: '#f3e8ff', text: '#7c3aed', border: '#c4b5fd' },
  VERIFICACION: { bg: '#dcfce7', text: '#16a34a', border: '#86efac' },
}

const ESTADO_COLOR: Record<string, string> = {
  VENCIDO:     '#ef4444',
  PROXIMO:     '#f59e0b',
  PROGRAMADO:  '#3b82f6',
  AL_DIA:      '#10b981',
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  await requireRol(['GERENTE_TECNICO', 'DIRECTOR_CALIDAD'])

  const params = await searchParams
  const now    = new Date()
  const year   = parseInt(params.year  ?? String(now.getFullYear()))
  const month  = parseInt(params.month ?? String(now.getMonth() + 1))  // 1-based

  // Prev / Next navigation
  const prevMonth = month === 1  ? { y: year - 1, m: 12 } : { y: year, m: month - 1 }
  const nextMonth = month === 12 ? { y: year + 1, m: 1  } : { y: year, m: month + 1 }

  // Load tasks for the selected month
  const tareas = await prisma.tareaEquipo.findMany({
    where: { mes: month, anio: year },
    include: { equipo: { select: { id: true, codigo: true, nombre: true, area: true } } },
    orderBy: [{ equipo: { codigo: 'asc' } }, { tipo: 'asc' }],
  })

  // Group by area
  const areaMap: Record<string, typeof tareas> = {}
  for (const t of tareas) {
    const area = t.equipo.area ?? 'Sin área'
    if (!areaMap[area]) areaMap[area] = []
    areaMap[area].push(t)
  }

  const totalTareas    = tareas.length
  const completadas    = tareas.filter(t => t.completado).length
  const vencidas       = tareas.filter(t => calcularEstado(t.mes, t.anio, t.completado) === 'VENCIDO').length
  const proximas       = tareas.filter(t => calcularEstado(t.mes, t.anio, t.completado) === 'PROXIMO').length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5" style={{ color: '#4AC3B2' }} />
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wide" style={{ color: '#13602C', fontFamily: 'var(--font-oswald)' }}>
              Calendario de Mantenimiento
            </h1>
            <p className="text-sm" style={{ color: '#808080' }}>
              Vista mensual del programa de equipos
            </p>
          </div>
        </div>
        <Link
          href="/equipos"
          className="text-xs font-semibold px-3 py-2 rounded-lg transition-all"
          style={{ backgroundColor: '#e2e8f0', color: '#475569' }}
        >
          ← Lista de equipos
        </Link>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between mb-6 cetox-card px-5 py-4">
        <Link
          href={`/equipos/calendario?year=${prevMonth.y}&month=${prevMonth.m}`}
          className="flex items-center justify-center w-9 h-9 rounded-lg transition-all hover:bg-slate-100"
          style={{ color: '#475569' }}
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>

        <div className="text-center">
          <h2 className="text-xl font-bold" style={{ color: '#13602C', fontFamily: 'var(--font-oswald)', letterSpacing: '0.05em' }}>
            {MESES[month - 1]} {year}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#808080' }}>
            {totalTareas} tareas programadas
          </p>
        </div>

        <Link
          href={`/equipos/calendario?year=${nextMonth.y}&month=${nextMonth.m}`}
          className="flex items-center justify-center w-9 h-9 rounded-lg transition-all hover:bg-slate-100"
          style={{ color: '#475569' }}
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total tareas',  value: totalTareas, color: '#3b82f6',  bg: '#dbeafe' },
          { label: 'Completadas',   value: completadas,  color: '#10b981',  bg: '#dcfce7' },
          { label: 'Vencidas',      value: vencidas,     color: '#ef4444',  bg: '#fee2e2' },
          { label: 'Próximas',      value: proximas,     color: '#f59e0b',  bg: '#fef3c7' },
        ].map(s => (
          <div key={s.label} className="cetox-card px-4 py-3 flex items-center gap-3">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
              style={{ backgroundColor: s.bg }}
            >
              <Wrench className="h-4 w-4" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#808080' }}>{s.label}</p>
              <p className="text-xl font-bold leading-none" style={{ color: s.color, fontFamily: 'var(--font-oswald)' }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {totalTareas > 0 && (
        <div className="cetox-card px-5 py-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: '#808080' }}>Progreso del mes</span>
            <span className="text-xs font-bold" style={{ color: '#13602C' }}>
              {Math.round((completadas / totalTareas) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width:           `${(completadas / totalTareas) * 100}%`,
                backgroundColor: completadas === totalTareas ? '#10b981' : '#4AC3B2',
              }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{completadas} de {totalTareas} completadas</p>
        </div>
      )}

      {/* Tasks by area */}
      {tareas.length === 0 ? (
        <div className="cetox-card py-16 flex flex-col items-center gap-3">
          <Calendar className="h-12 w-12 text-slate-200" />
          <p className="text-slate-400 font-medium">Sin tareas para {MESES[month - 1]} {year}</p>
          <p className="text-slate-300 text-sm">No hay mantenimientos programados este mes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(areaMap).sort(([a], [b]) => a.localeCompare(b)).map(([area, items]) => (
            <div key={area} className="cetox-card overflow-hidden">
              {/* Area header */}
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4AC3B2' }} />
                  <span className="text-sm font-bold" style={{ color: '#13602C', fontFamily: 'var(--font-montserrat)' }}>
                    {area}
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: '#e2e8f0', color: '#64748b' }}
                  >
                    {items.length} tareas
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {items.filter(t => t.completado).length}/{items.length} completadas
                </span>
              </div>

              {/* Tasks */}
              <div className="divide-y divide-slate-50">
                {items.map(t => {
                  const estado   = calcularEstado(t.mes, t.anio, t.completado)
                  const tipoCfg  = TIPO_COLOR[t.tipo] ?? { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' }

                  return (
                    <div key={t.id} className="flex items-center gap-4 px-5 py-3">
                      {/* Completed indicator */}
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0 border-2"
                        style={{
                          backgroundColor: t.completado ? '#10b981' : 'transparent',
                          borderColor:     t.completado ? '#10b981' : '#d1d5db',
                        }}
                      />

                      {/* Equipo */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/equipos/${t.equipo.id}`}
                          className="text-sm font-semibold hover:underline"
                          style={{ color: '#334155' }}
                        >
                          {t.equipo.codigo} · {t.equipo.nombre}
                        </Link>
                      </div>

                      {/* Tipo badge */}
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tipoCfg.bg, color: tipoCfg.text, border: `1px solid ${tipoCfg.border}` }}
                      >
                        {t.tipo}
                      </span>

                      {/* Estado badge */}
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 min-w-[72px] text-center"
                        style={{
                          backgroundColor: `${ESTADO_COLOR[estado]}18`,
                          color:           ESTADO_COLOR[estado],
                        }}
                      >
                        {t.completado ? 'AL DÍA' : estado}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
