import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { format, startOfDay, endOfDay, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarClock, Clock, LogIn, LogOut, AlertCircle } from 'lucide-react'

const TIPO_LABELS: Record<number, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  0: { label: 'Entrada',       color: '#10b981', bg: 'rgba(16,185,129,0.1)',  icon: LogIn  },
  1: { label: 'Salida',        color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icon: LogOut },
  4: { label: 'Extra entrada', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: LogIn  },
  5: { label: 'Extra salida',  color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: LogOut },
}

export default async function AsistenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>
}) {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_ADMINISTRACION', 'GERENTE_TECNICO'])

  const { dias: diasParam } = await searchParams
  const dias = Math.min(Math.max(parseInt(diasParam ?? '7', 10), 1), 90)

  const desde = startOfDay(subDays(new Date(), dias - 1))
  const hasta = endOfDay(new Date())

  const registros = await prisma.asistencia.findMany({
    where: { timestamp: { gte: desde, lte: hasta } },
    include: { empleado: { select: { nombre: true, cargo: true } } },
    orderBy: { timestamp: 'desc' },
  })

  // Agrupar por fecha
  const porFecha = new Map<string, typeof registros>()
  for (const r of registros) {
    const key = format(r.timestamp, 'yyyy-MM-dd')
    if (!porFecha.has(key)) porFecha.set(key, [])
    porFecha.get(key)!.push(r)
  }

  const sinVincular = registros.filter(r => !r.empleadoId).length

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
          >
            <CalendarClock className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1
              className="text-lg font-bold text-slate-900"
              style={{ fontFamily: 'var(--font-oswald)', letterSpacing: '0.05em' }}
            >
              ASISTENCIA & MARCACIONES
            </h1>
            <p className="text-xs text-slate-400">
              {registros.length} registro{registros.length !== 1 ? 's' : ''} · últimos {dias} día{dias !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Filtro días */}
        <div className="flex gap-2 flex-wrap">
          {[7, 15, 30].map(d => (
            <a
              key={d}
              href={`?dias=${d}`}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={
                dias === d
                  ? { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff' }
                  : { background: 'rgba(0,0,0,0.04)', color: '#64748b' }
              }
            >
              {d}d
            </a>
          ))}
        </div>
      </div>

      {/* Alerta registros sin vincular */}
      {sinVincular > 0 && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#92400e' }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#f59e0b' }} />
          <span>
            <strong>{sinVincular}</strong> marcación{sinVincular !== 1 ? 'es' : ''} no pudo vincularse a un empleado del ERP.
            Verifica que el nombre en el huellero coincida con el nombre en Gestión de Personal.
          </span>
        </div>
      )}

      {/* Sin registros */}
      {registros.length === 0 && (
        <div className="cetox-card p-12 text-center">
          <Clock className="w-10 h-10 mx-auto mb-3" style={{ color: '#cbd5e1' }} />
          <p className="text-slate-500 text-sm font-medium">No hay marcaciones en los últimos {dias} días.</p>
          <p className="text-slate-400 text-xs mt-1">Ejecuta el script de sincronización para importar datos del huellero.</p>
        </div>
      )}

      {/* Tabla por fecha */}
      {Array.from(porFecha.entries()).map(([fechaKey, items]) => {
        const fecha = new Date(fechaKey + 'T12:00:00')
        return (
          <div key={fechaKey} className="mb-6">
            <p
              className="text-[10px] font-semibold tracking-widest uppercase mb-2 px-1"
              style={{ color: 'rgba(74,195,178,0.8)', fontFamily: 'var(--font-montserrat)' }}
            >
              {format(fecha, "EEEE d 'de' MMMM", { locale: es })}
            </p>
            <div className="cetox-card overflow-hidden">
              {items.map((r, i) => {
                const t = TIPO_LABELS[r.tipo] ?? TIPO_LABELS[0]
                const Icon = t.icon
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: i < items.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}
                  >
                    {/* Tipo badge */}
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: t.bg }}
                    >
                      <Icon className="w-4 h-4" style={{ color: t.color }} />
                    </div>

                    {/* Nombre */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold text-slate-800 truncate"
                        style={{ fontFamily: 'var(--font-montserrat)' }}
                      >
                        {r.empleado?.nombre ?? r.zkNombre}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {r.empleado?.cargo ?? (
                          <span style={{ color: '#f59e0b' }}>Sin vincular · ID huellero: {r.zkUserId}</span>
                        )}
                      </p>
                    </div>

                    {/* Tipo label */}
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: t.bg, color: t.color }}
                    >
                      {t.label}
                    </span>

                    {/* Hora */}
                    <span
                      className="text-sm font-mono font-semibold flex-shrink-0"
                      style={{ color: '#334155', minWidth: '3rem', textAlign: 'right' }}
                    >
                      {format(r.timestamp, 'HH:mm')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
