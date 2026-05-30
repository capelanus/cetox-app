import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { BarChart2, Award, TrendingUp, Users, FileText, FlaskConical } from 'lucide-react'
import { UserAvatar } from '@/components/ui/user-avatar'

function bar(value: number, max: number, color: string) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

export default async function KpisPage() {
  await requireRol(['DIRECTOR_CALIDAD', 'GERENTE_TECNICO'])

  const inicio30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const inicio90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

  const [usuarios, cotizacionesPorUsuario, setsPorUsuario, informesPorUsuario] = await Promise.all([
    prisma.usuario.findMany({
      where:   { activo: true },
      select:  { id: true, nombre: true, rol: true, area: true },
      orderBy: { nombre: 'asc' },
    }),
    // Cotizaciones creadas por usuario (últimos 90 días)
    prisma.cotizacion.groupBy({
      by:      ['creadoPorId'],
      where:   { deletedAt: null, fechaEmision: { gte: inicio90d } },
      _count:  { id: true },
    }),
    // SETs creados por usuario (últimos 90 días)
    prisma.sET.groupBy({
      by:      ['creadoPorId'],
      where:   { fechaIngreso: { gte: inicio90d } },
      _count:  { id: true },
    }),
    // Informes asignados por analista (últimos 90 días)
    prisma.informe.groupBy({
      by:      ['analistaId'],
      where:   { createdAt: { gte: inicio90d } },
      _count:  { id: true },
    }),
  ])

  // Build user stats map
  const cotMap     = Object.fromEntries(cotizacionesPorUsuario.map(r => [r.creadoPorId, r._count.id]))
  const setMap     = Object.fromEntries(setsPorUsuario.map(r => [r.creadoPorId, r._count.id]))
  const informeMap = Object.fromEntries(informesPorUsuario.map(r => [r.analistaId, r._count.id]))

  const stats = usuarios.map(u => ({
    ...u,
    cotizaciones: cotMap[u.id]     ?? 0,
    sets:         setMap[u.id]     ?? 0,
    informes:     informeMap[u.id] ?? 0,
    total:        (cotMap[u.id] ?? 0) + (setMap[u.id] ?? 0) + (informeMap[u.id] ?? 0),
  })).sort((a, b) => b.total - a.total)

  const maxCot     = Math.max(...stats.map(s => s.cotizaciones), 1)
  const maxSets    = Math.max(...stats.map(s => s.sets), 1)
  const maxInform  = Math.max(...stats.map(s => s.informes), 1)
  const maxTotal   = Math.max(...stats.map(s => s.total), 1)

  const ROL_LABEL: Record<string, string> = {
    DIRECTOR_CALIDAD:    'Dir. Calidad',
    ADMINISTRACION:      'Administración',
    GERENTE_TECNICO:     'Gte. Técnico',
    ANALISTA:            'Analista',
    JEFE_OPERACIONES:    'Jefe Ops.',
    ASISTENTE_LOGISTICA: 'Asist. Log.',
    SUPER_ADMIN:         'Admin',
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="h-5 w-5" style={{ color: '#4AC3B2' }} />
            <h1 className="text-2xl font-bold uppercase tracking-wide" style={{ color: '#13602C', fontFamily: 'var(--font-oswald)' }}>
              KPIs por Usuario
            </h1>
          </div>
          <p className="text-sm" style={{ color: '#808080' }}>
            Actividad de los últimos 90 días · {usuarios.length} usuarios activos
          </p>
        </div>
      </div>

      {/* Top 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {stats.slice(0, 3).map((u, i) => (
          <div
            key={u.id}
            className="cetox-card p-5 flex items-center gap-4"
            style={i === 0 ? { borderColor: '#4AC3B2', borderWidth: 2 } : {}}
          >
            <div className="relative">
              <UserAvatar nombre={u.nombre} size="lg" />
              {i === 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: '#f59e0b', color: 'white' }}
                >
                  <Award className="h-3 w-3" />
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-700 truncate">{u.nombre}</p>
              <p className="text-xs text-slate-400">{ROL_LABEL[u.rol] ?? u.rol}</p>
              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className="text-slate-500">Total: <strong className="text-slate-700">{u.total}</strong></span>
              </div>
              {bar(u.total, maxTotal, '#4AC3B2')}
            </div>
            <div
              className="text-3xl font-bold flex-shrink-0"
              style={{ color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : '#cd7f32', fontFamily: 'var(--font-oswald)' }}
            >
              #{i + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Full table */}
      <div className="cetox-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Usuario</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Rol</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: '#94a3b8', width: 100 }}>
                <span className="flex items-center justify-end gap-1"><FileText className="h-3 w-3" /> Cotiz.</span>
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: '#94a3b8', width: 100 }}>
                <span className="flex items-center justify-end gap-1"><FlaskConical className="h-3 w-3" /> SETs</span>
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: '#94a3b8', width: 110 }}>
                <span className="flex items-center justify-end gap-1"><Users className="h-3 w-3" /> Informes</span>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: '#94a3b8', width: 160 }}>
                <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Actividad</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {stats.map((u, i) => (
              <tr
                key={u.id}
                style={{ borderBottom: i < stats.length - 1 ? '1px solid #f1f5f9' : 'none' }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar nombre={u.nombre} size="sm" />
                    <div>
                      <p className="font-semibold text-slate-700">{u.nombre}</p>
                      {u.area && <p className="text-[10px] text-slate-400">{u.area}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-slate-500">{ROL_LABEL[u.rol] ?? u.rol}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-bold tabular-nums" style={{ color: u.cotizaciones > 0 ? '#13602C' : '#d1d5db' }}>
                    {u.cotizaciones}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-bold tabular-nums" style={{ color: u.sets > 0 ? '#7c3aed' : '#d1d5db' }}>
                    {u.sets}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-bold tabular-nums" style={{ color: u.informes > 0 ? '#4AC3B2' : '#d1d5db' }}>
                    {u.informes}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width:           `${maxTotal > 0 ? (u.total / maxTotal) * 100 : 0}%`,
                          backgroundColor: u.total > 0 ? '#4AC3B2' : '#e2e8f0',
                          transition:      'width 0.5s ease',
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold tabular-nums w-5 text-right" style={{ color: '#475569' }}>{u.total}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-slate-300 mt-3 text-center">
        Período: últimos 90 días · Solo cuenta actividad registrada en el sistema
      </p>
    </div>
  )
}
