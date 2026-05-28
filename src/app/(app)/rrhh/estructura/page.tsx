import { requireRol } from '@/lib/roles'
import Link from 'next/link'
import { Building2, ArrowLeft } from 'lucide-react'

// ── Types & data ──────────────────────────────────────────────────────────────

type Tipo = 'gerente' | 'dtg' | 'direccion' | 'jefatura' | 'staff'

interface Nodo {
  nombre: string
  cargo:  string
  tipo:   Tipo
  hijos?: Nodo[]
}

const RAIZ: Nodo = {
  nombre: 'Luis Fernández Anaya',
  cargo:  'Gerente General',
  tipo:   'gerente',
  hijos: [
    { nombre: 'Asesor Tributario',    cargo: '',                         tipo: 'staff' },
    { nombre: 'Asesora de Proyectos', cargo: '',                         tipo: 'staff' },
    {
      nombre: 'Rosalita Anaya Pajualo',
      cargo:  'Dirección Técnica General',
      tipo:   'dtg',
      hijos: [
        {
          nombre: 'Andrea Castillo',
          cargo:  'Dirección de Administración y Finanzas',
          tipo:   'direccion',
          hijos: [
            {
              nombre: 'Angie Cadillo',
              cargo:  'Jefatura Dpto. Administración',
              tipo:   'jefatura',
              hijos: [
                { nombre: 'William Ramírez',   cargo: 'Asist. Adm. · Marketing y Cobranzas',      tipo: 'staff' },
                { nombre: 'Yahaida Valeriano', cargo: 'Asist. Adm. · Gestión de Cliente y RRHH',  tipo: 'staff' },
              ],
            },
            {
              nombre: 'Reddy Campos',
              cargo:  'Jefatura de Operaciones y Logística',
              tipo:   'jefatura',
              hijos: [
                { nombre: 'Sandro',        cargo: 'Analista Logístico',               tipo: 'staff' },
                { nombre: 'Manuel Salas',  cargo: 'Operario Mantenimiento y Limpieza', tipo: 'staff' },
                { nombre: 'Elmar Salas',   cargo: 'Operario Mantenimiento y Portería', tipo: 'staff' },
              ],
            },
            { nombre: 'Ana Lucía Alban', cargo: 'Analista de Calidad',        tipo: 'staff' },
            { nombre: 'Pierina Verano',  cargo: 'Encargada de Microbiología',  tipo: 'staff' },
          ],
        },
        {
          nombre: 'Gabriela Risco',
          cargo:  'Dirección de Laboratorio y Calidad',
          tipo:   'direccion',
          hijos: [
            {
              nombre: 'Claudia Garrido',
              cargo:  'Jefatura Dpto. Biología',
              tipo:   'jefatura',
              hijos: [
                { nombre: 'Christian Pitot',         cargo: 'Veterinario – Biotario',      tipo: 'staff' },
                { nombre: 'Mª Paula Parez-Reyes',    cargo: 'Analista de Biología',        tipo: 'staff' },
                { nombre: 'Flavia Espinoza',         cargo: 'Analista de Biología Marina', tipo: 'staff' },
                { nombre: 'Carmen Legay',            cargo: 'Operario de Biotario',        tipo: 'staff' },
              ],
            },
            {
              nombre: 'Luis Ortega',
              cargo:  'Sub Dirección de Química',
              tipo:   'jefatura',
              hijos: [
                {
                  nombre: 'Michael Chávez',
                  cargo:  'Jefatura Dpto. Química',
                  tipo:   'jefatura',
                  hijos: [
                    { nombre: 'Álvaro Aguado', cargo: 'Asistente de Química', tipo: 'staff' },
                    { nombre: 'Gloria Ávalos', cargo: 'Técnica de Química',   tipo: 'staff' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

// ── Style maps ────────────────────────────────────────────────────────────────

const BG: Record<Tipo, string> = {
  gerente:  '#13602C',
  dtg:      '#1F4E79',
  direccion:'#2563eb',
  jefatura: '#e8f5f3',
  staff:    '#f8fafc',
}
const FG: Record<Tipo, string> = {
  gerente:  '#fff',
  dtg:      '#fff',
  direccion:'#fff',
  jefatura: '#1F4E79',
  staff:    '#64748b',
}
const BD: Record<Tipo, string> = {
  gerente:  '#0a3d1a',
  dtg:      '#163a5a',
  direccion:'#1d4ed8',
  jefatura: '#4AC3B2',
  staff:    '#e2e8f0',
}

// ── Legend items ──────────────────────────────────────────────────────────────

const LEYENDA: { tipo: Tipo; label: string }[] = [
  { tipo: 'gerente',   label: 'Gerencia General'            },
  { tipo: 'dtg',       label: 'Dirección Técnica General'   },
  { tipo: 'direccion', label: 'Direcciones'                 },
  { tipo: 'jefatura',  label: 'Jefaturas / Sub Direcciones' },
  { tipo: 'staff',     label: 'Personal'                    },
]

// ── Recursive node ────────────────────────────────────────────────────────────

function OrgNodo({ n }: { n: Nodo }) {
  return (
    <li>
      <div
        className="org-box"
        style={{ background: BG[n.tipo], color: FG[n.tipo], borderColor: BD[n.tipo] }}
      >
        <div className="org-nombre">{n.nombre}</div>
        {n.cargo && <div className="org-cargo">{n.cargo}</div>}
      </div>
      {n.hijos && n.hijos.length > 0 && (
        <ul>
          {n.hijos.map(h => <OrgNodo key={h.nombre + h.cargo} n={h} />)}
        </ul>
      )}
    </li>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function EstructuraPage() {
  await requireRol(['ADMINISTRACION', 'GERENTE_TECNICO'])

  return (
    <div className="p-6 min-h-screen">

      {/* ── Estilos del árbol ── */}
      <style>{`
        /* ─ Árbol (float clásico, el más fiable para jeraquías) ─ */
        .org-wrap {
          overflow-x: auto;
          overflow-y: visible;
          padding: 32px 24px 40px;
        }

        .org-root {
          display: table;
          margin: 0 auto;
          padding: 0;
          list-style: none;
        }

        /* Todos los ul internos */
        .org-root ul {
          padding-top: 20px;
          position: relative;
          list-style: none;
          margin: 0;
          padding-left: 0;
          display: table;
        }

        /* Vertical que baja del padre al grupo */
        .org-root ul::before {
          content: '';
          position: absolute;
          top: 0; left: 50%;
          border-left: 2px solid #94a3b8;
          width: 0; height: 20px;
        }

        /* Cada hijo */
        .org-root li {
          float: left;
          text-align: center;
          list-style: none;
          position: relative;
          padding: 20px 6px 0;
        }

        /* Líneas horizontales (left half = izquierda del nodo, right half = derecha) */
        .org-root li::before,
        .org-root li::after {
          content: '';
          position: absolute;
          top: 0; right: 50%;
          border-top: 2px solid #94a3b8;
          width: 50%; height: 20px;
        }
        .org-root li::after {
          right: auto; left: 50%;
          border-left: 2px solid #94a3b8;
        }

        /* Hijo único: sin horizontales */
        .org-root li:only-child::before,
        .org-root li:only-child::after { display: none; }

        /* Primer hijo: recortar la mitad izquierda */
        .org-root li:first-child::before,
        .org-root li:last-child::after  { border: none; }

        /* Esquinas redondeadas */
        .org-root li:last-child::before {
          border-right: 2px solid #94a3b8;
          border-radius: 0 4px 0 0;
        }
        .org-root li:first-child::after {
          border-radius: 4px 0 0 0;
        }

        /* Clearfix */
        .org-root ul::after {
          content: ''; display: table; clear: both;
        }

        /* ─ Caja de cada nodo ─ */
        .org-box {
          display: inline-block;
          border: 2px solid;
          border-radius: 8px;
          padding: 7px 12px;
          min-width: 120px;
          max-width: 155px;
          text-align: center;
          position: relative;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          white-space: normal;
          word-break: break-word;
          font-family: var(--font-montserrat), Arial, sans-serif;
        }
        .org-nombre {
          font-size: 11px;
          font-weight: 700;
          line-height: 1.3;
        }
        .org-cargo {
          font-size: 9px;
          line-height: 1.3;
          margin-top: 2px;
          opacity: 0.85;
        }
      `}</style>

      {/* ── Encabezado ── */}
      <div className="mb-6">
        <Link
          href="/rrhh"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition mb-4"
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a RRHH
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#1F4E79 0%,#2d6fa8 100%)' }}
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
              <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: 'var(--font-montserrat)' }}>
                Centro Toxicológico S.A.C. – CETOX LAB
              </p>
            </div>
          </div>

          {/* Leyenda */}
          <div className="flex flex-wrap gap-3 items-center">
            {LEYENDA.map(l => (
              <div key={l.tipo} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: BG[l.tipo], border: `1.5px solid ${BD[l.tipo]}` }} />
                <span className="text-[10px] text-slate-500" style={{ fontFamily: 'var(--font-montserrat)' }}>
                  {l.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Organigrama ── */}
      <div className="cetox-card">
        <div className="org-wrap">
          <ul className="org-root">
            <OrgNodo n={RAIZ} />
          </ul>
        </div>
      </div>

    </div>
  )
}
