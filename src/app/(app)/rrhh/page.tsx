import { requireRol } from '@/lib/roles'
import Link from 'next/link'
import {
  Users2,
  CalendarClock,
  ClipboardList,
  PalmtreeIcon,
  Wallet2,
  Building2,
  Wrench,
  ChevronRight,
} from 'lucide-react'

// ── Module card ───────────────────────────────────────────────────────────────

interface ModuloCardProps {
  icon:        React.ElementType
  titulo:      string
  descripcion: string
  color:       string
  bg:          string
  href?:       string   // if set → card is a clickable link
}

function ModuloCard({ icon: Icon, titulo, descripcion, color, bg, href }: ModuloCardProps) {
  const disponible = !!href

  const inner = (
    <>
      {/* Badge */}
      {!disponible && (
        <div
          className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide pointer-events-none"
          style={{ backgroundColor: 'rgba(100,116,139,0.1)', color: '#94a3b8' }}
        >
          <Wrench className="w-2.5 h-2.5" />
          En desarrollo
        </div>
      )}

      {/* Icon */}
      <div
        className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
        style={{ backgroundColor: bg }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>

      {/* Text */}
      <div className="flex-1">
        <h3
          className="text-sm font-semibold text-slate-800 mb-1"
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          {titulo}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">{descripcion}</p>
      </div>

      {/* Arrow (only available) */}
      {disponible && (
        <ChevronRight
          className="w-4 h-4 flex-shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
          style={{ color: '#cbd5e1' }}
        />
      )}
    </>
  )

  if (disponible) {
    return (
      <Link
        href={href}
        className="cetox-card p-5 flex flex-col gap-3 relative overflow-hidden group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        style={{ cursor: 'pointer' }}
      >
        {inner}
      </Link>
    )
  }

  return (
    <div
      className="cetox-card p-5 flex flex-col gap-3 relative overflow-hidden"
      style={{ opacity: 0.72 }}
    >
      {inner}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function RRHHPage() {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_ADMINISTRACION', 'GERENTE_TECNICO'])

  const modulos: ModuloCardProps[] = [
    {
      icon:        Users2,
      titulo:      'Gestión de Personal',
      descripcion: 'Registro de empleados, datos personales, cargo, área, DNI, fecha de ingreso y estado laboral.',
      color:       '#1F4E79',
      bg:          'rgba(31,78,121,0.1)',
      href:        '/rrhh/personal',
    },
    {
      icon:        Wallet2,
      titulo:      'Planilla & Nómina',
      descripcion: 'Sueldos mensuales, descuentos de ley, gratificaciones, CTS y liquidaciones del personal.',
      color:       '#10b981',
      bg:          'rgba(16,185,129,0.1)',
    },
    {
      icon:        CalendarClock,
      titulo:      'Asistencia & Marcaciones',
      descripcion: 'Control de horario, registro de tardanzas, horas extras, faltas y justificaciones.',
      color:       '#f59e0b',
      bg:          'rgba(245,158,11,0.1)',
    },
    {
      icon:        PalmtreeIcon,
      titulo:      'Vacaciones & Permisos',
      descripcion: 'Solicitudes de vacaciones, días disponibles, historial de permisos y aprobaciones.',
      color:       '#8b5cf6',
      bg:          'rgba(139,92,246,0.1)',
      href:        '/rrhh/vacaciones',
    },
    {
      icon:        ClipboardList,
      titulo:      'Contratos & Documentos',
      descripcion: 'Gestión de contratos laborales, renovaciones, legajos digitales y documentos firmados.',
      color:       '#ef4444',
      bg:          'rgba(239,68,68,0.1)',
      href:        '/rrhh/contratos',
    },
    {
      icon:        Building2,
      titulo:      'Estructura Organizacional',
      descripcion: 'Áreas, cargos, jerarquía, organigrama y asignación de responsabilidades.',
      color:       '#4AC3B2',
      bg:          'rgba(74,195,178,0.1)',
      href:        '/rrhh/estructura',
    },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #1F4E79 0%, #2d6fa8 100%)' }}
          >
            <Users2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1
              className="text-xl font-bold text-slate-900 leading-none"
              style={{ fontFamily: 'var(--font-oswald)', letterSpacing: '0.06em' }}
            >
              RECURSOS HUMANOS
            </h1>
            <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: 'var(--font-montserrat)' }}>
              Gestión integral del capital humano · CETOX S.A.C.
            </p>
          </div>
        </div>
      </div>

      {/* ── Módulos grid ── */}
      <div>
        <p
          className="text-[10px] font-semibold tracking-widest uppercase mb-3 px-1"
          style={{ color: 'rgba(74,195,178,0.8)', fontFamily: 'var(--font-montserrat)' }}
        >
          Módulos del sistema
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modulos.map((mod) => (
            <ModuloCard key={mod.titulo} {...mod} />
          ))}
        </div>
      </div>

      {/* ── Equipo RRHH ── */}
      <div className="mt-10">
        <p
          className="text-[10px] font-semibold tracking-widest uppercase mb-3 px-1"
          style={{ color: 'rgba(74,195,178,0.8)', fontFamily: 'var(--font-montserrat)' }}
        >
          Equipo RRHH
        </p>
        <div className="cetox-card overflow-hidden">
          {[
            { nombre: 'Angie Daniela Cadillo Ramírez',          email: 'a.cadillo@cetox.com.pe'   },
            { nombre: 'Yahaida Milagros Valeriano Machacuay',   email: 'y.valeriano@cetox.com.pe' },
            { nombre: 'Andrea Castillo Blanco',                  email: 'a.castillo@cetox.com.pe',  gerencia: true },
          ].map((p, i, arr) => (
            <div
              key={p.email}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}
            >
              <div
                className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 font-bold text-white text-sm"
                style={{
                  background: 'linear-gradient(135deg, #1F4E79 0%, #2d6fa8 100%)',
                  fontFamily: 'var(--font-oswald)',
                }}
              >
                {p.nombre.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate" style={{ fontFamily: 'var(--font-montserrat)' }}>
                  {p.nombre}
                </p>
                <p className="text-xs text-slate-400 truncate">{p.email}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(31,78,121,0.1)', color: '#1F4E79' }}
                >
                  RRHH
                </span>
                {'gerencia' in p && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(124,58,237,0.1)', color: '#7c3aed' }}
                  >
                    Gerencia
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
