import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { PalmtreeIcon, Pencil, Clock, CheckCircle2, XCircle, Download, Users } from 'lucide-react'
import { formatFecha } from '@/lib/format'
import { SolicitudActions } from './solicitud-actions'

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDIENTE:  { label: 'Pendiente',  color: '#92400e', bg: '#fef3c7' },
  AUTORIZADA: { label: 'Autorizada', color: '#1e40af', bg: '#dbeafe' },
  APROBADA:   { label: 'Aprobada',   color: '#065f46', bg: '#d1fae5' },
  RECHAZADA:  { label: 'Rechazada',  color: '#7f1d1d', bg: '#fee2e2' },
}

const TIPO_VAC_LABELS: Record<string, string> = {
  REGLAMENTARIA: 'Reglamentaria',
  ATRASADA:      'Atrasada',
  ADELANTADA:    'Adelantada',
}

export default async function VacacionesPage() {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_ADMINISTRACION', 'GERENTE_TECNICO'])

  const [empleados, solicitudes] = await Promise.all([
    prisma.empleado.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      include: { vacacion: true },
    }),
    prisma.solicitudVacaciones.findMany({
      orderBy: { createdAt: 'desc' },
      include: { usuario: { select: { nombre: true, rol: true } } },
      take: 50,
    }),
  ])

  const pendientes  = solicitudes.filter(s => s.estado === 'PENDIENTE')
  const historial   = solicitudes.filter(s => s.estado !== 'PENDIENTE')

  // Totales balance
  const totAtrasados    = empleados.reduce((s, e) => s + (e.vacacion?.diasAtrasados    ?? 0), 0)
  const totReglament    = empleados.reduce((s, e) => s + (e.vacacion?.diasReglamentarios ?? 0), 0)
  const totPorCobrar    = totAtrasados + totReglament
  const totAdPendientes = empleados.reduce((s, e) => s + (e.vacacion?.adelantadasPendientes ?? 0), 0)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
        >
          <PalmtreeIcon className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'var(--font-oswald)', letterSpacing: '0.05em' }}>
            VACACIONES Y PERMISOS
          </h1>
          <p className="text-xs text-slate-400">Control de días y solicitudes · personal activo</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Días atrasados',    value: totAtrasados,       color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
          { label: 'Reglamentarios',    value: totReglament,       color: '#13602C', bg: 'rgba(19,96,44,0.08)' },
          { label: 'Total por cobrar',  value: totPorCobrar,       color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
          { label: 'Solicitudes pend.', value: pendientes.length,  color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
        ].map(s => (
          <div key={s.label} className="cetox-card px-4 py-3">
            <p className="text-2xl font-bold" style={{ color: s.color, fontFamily: 'var(--font-oswald)' }}>{s.value}</p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5" style={{ fontFamily: 'var(--font-montserrat)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Solicitudes pendientes ── */}
      {pendientes.length > 0 && (
        <div>
          <h2
            className="text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-2"
            style={{ color: '#8b5cf6' }}
          >
            <Clock className="h-3.5 w-3.5" />
            Solicitudes pendientes ({pendientes.length})
          </h2>
          <div className="space-y-3">
            {pendientes.map(s => {
              const dias: string[] = JSON.parse(s.diasSolicitados)
              return (
                <div key={s.id} className="cetox-card p-4">
                  <div className="flex items-start gap-4 flex-wrap">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm" style={{ color: '#1e293b' }}>
                          {s.usuario.nombre}
                        </p>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
                        >
                          Pendiente
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          {TIPO_VAC_LABELS[s.tipoVacaciones]}
                        </span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                        <strong>{dias.length} día{dias.length !== 1 ? 's' : ''}:</strong>{' '}
                        {dias.join(' · ')}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 mt-2 text-xs" style={{ color: '#64748b' }}>
                        <span><strong>Cargo:</strong> {s.cargo}</span>
                        <span><strong>Depto:</strong> {s.departamento}</span>
                        <span><strong>Jefe:</strong> {s.jefeInmediato}</span>
                        {s.personaDelegada && <span><strong>Delega a:</strong> {s.personaDelegada}</span>}
                        <span><strong>Solicitado:</strong> {formatFecha(s.fechaSolicitud)}</span>
                      </div>
                      {s.observaciones && (
                        <p className="text-xs mt-1 italic" style={{ color: '#94a3b8' }}>{s.observaciones}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      <a href={`/api/vacaciones/${s.id}/pdf`} target="_blank" rel="noreferrer">
                        <button
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                          style={{ backgroundColor: '#EAF4F4', color: '#13602C', border: '1px solid #4AC3B2' }}
                        >
                          <Download className="h-3.5 w-3.5" />
                          PDF
                        </button>
                      </a>
                      <SolicitudActions solicitudId={s.id} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Balance de días ── */}
      <div>
        <h2
          className="text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-2"
          style={{ color: '#13602C' }}
        >
          <Users className="h-3.5 w-3.5" />
          Balance de días por empleado
        </h2>
        <div className="cetox-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Empleado</th>
                  <th colSpan={3} className="text-center px-4 py-2 text-[10px] font-semibold uppercase tracking-widest border-l" style={{ color: '#13602C', borderColor: 'rgba(19,96,44,0.1)', backgroundColor: 'rgba(19,96,44,0.04)' }}>
                    Vacaciones por cobrar
                  </th>
                  <th colSpan={2} className="text-center px-4 py-2 text-[10px] font-semibold uppercase tracking-widest border-l" style={{ color: '#8b5cf6', borderColor: 'rgba(139,92,246,0.1)', backgroundColor: 'rgba(139,92,246,0.04)' }}>
                    Adelantadas
                  </th>
                  <th className="px-4 py-3 border-l" style={{ borderColor: 'rgba(0,0,0,0.04)' }} />
                </tr>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid rgba(0,0,0,0.06)' }}>
                  <th className="text-left px-4 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400" />
                  {['Atrasadas','Reglamentarias','Total'].map(h => (
                    <th key={h} className="text-center px-4 pb-2 text-[10px] font-semibold uppercase tracking-widest border-l" style={{ color: '#64748b', borderColor: 'rgba(19,96,44,0.08)' }}>{h}</th>
                  ))}
                  {['Tomadas','Pendientes'].map(h => (
                    <th key={h} className="text-center px-4 pb-2 text-[10px] font-semibold uppercase tracking-widest border-l" style={{ color: '#64748b', borderColor: 'rgba(139,92,246,0.08)' }}>{h}</th>
                  ))}
                  <th className="px-4 pb-2 border-l" style={{ borderColor: 'rgba(0,0,0,0.04)' }} />
                </tr>
              </thead>
              <tbody>
                {empleados.map((emp, i) => {
                  const v = emp.vacacion
                  const atr   = v?.diasAtrasados        ?? 0
                  const reg   = v?.diasReglamentarios   ?? 0
                  const total = atr + reg
                  const tom   = v?.adelantadasTomadas   ?? 0
                  const pend  = v?.adelantadasPendientes ?? 0
                  return (
                    <tr key={emp.id} style={{ borderBottom: i < empleados.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800 text-sm">{emp.nombre}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{emp.dni}</p>
                      </td>
                      <td className="px-4 py-3 text-center border-l" style={{ borderColor: 'rgba(19,96,44,0.08)' }}>
                        {atr > 0 ? <span className="text-sm font-bold" style={{ color: '#ef4444' }}>{atr}</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center border-l" style={{ borderColor: 'rgba(19,96,44,0.08)' }}>
                        {reg > 0 ? <span className="text-sm font-semibold text-slate-600">{reg}</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center border-l" style={{ borderColor: 'rgba(19,96,44,0.08)' }}>
                        {total > 0 ? <span className="text-sm font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#d97706' }}>{total}</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center border-l" style={{ borderColor: 'rgba(139,92,246,0.08)' }}>
                        {tom > 0 ? <span className="text-sm font-semibold text-slate-600">{tom}</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center border-l" style={{ borderColor: 'rgba(139,92,246,0.08)' }}>
                        {pend > 0 ? <span className="text-sm font-bold" style={{ color: '#8b5cf6' }}>{pend}</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 border-l" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
                        <Link href={`/rrhh/vacaciones/${emp.id}`} className="flex items-center gap-1 text-xs font-medium transition-colors hover:text-slate-700 whitespace-nowrap" style={{ color: '#94a3b8' }}>
                          <Pencil className="w-3 h-3" />Editar
                        </Link>
                      </td>
                    </tr>
                  )
                })}
                <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                  <td className="px-4 py-3"><p className="text-xs font-bold text-slate-600 uppercase tracking-wider">TOTALES</p></td>
                  <td className="px-4 py-3 text-center border-l font-bold text-sm" style={{ borderColor: 'rgba(19,96,44,0.08)', color: '#ef4444' }}>{totAtrasados || '—'}</td>
                  <td className="px-4 py-3 text-center border-l font-bold text-sm text-slate-700" style={{ borderColor: 'rgba(19,96,44,0.08)' }}>{totReglament || '—'}</td>
                  <td className="px-4 py-3 text-center border-l" style={{ borderColor: 'rgba(19,96,44,0.08)' }}>
                    <span className="text-sm font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#d97706' }}>{totPorCobrar}</span>
                  </td>
                  <td className="px-4 py-3 text-center border-l font-bold text-sm text-slate-700" style={{ borderColor: 'rgba(139,92,246,0.08)' }}>—</td>
                  <td className="px-4 py-3 text-center border-l font-bold text-sm" style={{ borderColor: 'rgba(139,92,246,0.08)', color: '#8b5cf6' }}>{totAdPendientes || '—'}</td>
                  <td className="px-4 py-3 border-l" style={{ borderColor: 'rgba(0,0,0,0.04)' }} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Historial de solicitudes ── */}
      {historial.length > 0 && (
        <div>
          <h2 className="text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-2" style={{ color: '#94a3b8' }}>
            Historial de solicitudes
          </h2>
          <div className="cetox-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Empleado</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Días</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Tipo</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Estado</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Fecha</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {historial.map((s, i) => {
                  const dias: string[] = JSON.parse(s.diasSolicitados)
                  const cfg = ESTADO_CONFIG[s.estado] ?? ESTADO_CONFIG.PENDIENTE
                  return (
                    <tr key={s.id} style={{ borderBottom: i < historial.length-1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 font-medium text-sm">{s.usuario.nombre}</td>
                      <td className="px-4 py-2.5 text-sm">{dias.length} día{dias.length!==1?'s':''}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">{TIPO_VAC_LABELS[s.tipoVacaciones]}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-400">{formatFecha(s.fechaSolicitud)}</td>
                      <td className="px-4 py-2.5">
                        <a href={`/api/vacaciones/${s.id}/pdf`} target="_blank" rel="noreferrer">
                          <button className="p-1.5 rounded hover:bg-slate-100 transition-colors" style={{ color: '#13602C' }}>
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
