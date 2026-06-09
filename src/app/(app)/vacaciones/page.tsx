import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PalmtreeIcon, Clock, CheckCircle2, XCircle, Download } from 'lucide-react'
import { SolicitudVacacionesForm } from './solicitud-form'
import { formatFecha } from '@/lib/format'
import Link from 'next/link'

// ── Roles que NO pueden acceder ───────────────────────────────────────────────
const ROLES_EXCLUIDOS = ['GERENTE_GENERAL', 'DIRECTOR_ADMINISTRACION']

// ── Labels ────────────────────────────────────────────────────────────────────
const AREA_LABELS: Record<string, string> = {
  Q:  'Química',
  B:  'Biología',
  M:  'Microbiología',
  AD: 'Administración',
  CAL:'Calidad',
}

const ROL_CARGO: Record<string, string> = {
  ADMINISTRACION:      'Administrativo',
  ANALISTA:            'Analista de Laboratorio',
  GERENTE_TECNICO:     'Gerente Técnico',
  DIRECTOR_CALIDAD:    'Director de Calidad',
  COORDINADOR_CALIDAD: 'Coordinador de Calidad',
  JEFE_OPERACIONES:    'Jefe de Operaciones',
  ASISTENTE_LOGISTICA: 'Asistente de Logística',
  SUPER_ADMIN:         'Administrador del Sistema',
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PENDIENTE:  { label: 'Pendiente',  color: '#92400e', bg: '#fef3c7', icon: Clock },
  AUTORIZADA: { label: 'Autorizada', color: '#1e40af', bg: '#dbeafe', icon: CheckCircle2 },
  APROBADA:   { label: 'Aprobada',   color: '#065f46', bg: '#d1fae5', icon: CheckCircle2 },
  RECHAZADA:  { label: 'Rechazada',  color: '#7f1d1d', bg: '#fee2e2', icon: XCircle },
}

const TIPO_VAC_LABELS: Record<string, string> = {
  REGLAMENTARIA: 'Reglamentaria',
  ATRASADA:      'Atrasada',
  ADELANTADA:    'Adelantada',
}

export default async function MisVacacionesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (ROLES_EXCLUIDOS.includes(session.user.rol)) redirect('/dashboard')

  // Solo los jefes que tienen autoridad para aprobar las vacaciones de este usuario
  // según la matriz UsuarioAprobadorVacaciones.
  const aprobadoresRel = await prisma.usuarioAprobadorVacaciones.findMany({
    where:   { solicitanteId: session.user.id },
    include: { aprobador: { select: { id: true, nombre: true, rol: true } } },
    orderBy: { aprobador: { nombre: 'asc' } },
  })
  const jefes = aprobadoresRel.map(r => r.aprobador)

  // Mis solicitudes previas
  const solicitudes = await prisma.solicitudVacaciones.findMany({
    where:   { usuarioId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const cargoDefault = ROL_CARGO[session.user.rol] ?? session.user.rol
  const deptDefault  = AREA_LABELS[session.user.area ?? ''] ?? 'CETOX LAB'

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
        >
          <PalmtreeIcon className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="cetox-page-title">Solicitud de Vacaciones</h1>
          <p className="cetox-page-subtitle">Completa el formulario · CETOX LAB</p>
        </div>
      </div>

      {/* Formulario */}
      <SolicitudVacacionesForm
        nombre={session.user.name ?? ''}
        cargoDefault={cargoDefault}
        deptDefault={deptDefault}
        jefes={jefes}
      />

      {/* Mis solicitudes anteriores */}
      {solicitudes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#94a3b8' }}>
            Mis solicitudes anteriores
          </h2>
          <div className="space-y-2">
            {solicitudes.map(s => {
              const cfg   = ESTADO_CONFIG[s.estado] ?? ESTADO_CONFIG.PENDIENTE
              const Icon  = cfg.icon
              const dias: string[] = JSON.parse(s.diasSolicitados)
              return (
                <div
                  key={s.id}
                  className="cetox-card px-4 py-3 flex items-center gap-4"
                >
                  <Icon className="h-5 w-5 flex-shrink-0" style={{ color: cfg.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>
                      {dias.length} día{dias.length !== 1 ? 's' : ''} · {TIPO_VAC_LABELS[s.tipoVacaciones]}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                      Solicitado el {formatFecha(s.fechaSolicitud)}
                      {dias.length > 0 && ` · ${dias[0]}${dias.length > 1 ? ` … ${dias[dias.length-1]}` : ''}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: cfg.bg, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                    {s.estado !== 'RECHAZADA' && (
                      <a
                        href={`/api/vacaciones/${s.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        title="Descargar PDF"
                      >
                        <button
                          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                          style={{ color: '#13602C' }}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
