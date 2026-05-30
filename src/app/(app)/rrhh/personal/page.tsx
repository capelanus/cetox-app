import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Users2,
  Plus,
  Pencil,
  Eye,
  BadgeCheck,
  Clock,
  ChevronRight,
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtFecha(d: Date | null) {
  if (!d) return 'Indeterminado'
  return format(d, "dd/MM/yyyy", { locale: es })
}

function estadoContrato(finContrato: Date | null, activo: boolean) {
  if (!activo) return { label: 'Inactivo', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' }
  if (!finContrato) return { label: 'Vigente', color: '#10b981', bg: 'rgba(16,185,129,0.1)' }
  const hoy = new Date()
  if (finContrato < hoy) return { label: 'Vencido', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
  const diasRestantes = Math.ceil((finContrato.getTime() - hoy.getTime()) / 86400000)
  if (diasRestantes <= 60) return { label: `Vence en ${diasRestantes}d`, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' }
  return { label: 'Vigente', color: '#10b981', bg: 'rgba(16,185,129,0.1)' }
}

const CONTRATO_LABELS: Record<string, string> = {
  PERMANENTE: 'Permanente',
  PLAZO_FIJO: 'A plazo fijo / Serv. Específico',
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function PersonalPage() {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_ADMINISTRACION', 'GERENTE_TECNICO'])

  const empleados = await prisma.empleado.findMany({
    orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
    include: { vacacion: true },
  })

  const activos   = empleados.filter(e => e.activo).length
  const inactivos = empleados.filter(e => !e.activo).length

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1F4E79 0%, #2d6fa8 100%)' }}
          >
            <Users2 className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'var(--font-oswald)', letterSpacing: '0.05em' }}>
              GESTIÓN DE PERSONAL
            </h1>
            <p className="text-xs text-slate-400">
              {activos} activo{activos !== 1 ? 's' : ''}{inactivos > 0 ? ` · ${inactivos} inactivo${inactivos !== 1 ? 's' : ''}` : ''}
            </p>
          </div>
        </div>
        <Link
          href="/rrhh/personal/nuevo"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
          style={{
            background: 'linear-gradient(135deg, #1F4E79 0%, #2d6fa8 100%)',
            boxShadow: '0 2px 8px rgba(31,78,121,0.25)',
            fontFamily: 'var(--font-montserrat)',
          }}
        >
          <Plus className="w-4 h-4" />
          Nuevo empleado
        </Link>
      </div>

      {/* Table */}
      <div className="cetox-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                {['DNI', 'Nombre completo', 'Tipo de contrato', 'F. Ingreso planilla', 'Fin de contrato', 'Estado', 'Vacaciones', ''].map(h => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: '#94a3b8', fontFamily: 'var(--font-montserrat)', whiteSpace: 'nowrap' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {empleados.map((emp, i) => {
                const estado = estadoContrato(emp.finContrato, emp.activo)
                const vac    = emp.vacacion
                const totalPorCobrar = vac ? vac.diasAtrasados + vac.diasReglamentarios : 0
                const adelantadasPend = vac?.adelantadasPendientes ?? 0

                return (
                  <tr
                    key={emp.id}
                    style={{
                      borderBottom: i < empleados.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                      opacity: emp.activo ? 1 : 0.55,
                    }}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{emp.dni}</td>

                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800 text-sm whitespace-nowrap" style={{ fontFamily: 'var(--font-montserrat)' }}>
                        {emp.nombre}
                      </p>
                      {emp.cargo && <p className="text-[11px] text-slate-400 mt-0.5">{emp.cargo}</p>}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: emp.tipoContrato === 'PERMANENTE' ? 'rgba(139,92,246,0.1)' : 'rgba(245,158,11,0.1)',
                          color:           emp.tipoContrato === 'PERMANENTE' ? '#8b5cf6' : '#d97706',
                        }}
                      >
                        {CONTRATO_LABELS[emp.tipoContrato] ?? emp.tipoContrato}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {fmtFecha(emp.fechaIngreso)}
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {fmtFecha(emp.finContrato)}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: estado.bg, color: estado.color }}
                      >
                        {estado.label}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {vac ? (
                        <div className="flex items-center gap-3">
                          {totalPorCobrar > 0 && (
                            <div className="text-center">
                              <p className="text-xs font-bold" style={{ color: '#1F4E79' }}>{totalPorCobrar}</p>
                              <p className="text-[9px] text-slate-400 whitespace-nowrap">por cobrar</p>
                            </div>
                          )}
                          {adelantadasPend > 0 && (
                            <div className="text-center">
                              <p className="text-xs font-bold text-amber-500">{adelantadasPend}</p>
                              <p className="text-[9px] text-slate-400 whitespace-nowrap">adelantadas</p>
                            </div>
                          )}
                          {totalPorCobrar === 0 && adelantadasPend === 0 && (
                            <span className="text-[11px] text-slate-300">—</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-300">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/rrhh/personal/${emp.id}`}
                          title="Ver detalle"
                          className="flex items-center justify-center w-7 h-7 rounded-md transition-colors hover:bg-slate-100"
                          style={{ color: '#64748b' }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/rrhh/personal/${emp.id}/editar`}
                          title="Editar"
                          className="flex items-center justify-center w-7 h-7 rounded-md transition-colors hover:bg-slate-100"
                          style={{ color: '#64748b' }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
