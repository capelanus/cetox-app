import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { History, User, Clock, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const ACCION_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  CREATE: { label: 'Creado',    color: '#16a34a', bg: '#dcfce7' },
  UPDATE: { label: 'Editado',   color: '#d97706', bg: '#fef3c7' },
  DELETE: { label: 'Eliminado', color: '#dc2626', bg: '#fee2e2' },
}

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<{ entidad?: string; page?: string }>
}) {
  await requireRol(['DIRECTOR_CALIDAD', 'ADMINISTRACION', 'GERENTE_TECNICO'])

  const params  = await searchParams
  const entidad = params.entidad ?? ''
  const page    = Math.max(1, parseInt(params.page ?? '1'))
  const take    = 50

  const where = entidad ? { entidad } : {}

  const [logs, total, entidades] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { usuario: { select: { nombre: true, rol: true } } },
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * take,
      take,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      distinct: ['entidad'],
      select:   { entidad: true },
      orderBy:  { entidad: 'asc' },
    }),
  ])

  const totalPages = Math.ceil(total / take)

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="h-5 w-5" style={{ color: '#4AC3B2' }} />
            <h1 className="text-2xl font-bold tracking-wide uppercase" style={{ color: '#13602C', fontFamily: 'var(--font-oswald)' }}>
              Historial de Cambios
            </h1>
          </div>
          <p className="text-sm" style={{ color: '#808080' }}>
            Registro de todas las acciones realizadas en el sistema · {total} entradas
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4AC3B2' }}>Filtrar:</span>
        <a
          href="/historial"
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{
            backgroundColor: !entidad ? '#13602C' : '#e2e8f0',
            color:           !entidad ? 'white'   : '#475569',
          }}
        >
          Todo
        </a>
        {entidades.map(e => (
          <a
            key={e.entidad}
            href={`/historial?entidad=${e.entidad}`}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              backgroundColor: entidad === e.entidad ? '#13602C' : '#e2e8f0',
              color:           entidad === e.entidad ? 'white'   : '#475569',
            }}
          >
            {e.entidad}
          </a>
        ))}
      </div>

      {/* Log table */}
      <div className="cetox-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: '#94a3b8', width: 90 }}>Acción</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Entidad / ID</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Usuario</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Detalle</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: '#94a3b8', width: 140 }}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <History className="h-10 w-10 text-slate-200" />
                    <p className="text-slate-400 text-sm">No hay registros aún</p>
                    <p className="text-slate-300 text-xs">Los cambios aparecerán aquí automáticamente</p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log, i) => {
                const cfg = ACCION_CONFIG[log.accion] ?? { label: log.accion, color: '#64748b', bg: '#f1f5f9' }
                let detalle: Record<string, unknown> | null = null
                try { detalle = log.detalle ? JSON.parse(log.detalle) : null } catch {}

                return (
                  <tr
                    key={log.id}
                    style={{ borderBottom: i < logs.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                  >
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#94a3b8' }} />
                        <div>
                          <p className="font-semibold text-slate-700 text-xs">{log.entidad}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{log.entidadId.slice(0, 12)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {log.usuario ? (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3" style={{ color: '#94a3b8' }} />
                          <span className="text-slate-600 text-xs">{log.usuario.nombre}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">Sistema</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {detalle ? (
                        <div className="space-y-0.5">
                          {Object.entries(detalle).slice(0, 3).map(([campo, val]) => {
                            const v = val as { antes?: unknown; despues?: unknown }
                            return (
                              <div key={campo} className="text-[10px] text-slate-500">
                                <span className="font-semibold text-slate-600">{campo}:</span>{' '}
                                {v?.antes != null && (
                                  <span className="line-through text-red-400">{String(v.antes).slice(0, 20)}</span>
                                )}
                                {v?.antes != null && v?.despues != null && ' → '}
                                {v?.despues != null && (
                                  <span className="text-green-600">{String(v.despues).slice(0, 20)}</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 flex-shrink-0" style={{ color: '#94a3b8' }} />
                        <span className="text-xs text-slate-500">
                          {format(log.createdAt, "d MMM yy HH:mm", { locale: es })}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-slate-500">
            Página {page} de {totalPages} · {total} registros
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <a
                href={`/historial?${entidad ? `entidad=${entidad}&` : ''}page=${page - 1}`}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ backgroundColor: '#e2e8f0', color: '#475569' }}
              >
                ← Anterior
              </a>
            )}
            {page < totalPages && (
              <a
                href={`/historial?${entidad ? `entidad=${entidad}&` : ''}page=${page + 1}`}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ backgroundColor: '#13602C', color: 'white' }}
              >
                Siguiente →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
