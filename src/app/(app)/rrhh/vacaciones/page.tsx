import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { PalmtreeIcon, Pencil } from 'lucide-react'

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function VacacionesPage() {
  await requireRol(['ADMINISTRACION', 'GERENTE_TECNICO'])

  const empleados = await prisma.empleado.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
    include: { vacacion: true },
  })

  // Totales
  const totAtrasados    = empleados.reduce((s, e) => s + (e.vacacion?.diasAtrasados    ?? 0), 0)
  const totReglament    = empleados.reduce((s, e) => s + (e.vacacion?.diasReglamentarios ?? 0), 0)
  const totPorCobrar    = totAtrasados + totReglament
  const totAdTomadas    = empleados.reduce((s, e) => s + (e.vacacion?.adelantadasTomadas ?? 0), 0)
  const totAdPendientes = empleados.reduce((s, e) => s + (e.vacacion?.adelantadasPendientes ?? 0), 0)

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
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
          <p className="text-xs text-slate-400">Control de días · personal activo</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Días atrasados',    value: totAtrasados,    color: '#ef4444', bg: 'rgba(239,68,68,0.08)'   },
          { label: 'Reglamentarios',    value: totReglament,    color: '#1F4E79', bg: 'rgba(31,78,121,0.08)'   },
          { label: 'Total por cobrar',  value: totPorCobrar,    color: '#f59e0b', bg: 'rgba(245,158,11,0.08)'  },
          { label: 'Adelantadas pend.', value: totAdPendientes, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)'  },
        ].map(s => (
          <div key={s.label} className="cetox-card px-4 py-3">
            <p className="text-2xl font-bold" style={{ color: s.color, fontFamily: 'var(--font-oswald)' }}>{s.value}</p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5" style={{ fontFamily: 'var(--font-montserrat)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="cetox-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400" style={{ fontFamily: 'var(--font-montserrat)' }}>
                  Empleado
                </th>
                {/* Vacaciones por cobrar */}
                <th colSpan={3} className="text-center px-4 py-2 text-[10px] font-semibold uppercase tracking-widest border-l" style={{ color: '#1F4E79', borderColor: 'rgba(31,78,121,0.1)', backgroundColor: 'rgba(31,78,121,0.04)', fontFamily: 'var(--font-montserrat)' }}>
                  Vacaciones por cobrar
                </th>
                {/* Adelantadas */}
                <th colSpan={2} className="text-center px-4 py-2 text-[10px] font-semibold uppercase tracking-widest border-l" style={{ color: '#8b5cf6', borderColor: 'rgba(139,92,246,0.1)', backgroundColor: 'rgba(139,92,246,0.04)', fontFamily: 'var(--font-montserrat)' }}>
                  Adelantadas
                </th>
                <th className="px-4 py-3 border-l" style={{ borderColor: 'rgba(0,0,0,0.04)' }} />
              </tr>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid rgba(0,0,0,0.06)' }}>
                <th className="text-left px-4 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400" style={{ fontFamily: 'var(--font-montserrat)' }} />
                {['Atrasadas', 'Reglamentarias', 'Total'].map(h => (
                  <th key={h} className="text-center px-4 pb-2 text-[10px] font-semibold uppercase tracking-widest border-l" style={{ color: '#64748b', borderColor: 'rgba(31,78,121,0.08)', fontFamily: 'var(--font-montserrat)' }}>
                    {h}
                  </th>
                ))}
                {['Tomadas', 'Pendientes'].map(h => (
                  <th key={h} className="text-center px-4 pb-2 text-[10px] font-semibold uppercase tracking-widest border-l" style={{ color: '#64748b', borderColor: 'rgba(139,92,246,0.08)', fontFamily: 'var(--font-montserrat)' }}>
                    {h}
                  </th>
                ))}
                <th className="px-4 pb-2 border-l" style={{ borderColor: 'rgba(0,0,0,0.04)' }} />
              </tr>
            </thead>
            <tbody>
              {empleados.map((emp, i) => {
                const v     = emp.vacacion
                const atr   = v?.diasAtrasados        ?? 0
                const reg   = v?.diasReglamentarios   ?? 0
                const total = atr + reg
                const tom   = v?.adelantadasTomadas   ?? 0
                const pend  = v?.adelantadasPendientes ?? 0

                return (
                  <tr
                    key={emp.id}
                    style={{ borderBottom: i < empleados.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800 text-sm" style={{ fontFamily: 'var(--font-montserrat)' }}>
                        {emp.nombre}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{emp.dni}</p>
                    </td>

                    {/* Por cobrar */}
                    <td className="px-4 py-3 text-center border-l" style={{ borderColor: 'rgba(31,78,121,0.08)' }}>
                      {atr > 0
                        ? <span className="text-sm font-bold" style={{ color: '#ef4444' }}>{atr}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center border-l" style={{ borderColor: 'rgba(31,78,121,0.08)' }}>
                      {reg > 0
                        ? <span className="text-sm font-semibold text-slate-600">{reg}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center border-l" style={{ borderColor: 'rgba(31,78,121,0.08)' }}>
                      {total > 0
                        ? (
                          <span
                            className="text-sm font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#d97706' }}
                          >
                            {total}
                          </span>
                        )
                        : <span className="text-slate-300">—</span>}
                    </td>

                    {/* Adelantadas */}
                    <td className="px-4 py-3 text-center border-l" style={{ borderColor: 'rgba(139,92,246,0.08)' }}>
                      {tom > 0
                        ? <span className="text-sm font-semibold text-slate-600">{tom}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center border-l" style={{ borderColor: 'rgba(139,92,246,0.08)' }}>
                      {pend > 0
                        ? <span className="text-sm font-bold" style={{ color: '#8b5cf6' }}>{pend}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>

                    {/* Editar */}
                    <td className="px-4 py-3 border-l" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
                      <Link
                        href={`/rrhh/vacaciones/${emp.id}`}
                        title="Editar días"
                        className="flex items-center gap-1 text-xs font-medium transition-colors hover:text-slate-700 whitespace-nowrap"
                        style={{ color: '#94a3b8' }}
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </Link>
                    </td>
                  </tr>
                )
              })}

              {/* Totales row */}
              <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                <td className="px-4 py-3">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider" style={{ fontFamily: 'var(--font-montserrat)' }}>
                    TOTALES
                  </p>
                </td>
                <td className="px-4 py-3 text-center border-l font-bold text-sm" style={{ borderColor: 'rgba(31,78,121,0.08)', color: '#ef4444' }}>{totAtrasados || '—'}</td>
                <td className="px-4 py-3 text-center border-l font-bold text-sm text-slate-700" style={{ borderColor: 'rgba(31,78,121,0.08)' }}>{totReglament || '—'}</td>
                <td className="px-4 py-3 text-center border-l" style={{ borderColor: 'rgba(31,78,121,0.08)' }}>
                  <span className="text-sm font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#d97706' }}>
                    {totPorCobrar}
                  </span>
                </td>
                <td className="px-4 py-3 text-center border-l font-bold text-sm text-slate-700" style={{ borderColor: 'rgba(139,92,246,0.08)' }}>{totAdTomadas || '—'}</td>
                <td className="px-4 py-3 text-center border-l font-bold text-sm" style={{ borderColor: 'rgba(139,92,246,0.08)', color: '#8b5cf6' }}>{totAdPendientes || '—'}</td>
                <td className="px-4 py-3 border-l" style={{ borderColor: 'rgba(0,0,0,0.04)' }} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
