import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Users2, Pencil, ChevronLeft,
  Calendar, FileText, BadgeCheck,
  PalmtreeIcon, Clock,
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────

const CONTRATO_LABELS: Record<string, string> = {
  PERMANENTE: 'Permanente',
  PLAZO_FIJO: 'A plazo fijo / Modalidad: Servicio Específico',
}

function fmtFecha(d: Date | null) {
  if (!d) return 'Indeterminado'
  return format(d, "d 'de' MMMM yyyy", { locale: es })
}

function calcAnios(fecha: Date): string {
  const now = new Date()
  const diff = now.getFullYear() - fecha.getFullYear()
  const hasCumple = now.getMonth() > fecha.getMonth() ||
    (now.getMonth() === fecha.getMonth() && now.getDate() >= fecha.getDate())
  const anios = hasCumple ? diff : diff - 1
  return `${anios} año${anios !== 1 ? 's' : ''}`
}

function estadoContrato(finContrato: Date | null) {
  if (!finContrato) return { label: 'Indefinido', color: '#10b981', bg: 'rgba(16,185,129,0.1)' }
  const hoy = new Date()
  if (finContrato < hoy) return { label: 'Vencido', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
  const dias = Math.ceil((finContrato.getTime() - hoy.getTime()) / 86400000)
  if (dias <= 60) return { label: `Vence en ${dias} días`, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' }
  return { label: 'Vigente', color: '#10b981', bg: 'rgba(16,185,129,0.1)' }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function EmpleadoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol(['ADMINISTRACION', 'GERENTE_TECNICO'])
  const { id } = await params

  const emp = await prisma.empleado.findUnique({
    where: { id },
    include: { vacacion: true },
  })
  if (!emp) notFound()

  const estadoCont = estadoContrato(emp.finContrato)
  const vac        = emp.vacacion
  const totalPorCobrar = (vac?.diasAtrasados ?? 0) + (vac?.diasReglamentarios ?? 0)

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Breadcrumb */}
      <Link
        href="/rrhh/personal"
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-5 transition-colors"
      >
        <ChevronLeft className="w-3 h-3" />
        Personal
      </Link>

      {/* Header card */}
      <div className="cetox-card p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center w-14 h-14 rounded-2xl text-white text-xl font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #1F4E79 0%, #2d6fa8 100%)', fontFamily: 'var(--font-oswald)' }}
            >
              {emp.nombre.charAt(0)}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'var(--font-montserrat)' }}>
                {emp.nombre}
              </h1>
              {emp.cargo && <p className="text-sm text-slate-500 mt-0.5">{emp.cargo}</p>}
              {emp.area  && <p className="text-xs text-slate-400">{emp.area}</p>}
              <div className="flex items-center gap-2 mt-2">
                <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                  DNI {emp.dni}
                </span>
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: emp.activo ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)', color: emp.activo ? '#10b981' : '#94a3b8' }}
                >
                  {emp.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
          <Link
            href={`/rrhh/personal/${id}/editar`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-slate-50 flex-shrink-0"
            style={{ color: '#64748b', borderColor: '#e2e8f0', fontFamily: 'var(--font-montserrat)' }}
          >
            <Pencil className="w-3 h-3" />
            Editar
          </Link>
        </div>
      </div>

      {/* Contract info */}
      <div className="cetox-card p-5 mb-4">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 mb-3" style={{ fontFamily: 'var(--font-montserrat)' }}>
          Información del contrato
        </p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: FileText,   label: 'Tipo de contrato',     value: CONTRATO_LABELS[emp.tipoContrato] ?? emp.tipoContrato },
            { icon: Calendar,   label: 'Fecha de ingreso',     value: fmtFecha(emp.fechaIngreso) },
            { icon: Clock,      label: 'Antigüedad',           value: calcAnios(emp.fechaIngreso) },
            { icon: BadgeCheck, label: 'Vigencia del contrato', value: (
              <span>
                {fmtFecha(emp.finContrato)}{' '}
                <span
                  className="text-[10px] font-semibold ml-1 px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: estadoCont.bg, color: estadoCont.color }}
                >
                  {estadoCont.label}
                </span>
              </span>
            )},
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-2.5">
              <div
                className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 mt-0.5"
                style={{ backgroundColor: 'rgba(31,78,121,0.08)' }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: '#1F4E79' }} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium">{label}</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>
        {emp.notas && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <p className="text-[10px] text-slate-400 font-medium mb-1">Notas</p>
            <p className="text-xs text-slate-600 leading-relaxed">{emp.notas}</p>
          </div>
        )}
      </div>

      {/* Vacaciones */}
      <div className="cetox-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400" style={{ fontFamily: 'var(--font-montserrat)' }}>
            Vacaciones
          </p>
          <Link
            href={`/rrhh/vacaciones/${id}`}
            className="flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-80"
            style={{ color: '#10b981', fontFamily: 'var(--font-montserrat)' }}
          >
            <Pencil className="w-3 h-3" />
            Editar días
          </Link>
        </div>

        {vac ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Días atrasados',     value: vac.diasAtrasados,        color: '#ef4444', bg: 'rgba(239,68,68,0.08)'   },
              { label: 'Reglamentarios',     value: vac.diasReglamentarios,   color: '#1F4E79', bg: 'rgba(31,78,121,0.08)'   },
              { label: 'Total por cobrar',   value: totalPorCobrar,           color: '#f59e0b', bg: 'rgba(245,158,11,0.08)'  },
              { label: 'Adelantadas pend.',  value: vac.adelantadasPendientes,color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)'  },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: s.bg }}>
                <p className="text-2xl font-bold" style={{ color: s.color, fontFamily: 'var(--font-oswald)' }}>{s.value}</p>
                <p className="text-[10px] font-semibold mt-1" style={{ color: s.color, opacity: 0.8, fontFamily: 'var(--font-montserrat)' }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400">
            <PalmtreeIcon className="w-4 h-4" />
            <p className="text-xs">Sin registro de vacaciones</p>
          </div>
        )}
      </div>

    </div>
  )
}
