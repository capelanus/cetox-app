import { requireRol } from '@/lib/roles'
import Link from 'next/link'
import { FileText, ArrowLeft, ChevronRight, Clock, Users2, Briefcase } from 'lucide-react'

// ── Contract type card ────────────────────────────────────────────────────────

interface TipoCardProps {
  tipo:        string
  titulo:      string
  subtitulo:   string
  descripcion: string
  icon:        React.ElementType
  color:       string
  bg:          string
  campos:      string[]
}

function TipoCard({ tipo, titulo, subtitulo, descripcion, icon: Icon, color, bg, campos }: TipoCardProps) {
  return (
    <Link
      href={`/rrhh/contratos/nuevo?tipo=${tipo}`}
      className="cetox-card p-5 flex flex-col gap-4 relative overflow-hidden group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 mt-0.5"
          style={{ backgroundColor: bg }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color }}>
            {subtitulo}
          </p>
          <h3
            className="text-sm font-bold text-slate-800 leading-snug"
            style={{ fontFamily: 'var(--font-montserrat)' }}
          >
            {titulo}
          </h3>
        </div>
        <ChevronRight
          className="w-4 h-4 flex-shrink-0 mt-0.5 transition-transform duration-150 group-hover:translate-x-0.5"
          style={{ color: '#cbd5e1' }}
        />
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500 leading-relaxed">{descripcion}</p>

      {/* Fields preview */}
      <div className="flex flex-wrap gap-1.5">
        {campos.map(c => (
          <span
            key={c}
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: bg, color }}
          >
            {c}
          </span>
        ))}
      </div>
    </Link>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ContratosPage() {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_ADMINISTRACION', 'GERENTE_TECNICO'])

  const tipos: TipoCardProps[] = [
    {
      tipo:        'INDETERMINADO',
      titulo:      'Contrato a Plazo Indeterminado',
      subtitulo:   'Modalidad estándar',
      descripcion: 'Contrato de trabajo de duración indefinida. Incluye cláusulas de remuneración, horario, obligaciones del trabajador y Ley de Productividad Laboral.',
      icon:        FileText,
      color:       '#1F4E79',
      bg:          'rgba(31,78,121,0.08)',
      campos:      ['Datos personales', 'Cargo', 'Remuneración', 'Antigüedad', 'Firma'],
    },
    {
      tipo:        'INDETERMINADO_ALTA_DIR',
      titulo:      'Plazo Indeterminado – Alta Dirección',
      subtitulo:   'Modalidad ejecutiva',
      descripcion: 'Contrato para personal de alta dirección. Excluye beneficios del régimen laboral común según D.Leg. 728; puede pactar compensación especial.',
      icon:        Briefcase,
      color:       '#7c3aed',
      bg:          'rgba(124,58,237,0.08)',
      campos:      ['Datos personales', 'Cargo ejecutivo', 'Remuneración', 'Antigüedad', 'Firma'],
    },
    {
      tipo:        'PLAZO_FIJO',
      titulo:      'Contrato a Plazo Fijo',
      subtitulo:   'Modalidad: Servicio Específico',
      descripcion: 'Contrato sujeto a modalidad por servicio específico (D.Leg. 728, Art. 63). Incluye causa objetiva, duración determinada y vigencia.',
      icon:        Clock,
      color:       '#d97706',
      bg:          'rgba(217,119,6,0.08)',
      campos:      ['Datos personales', 'Profesión', 'Cargo', 'Causa objetiva', 'Duración', 'Remuneración', 'Firma'],
    },
    {
      tipo:        'LOCACION_SERVICIOS',
      titulo:      'Locación de Servicios Temporales',
      subtitulo:   'Contrato civil',
      descripcion: 'Contrato civil de prestación de servicios (Art. 1764 C.C.). Para personas naturales independientes. Incluye cronograma de pagos por entregables.',
      icon:        Users2,
      color:       '#059669',
      bg:          'rgba(5,150,105,0.08)',
      campos:      ['Datos del prestador', 'Descripción de servicios', 'Honorarios', 'Cronograma de pagos', 'Firma'],
    },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-8">
        <Link
          href="/rrhh"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition mb-4"
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a RRHH
        </Link>

        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #1F4E79 0%, #2d6fa8 100%)' }}
          >
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1
              className="text-xl font-bold text-slate-900 leading-none"
              style={{ fontFamily: 'var(--font-oswald)', letterSpacing: '0.06em' }}
            >
              CONTRATOS & DOCUMENTOS
            </h1>
            <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: 'var(--font-montserrat)' }}>
              Selecciona el tipo de contrato para completar el formulario
            </p>
          </div>
        </div>
      </div>

      {/* ── Type cards ── */}
      <div>
        <p
          className="text-[10px] font-semibold tracking-widest uppercase mb-3 px-1"
          style={{ color: 'rgba(74,195,178,0.8)', fontFamily: 'var(--font-montserrat)' }}
        >
          Tipos de contrato disponibles
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tipos.map(t => (
            <TipoCard key={t.tipo} {...t} />
          ))}
        </div>
      </div>

      {/* ── Info note ── */}
      <div
        className="mt-6 flex items-start gap-2 p-4 rounded-xl text-xs text-slate-500"
        style={{ backgroundColor: 'rgba(74,195,178,0.06)', border: '1px solid rgba(74,195,178,0.15)' }}
      >
        <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#4AC3B2' }} />
        <p style={{ fontFamily: 'var(--font-montserrat)' }}>
          Al seleccionar un tipo de contrato se abrirá el formulario correspondiente. Una vez completado,
          podrás previsualizar e imprimir el documento en formato A4 o guardarlo como PDF.
        </p>
      </div>

    </div>
  )
}
