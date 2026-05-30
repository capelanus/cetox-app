import { requireRol } from '@/lib/roles'
import Link from 'next/link'
import { Building2, ArrowLeft, User, ChevronDown } from 'lucide-react'

// ── Connector ─────────────────────────────────────────────────────────────────

function Connector() {
  return (
    <div className="flex flex-col items-center py-1">
      <div className="w-px h-5 bg-slate-200" />
      <ChevronDown className="h-3.5 w-3.5 text-slate-300 -mt-0.5" />
    </div>
  )
}

// ── Avatar inicial ─────────────────────────────────────────────────────────────

function Inicial({ nombre, bg, fg }: { nombre: string; bg: string; fg: string }) {
  const partes = nombre.trim().split(' ').filter(Boolean)
  const initials = partes.length >= 2
    ? partes[0][0] + partes[partes.length - 1][0]
    : partes[0].slice(0, 2)
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold flex-shrink-0 text-[11px] uppercase"
      style={{ width: 32, height: 32, backgroundColor: bg, color: fg, fontFamily: 'var(--font-oswald)' }}
    >
      {initials.toUpperCase()}
    </div>
  )
}

// ── Tarjeta de staff (persona sin subordinados) ───────────────────────────────

function StaffCard({ nombre, cargo }: { nombre: string; cargo: string }) {
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
      style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
    >
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{ width: 26, height: 26, backgroundColor: '#e2e8f0' }}
      >
        <User className="h-3 w-3" style={{ color: '#94a3b8' }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-600 truncate">{nombre}</p>
        {cargo && <p className="text-[10px] text-slate-400 truncate">{cargo}</p>}
      </div>
    </div>
  )
}

// ── Tarjeta de jefatura (con lista de staff) ──────────────────────────────────

interface Staff { nombre: string; cargo: string }
interface Jefatura {
  nombre: string
  cargo:  string
  staff:  Staff[]
}

function JefaturaCard({ j }: { j: Jefatura }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1.5px solid #4AC3B2', backgroundColor: '#f0fafa' }}
    >
      {/* Jefe */}
      <div className="flex items-center gap-2.5 px-4 py-3" style={{ backgroundColor: '#e0f5f2' }}>
        <Inicial nombre={j.nombre} bg="#4AC3B2" fg="#0d4a42" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-700 truncate">{j.nombre}</p>
          <p className="text-[10px] font-semibold text-teal-700 truncate">{j.cargo}</p>
        </div>
      </div>
      {/* Staff */}
      {j.staff.length > 0 && (
        <div className="px-3 py-2.5 space-y-1.5">
          {j.staff.map(s => (
            <StaffCard key={s.nombre} nombre={s.nombre} cargo={s.cargo} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tarjeta de dirección (con jefaturas y staff suelto) ───────────────────────

interface Direccion {
  nombre:    string
  cargo:     string
  jefaturas: Jefatura[]
  staffSuelto: Staff[]
}

function DireccionCard({ d }: { d: Direccion }) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex-1 min-w-0"
      style={{ border: '2px solid #2563eb', backgroundColor: '#eff6ff' }}
    >
      {/* Director */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)' }}
      >
        <Inicial nombre={d.nombre} bg="rgba(255,255,255,0.2)" fg="white" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate">{d.nombre}</p>
          <p className="text-[11px] text-blue-200 truncate">{d.cargo}</p>
        </div>
      </div>

      {/* Jefaturas */}
      <div className="p-4 space-y-3">
        {d.jefaturas.map(j => (
          <JefaturaCard key={j.nombre} j={j} />
        ))}

        {/* Staff suelto */}
        {d.staffSuelto.length > 0 && (
          <div className="space-y-1.5">
            {d.staffSuelto.map(s => (
              <StaffCard key={s.nombre} nombre={s.nombre} cargo={s.cargo} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function EstructuraPage() {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_ADMINISTRACION', 'GERENTE_TECNICO'])

  const direcciones: Direccion[] = [
    {
      nombre: 'Andrea Castillo',
      cargo:  'Dirección de Administración y Finanzas',
      jefaturas: [
        {
          nombre: 'Angie Cadillo',
          cargo:  'Jefatura Dpto. Administración',
          staff: [
            { nombre: 'William Ramírez',   cargo: 'Asist. Adm. · Marketing y Cobranzas' },
            { nombre: 'Yahaida Valeriano', cargo: 'Asist. Adm. · Gestión de Cliente y RRHH' },
          ],
        },
        {
          nombre: 'Reddy Campos',
          cargo:  'Jefatura de Operaciones y Logística',
          staff: [
            { nombre: 'Sandro',       cargo: 'Analista Logístico' },
            { nombre: 'Manuel Salas', cargo: 'Operario Mantenimiento y Limpieza' },
            { nombre: 'Elmar Salas',  cargo: 'Operario Mantenimiento y Portería' },
          ],
        },
      ],
      staffSuelto: [
        { nombre: 'Ana Lucía Alban', cargo: 'Analista de Calidad' },
        { nombre: 'Pierina Verano',  cargo: 'Encargada de Microbiología' },
      ],
    },
    {
      nombre: 'Gabriela Risco',
      cargo:  'Dirección de Laboratorio y Calidad',
      jefaturas: [
        {
          nombre: 'Claudia Garrido',
          cargo:  'Jefatura Dpto. Biología',
          staff: [
            { nombre: 'Christian Pitot',      cargo: 'Veterinario – Biotario' },
            { nombre: 'Mª Paula Parez-Reyes', cargo: 'Analista de Biología' },
            { nombre: 'Flavia Espinoza',      cargo: 'Analista de Biología Marina' },
            { nombre: 'Carmen Legay',         cargo: 'Operario de Biotario' },
          ],
        },
        {
          nombre: 'Luis Ortega',
          cargo:  'Sub Dirección de Química',
          staff: [],
        },
        {
          nombre: 'Michael Chávez',
          cargo:  'Jefatura Dpto. Química',
          staff: [
            { nombre: 'Álvaro Aguado', cargo: 'Asistente de Química' },
            { nombre: 'Gloria Ávalos', cargo: 'Técnica de Química' },
          ],
        },
      ],
      staffSuelto: [],
    },
  ]

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <Link
          href="/rrhh"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a RRHH
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#13602C 0%,#1e8a45 100%)' }}
          >
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1
              className="text-xl font-bold text-slate-900 leading-none"
              style={{ fontFamily: 'var(--font-oswald)', letterSpacing: '0.06em' }}
            >
              ESTRUCTURA ORGANIZACIONAL
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Centro Toxicológico S.A.C. – CETOX LAB
            </p>
          </div>
        </div>
      </div>

      {/* ── Nivel 1: Gerente General ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #13602C 0%, #1e8a45 100%)', border: '2px solid #0a3d1a' }}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Inicial nombre="Luis Fernández" bg="rgba(255,255,255,0.2)" fg="white" />
            <div>
              <p className="text-base font-bold text-white" style={{ fontFamily: 'var(--font-oswald)', letterSpacing: '0.04em' }}>
                Luis Fernández Anaya
              </p>
              <p className="text-xs text-green-200">Gerente General</p>
            </div>
          </div>
          {/* Asesores */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {['Asesor Tributario', 'Asesora de Proyectos'].map(a => (
              <div
                key={a}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <User className="h-3 w-3 opacity-70" />
                {a}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Connector />

      {/* ── Nivel 2: DTG ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1F4E79 0%, #2563a8 100%)', border: '2px solid #163a5a' }}
      >
        <div className="flex items-center gap-3 px-6 py-4">
          <Inicial nombre="Rosalita Anaya" bg="rgba(255,255,255,0.2)" fg="white" />
          <div>
            <p className="text-base font-bold text-white" style={{ fontFamily: 'var(--font-oswald)', letterSpacing: '0.04em' }}>
              Rosalita Anaya Pajualo
            </p>
            <p className="text-xs text-blue-200">Dirección Técnica General</p>
          </div>
        </div>
      </div>

      <Connector />

      {/* ── Nivel 3: Dos direcciones en columnas ── */}
      <div className="flex gap-5 items-start">
        {direcciones.map(d => (
          <DireccionCard key={d.nombre} d={d} />
        ))}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-5 flex-wrap mt-6 pt-4" style={{ borderTop: '1px solid #e2e8f0' }}>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Leyenda</span>
        {[
          { color: '#13602C', label: 'Gerencia General' },
          { color: '#1F4E79', label: 'Dir. Técnica General' },
          { color: '#2563eb', label: 'Direcciones' },
          { color: '#4AC3B2', label: 'Jefaturas / Sub Dir.' },
          { color: '#e2e8f0', label: 'Personal', text: '#94a3b8' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: l.color, border: '1px solid rgba(0,0,0,0.1)' }} />
            <span className="text-[10px] text-slate-500">{l.label}</span>
          </div>
        ))}
      </div>

    </div>
  )
}
