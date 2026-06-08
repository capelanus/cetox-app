import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { PalmtreeIcon, Pencil, Clock, Download, Users, MessageCircle } from 'lucide-react'
import { formatFecha } from '@/lib/format'
import { SolicitudActions } from './solicitud-actions'

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDIENTE:  { label: 'Pendiente',  color: '#92400e', bg: '#fef3c7' },
  APROBADA:   { label: 'Aprobada',   color: '#065f46', bg: '#d1fae5' },
  COMUNICADA: { label: 'Comunicada', color: '#1e40af', bg: '#dbeafe' },
  RECHAZADA:  { label: 'Rechazada',  color: '#7f1d1d', bg: '#fee2e2' },
  AUTORIZADA: { label: 'Autorizada', color: '#1e40af', bg: '#dbeafe' }, // legacy
}

const TIPO_VAC_LABELS: Record<string, string> = {
  REGLAMENTARIA: 'Reglamentaria',
  ATRASADA:      'Atrasada',
  ADELANTADA:    'Adelantada',
}

const EMAIL_COMUNICACIONES = 'y.valeriano@cetox.com.pe'
const ROLES_HR = ['ADMINISTRACION', 'DIRECTOR_ADMINISTRACION', 'SUPER_ADMIN']

export default async function VacacionesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const myId      = session.user.id
  const myEmail   = session.user.email ?? ''
  const myRol     = session.user.rol
  const isHR      = ROLES_HR.includes(myRol)
  const isYahaida = myEmail === EMAIL_COMUNICACIONES

  // ¿Soy aprobador de alguien?
  const misSolicitantes = await prisma.usuarioAprobadorVacaciones.findMany({
    where: { aprobadorId: myId },
    select: { solicitanteId: true },
  })
  const misSolicitantesIds = misSolicitantes.map(m => m.solicitanteId)
  const soyAprobador = misSolicitantesIds.length > 0

  // Gate de acceso: HR, Yahaida, aprobadores, o GERENTE_TECNICO/DIRECTOR_CALIDAD (rol)
  const tieneAcceso = isHR || isYahaida || soyAprobador || ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD'].includes(myRol)
  if (!tieneAcceso) redirect('/vacaciones')

  // ── Cargar datos ─────────────────────────────────────────────────────────
  const [empleados, miColaAprobacion, pendientesComunicar, historial] = await Promise.all([
    isHR
      ? prisma.empleado.findMany({
          where: { activo: true },
          orderBy: { nombre: 'asc' },
          include: { vacacion: true },
        })
      : Promise.resolve([]),

    soyAprobador
      ? prisma.solicitudVacaciones.findMany({
          where: { estado: 'PENDIENTE', usuarioId: { in: misSolicitantesIds } },
          orderBy: { createdAt: 'desc' },
          include: { usuario: { select: { nombre: true, rol: true } } },
        })
      : Promise.resolve([]),

    (isYahaida || isHR)
      ? prisma.solicitudVacaciones.findMany({
          where: { estado: 'APROBADA' },
          orderBy: { fechaAprobacion: 'desc' },
          include: {
            usuario:    { select: { nombre: true } },
            aprobadoPor:{ select: { nombre: true } },
          },
        })
      : Promise.resolve([]),

    prisma.solicitudVacaciones.findMany({
      where: {
        estado: { in: ['COMUNICADA', 'RECHAZADA'] },
        ...(soyAprobador && !isHR
          ? { usuarioId: { in: misSolicitantesIds } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { usuario: { select: { nombre: true } } },
    }),
  ])

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
          <p className="text-xs text-slate-400">
            {isHR
              ? 'Control de días y solicitudes · personal activo'
              : isYahaida
                ? 'Cola de comunicaciones'
                : 'Solicitudes a tu cargo'}
          </p>
        </div>
      </div>

      {/* Summary cards (solo HR) */}
      {isHR && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Días atrasados',    value: totAtrasados,            color: '#ef4444' },
            { label: 'Reglamentarios',    value: totReglament,            color: '#13602C' },
            { label: 'Total por cobrar',  value: totPorCobrar,            color: '#f59e0b' },
            { label: 'En mi cola',        value: miColaAprobacion.length, color: '#8b5cf6' },
          ].map(s => (
            <div key={s.label} className="cetox-card px-4 py-3">
              <p className="text-2xl font-bold" style={{ color: s.color, fontFamily: 'var(--font-oswald)' }}>{s.value}</p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5" style={{ fontFamily: 'var(--font-montserrat)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Mi cola de aprobación ── */}
      {soyAprobador && (
        <div>
          <h2 className="text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-2" style={{ color: '#8b5cf6' }}>
            <Clock className="h-3.5 w-3.5" />
            Pendientes de mi aprobación ({miColaAprobacion.length})
          </h2>
          {miColaAprobacion.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No hay solicitudes pendientes a tu cargo.</p>
          ) : (
            <div className="space-y-3">
              {miColaAprobacion.map(s => {
                const dias: string[] = JSON.parse(s.diasSolicitados)
                return (
                  <div key={s.id} className="cetox-card p-4">
                    <div className="flex items-start gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm" style={{ color: '#1e293b' }}>{s.usuario.nombre}</p>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>Pendiente</span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{TIPO_VAC_LABELS[s.tipoVacaciones]}</span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                          <strong>{dias.length} día{dias.length !== 1 ? 's' : ''}:</strong> {dias.join(' · ')}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 mt-2 text-xs" style={{ color: '#64748b' }}>
                          <span><strong>Cargo:</strong> {s.cargo}</span>
                          <span><strong>Depto:</strong> {s.departamento}</span>
                          <span><strong>Solicitado:</strong> {formatFecha(s.fechaSolicitud)}</span>
                          {s.personaDelegada && <span><strong>Delega a:</strong> {s.personaDelegada}</span>}
                        </div>
                        {s.observaciones && (<p className="text-xs mt-1 italic" style={{ color: '#94a3b8' }}>{s.observaciones}</p>)}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                        <a href={`/api/vacaciones/${s.id}/pdf`} target="_blank" rel="noreferrer">
                          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80" style={{ backgroundColor: '#EAF4F4', color: '#13602C', border: '1px solid #4AC3B2' }}>
                            <Download className="h-3.5 w-3.5" />PDF
                          </button>
                        </a>
                        <SolicitudActions solicitudId={s.id} mode="aprobar" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Pendientes de comunicar (Yahaida + HR) ── */}
      {(isYahaida || isHR) && pendientesComunicar.length > 0 && (
        <div>
          <h2 className="text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-2" style={{ color: '#1e40af' }}>
            <MessageCircle className="h-3.5 w-3.5" />
            Aprobadas — pendientes de comunicar ({pendientesComunicar.length})
          </h2>
          <div className="space-y-3">
            {pendientesComunicar.map(s => {
              const dias: string[] = JSON.parse(s.diasSolicitados)
              return (
                <div key={s.id} className="cetox-card p-4">
                  <div className="flex items-start gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm" style={{ color: '#1e293b' }}>{s.usuario.nombre}</p>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>Aprobada</span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{TIPO_VAC_LABELS[s.tipoVacaciones]}</span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                        <strong>{dias.length} día{dias.length !== 1 ? 's' : ''}:</strong> {dias.join(' · ')}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                        Aprobada por <strong>{s.aprobadoPor?.nombre ?? '—'}</strong>
                        {s.fechaAprobacion ? ` el ${formatFecha(s.fechaAprobacion)}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a href={`/api/vacaciones/${s.id}/pdf`} target="_blank" rel="noreferrer">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80" style={{ backgroundColor: '#EAF4F4', color: '#13602C', border: '1px solid #4AC3B2' }}>
                          <Download className="h-3.5 w-3.5" />PDF
                        </button>
                      </a>
                      {(isYahaida || ROLES_HR.includes(myRol)) && (
                        <SolicitudActions solicitudId={s.id} mode="comunicar" diasOriginales={dias} />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Balance de días (HR) ── */}
      {isHR && (
        <div>
          <h2 className="text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-2" style={{ color: '#13602C' }}>
            <Users className="h-3.5 w-3.5" />
            Balance de días por empleado
          </h2>
          <div className="cetox-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Empleado</th>
                    <th colSpan={3} className="text-center px-4 py-2 text-[10px] font-semibold uppercase tracking-widest border-l" style={{ color: '#13602C', borderColor: 'rgba(19,96,44,0.1)', backgroundColor: 'rgba(19,96,44,0.04)' }}>Vacaciones por cobrar</th>
                    <th colSpan={2} className="text-center px-4 py-2 text-[10px] font-semibold uppercase tracking-widest border-l" style={{ color: '#8b5cf6', borderColor: 'rgba(139,92,246,0.1)', backgroundColor: 'rgba(139,92,246,0.04)' }}>Adelantadas</th>
                    <th className="px-4 py-3 border-l" style={{ borderColor: 'rgba(0,0,0,0.04)' }} />
                  </tr>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid rgba(0,0,0,0.06)' }}>
                    <th />
                    {['Atrasadas','Reglamentarias','Total'].map(h => (
                      <th key={h} className="text-center px-4 pb-2 text-[10px] font-semibold uppercase tracking-widest border-l" style={{ color: '#64748b', borderColor: 'rgba(19,96,44,0.08)' }}>{h}</th>
                    ))}
                    {['Tomadas','Pendientes'].map(h => (
                      <th key={h} className="text-center px-4 pb-2 text-[10px] font-semibold uppercase tracking-widest border-l" style={{ color: '#64748b', borderColor: 'rgba(139,92,246,0.08)' }}>{h}</th>
                    ))}
                    <th />
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
                        <td className="px-4 py-3 text-center border-l" style={{ borderColor: 'rgba(19,96,44,0.08)' }}>{atr > 0 ? <span className="text-sm font-bold" style={{ color: '#ef4444' }}>{atr}</span> : <span className="text-slate-300">—</span>}</td>
                        <td className="px-4 py-3 text-center border-l" style={{ borderColor: 'rgba(19,96,44,0.08)' }}>{reg > 0 ? <span className="text-sm font-semibold text-slate-600">{reg}</span> : <span className="text-slate-300">—</span>}</td>
                        <td className="px-4 py-3 text-center border-l" style={{ borderColor: 'rgba(19,96,44,0.08)' }}>{total > 0 ? <span className="text-sm font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#d97706' }}>{total}</span> : <span className="text-slate-300">—</span>}</td>
                        <td className="px-4 py-3 text-center border-l" style={{ borderColor: 'rgba(139,92,246,0.08)' }}>{tom > 0 ? <span className="text-sm font-semibold text-slate-600">{tom}</span> : <span className="text-slate-300">—</span>}</td>
                        <td className="px-4 py-3 text-center border-l" style={{ borderColor: 'rgba(139,92,246,0.08)' }}>{pend > 0 ? <span className="text-sm font-bold" style={{ color: '#8b5cf6' }}>{pend}</span> : <span className="text-slate-300">—</span>}</td>
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
      )}

      {/* ── Historial ── */}
      {historial.length > 0 && (
        <div>
          <h2 className="text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-2" style={{ color: '#94a3b8' }}>
            Historial
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
