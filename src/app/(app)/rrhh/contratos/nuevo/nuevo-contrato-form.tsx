'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Printer,
  Plus,
  Trash2,
  ChevronRight,
} from 'lucide-react'
import type { TipoContrato, PagoLocacion } from '@/lib/contratos/types'
import {
  generarIndeterminado,
  generarIndeterminadoAltaDireccion,
  generarPlazoFijo,
  generarLocacion,
} from '@/lib/contratos/templates'

// ── Shared styles ─────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition bg-white'
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1'
const sectionHeaderCls =
  'text-[10px] font-semibold tracking-widest uppercase mb-3 px-1'

// ── Tipo metadata ─────────────────────────────────────────────────────────────

const TIPO_META: Record<TipoContrato, { titulo: string; subtitulo: string; color: string }> = {
  INDETERMINADO: {
    titulo:   'Contrato a Plazo Indeterminado',
    subtitulo: 'Modalidad estándar · D.Leg. 728',
    color:    '#13602C',
  },
  INDETERMINADO_ALTA_DIR: {
    titulo:   'Plazo Indeterminado – Alta Dirección',
    subtitulo: 'Modalidad ejecutiva · D.Leg. 728',
    color:    '#7c3aed',
  },
  PLAZO_FIJO: {
    titulo:   'Contrato a Plazo Fijo',
    subtitulo: 'Modalidad: Servicio Específico · D.Leg. 728',
    color:    '#d97706',
  },
  LOCACION_SERVICIOS: {
    titulo:   'Locación de Servicios Temporales',
    subtitulo: 'Contrato civil · Art. 1764 C.C.',
    color:    '#059669',
  },
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className={sectionHeaderCls} style={{ color: 'rgba(74,195,178,0.85)' }}>
        {label}
      </p>
      <div className="cetox-card p-5 space-y-4">{children}</div>
    </div>
  )
}

// ── FORM: Indeterminado / Alta Dirección ──────────────────────────────────────

function FormIndeterminado({
  onGenerar,
}: {
  onGenerar: (html: string) => void
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const g = (k: string) => (fd.get(k) as string | null) ?? ''
    const isAltaDir = (fd.get('_tipo') as string) === 'INDETERMINADO_ALTA_DIR'

    const funcionesEspecificas = g('funcionesEspecificas')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    const campos = {
      trabajadorNombre:       g('trabajadorNombre'),
      trabajadorDni:          g('trabajadorDni'),
      trabajadorDomicilio:    g('trabajadorDomicilio'),
      trabajadorDistrito:     g('trabajadorDistrito'),
      cargo:                  g('cargo'),
      fechaIngresoServicios:  g('fechaIngresoServicios'),
      remuneracionNum:        parseFloat(g('remuneracionNum')) || 0,
      fechaAntiguedadTexto:   g('fechaAntiguedadTexto'),
      funcionesEspecificas,
      diaFirma:               g('diaFirma'),
      mesFirma:               g('mesFirma'),
      anioFirma:              g('anioFirma'),
    }

    const html = isAltaDir
      ? generarIndeterminadoAltaDireccion(campos)
      : generarIndeterminado(campos)
    onGenerar(html)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section label="Datos del trabajador">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nombre completo *</label>
            <input name="trabajadorNombre" required placeholder="Apellidos y nombre" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>DNI *</label>
            <input name="trabajadorDni" required maxLength={12} placeholder="00000000" className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Domicilio *</label>
            <input name="trabajadorDomicilio" required placeholder="Av. / Jr. / Calle..." className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Distrito *</label>
            <input name="trabajadorDistrito" required placeholder="Ej: Lima, San Borja..." className={inputCls} />
          </div>
        </div>
      </Section>

      <Section label="Datos laborales">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Cargo *</label>
            <input name="cargo" required placeholder="Ej: Analista de Calidad" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Remuneración mensual (S/) *</label>
            <input
              name="remuneracionNum"
              type="number"
              required
              min={0}
              step={0.01}
              placeholder="3500.00"
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Fecha de inicio de servicios *</label>
            <input
              name="fechaIngresoServicios"
              required
              placeholder="DD/MM/YYYY"
              maxLength={10}
              className={inputCls}
            />
            <p className="text-[10px] text-slate-400 mt-1">Formato: 01/10/2024</p>
          </div>
          <div>
            <label className={labelCls}>Fecha de antigüedad (cláusula 11) *</label>
            <input
              name="fechaAntiguedadTexto"
              required
              placeholder="DD/MM/YYYY"
              maxLength={10}
              className={inputCls}
            />
            <p className="text-[10px] text-slate-400 mt-1">Puede ser igual o anterior al inicio</p>
          </div>
        </div>

        <div>
          <label className={labelCls}>Funciones específicas del cargo (cláusula 7)</label>
          <textarea
            name="funcionesEspecificas"
            rows={6}
            placeholder={'Una función por línea. Ej:\nApoyar en la elaboración de informes técnicos\nRealizar el control de calidad de los ensayos\nMantener actualizada la documentación del SGC'}
            className={`${inputCls} resize-y`}
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Se listarán como A), B), C)… en la cláusula 7 (Obligaciones del Trabajador).
            Déjalo vacío para usar el texto genérico (solo MOF).
          </p>
        </div>
      </Section>

      <Section label="Lugar y fecha de firma">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Día *</label>
            <input name="diaFirma" required maxLength={2} placeholder="01" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Mes *</label>
            <input name="mesFirma" required placeholder="enero" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Año *</label>
            <input name="anioFirma" required maxLength={4} placeholder="2025" className={inputCls} />
          </div>
        </div>
      </Section>

      <Actions />
    </form>
  )
}

// ── FORM: Plazo Fijo ─────────────────────────────────────────────────────────

function FormPlazoFijo({ onGenerar }: { onGenerar: (html: string) => void }) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const g = (k: string) => (fd.get(k) as string | null) ?? ''

    const campos = {
      trabajadorNombre:    g('trabajadorNombre'),
      trabajadorDni:       g('trabajadorDni'),
      trabajadorDomicilio: g('trabajadorDomicilio'),
      trabajadorDistrito:  g('trabajadorDistrito'),
      trabajadorProfesion: g('trabajadorProfesion'),
      cargo:               g('cargo'),
      causaObjetiva:       g('causaObjetiva'),
      remuneracionNum:     parseFloat(g('remuneracionNum')) || 0,
      duracionTexto:       g('duracionTexto'),
      fechaInicio:         g('fechaInicio'),
      fechaFin:            g('fechaFin'),
      diaFirma:            g('diaFirma'),
      mesFirma:            g('mesFirma'),
      anioFirma:           g('anioFirma'),
    }

    onGenerar(generarPlazoFijo(campos))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section label="Datos del trabajador">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nombre completo *</label>
            <input name="trabajadorNombre" required placeholder="Apellidos y nombre" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>DNI *</label>
            <input name="trabajadorDni" required maxLength={12} placeholder="00000000" className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Domicilio *</label>
            <input name="trabajadorDomicilio" required placeholder="Av. / Jr. / Calle..." className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Distrito *</label>
            <input name="trabajadorDistrito" required placeholder="Ej: Lima, San Borja..." className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Profesión / especialidad *</label>
          <input
            name="trabajadorProfesion"
            required
            placeholder="Ej: Biólogo, Químico, Ingeniero Industrial..."
            className={inputCls}
          />
        </div>
      </Section>

      <Section label="Datos laborales">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Cargo *</label>
            <input name="cargo" required placeholder="Ej: Técnico de Laboratorio" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Remuneración mensual (S/) *</label>
            <input
              name="remuneracionNum"
              type="number"
              required
              min={0}
              step={0.01}
              placeholder="2500.00"
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Causa objetiva / descripción del servicio *</label>
          <textarea
            name="causaObjetiva"
            required
            rows={3}
            placeholder="Describe el servicio específico que justifica el contrato modal..."
            className={`${inputCls} resize-none`}
          />
        </div>
      </Section>

      <Section label="Vigencia del contrato">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Duración (texto) *</label>
            <input
              name="duracionTexto"
              required
              placeholder="tres (03) meses"
              className={inputCls}
            />
            <p className="text-[10px] text-slate-400 mt-1">Ej: "seis (06) meses"</p>
          </div>
          <div>
            <label className={labelCls}>Fecha de inicio *</label>
            <input
              name="fechaInicio"
              required
              placeholder="DD/MM/YYYY"
              maxLength={10}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Fecha de fin *</label>
            <input
              name="fechaFin"
              required
              placeholder="DD/MM/YYYY"
              maxLength={10}
              className={inputCls}
            />
          </div>
        </div>
      </Section>

      <Section label="Lugar y fecha de firma">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Día *</label>
            <input name="diaFirma" required maxLength={2} placeholder="01" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Mes *</label>
            <input name="mesFirma" required placeholder="enero" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Año *</label>
            <input name="anioFirma" required maxLength={4} placeholder="2025" className={inputCls} />
          </div>
        </div>
      </Section>

      <Actions />
    </form>
  )
}

// ── FORM: Locación de Servicios ───────────────────────────────────────────────

function FormLocacion({ onGenerar }: { onGenerar: (html: string) => void }) {
  const [pagos, setPagos] = useState<PagoLocacion[]>([
    { id: '01', entregable: '', fechaPago: '', monto: 0 },
  ])

  function addPago() {
    if (pagos.length >= 4) return
    const id = String(pagos.length + 1).padStart(2, '0')
    setPagos(prev => [...prev, { id, entregable: '', fechaPago: '', monto: 0 }])
  }

  function removePago(index: number) {
    if (pagos.length <= 1) return
    setPagos(prev => prev.filter((_, i) => i !== index).map((p, i) => ({ ...p, id: String(i + 1).padStart(2, '0') })))
  }

  function updatePago(index: number, field: keyof PagoLocacion, value: string | number) {
    setPagos(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  const totalPagos = pagos.reduce((sum, p) => sum + (p.monto || 0), 0)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const g = (k: string) => (fd.get(k) as string | null) ?? ''

    const campos = {
      prestadorNombre:      g('prestadorNombre'),
      prestadorDni:         g('prestadorDni'),
      prestadorDomicilio:   g('prestadorDomicilio'),
      prestadorDistrito:    g('prestadorDistrito'),
      descripcionServicios: g('descripcionServicios'),
      honorariosTotal:      parseFloat(g('honorariosTotal')) || 0,
      pagos,
      duracionMeses:        parseInt(g('duracionMeses'), 10) || 1,
      fechaInicio:          g('fechaInicio'),
      fechaFin:             g('fechaFin'),
      diaFirma:             g('diaFirma'),
      mesFirma:             g('mesFirma'),
      anioFirma:            g('anioFirma'),
    }

    onGenerar(generarLocacion(campos))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section label="Datos del prestador">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nombre completo *</label>
            <input name="prestadorNombre" required placeholder="Apellidos y nombre" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>DNI *</label>
            <input name="prestadorDni" required maxLength={12} placeholder="00000000" className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Domicilio *</label>
            <input name="prestadorDomicilio" required placeholder="Av. / Jr. / Calle..." className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Distrito *</label>
            <input name="prestadorDistrito" required placeholder="Ej: Lima, Miraflores..." className={inputCls} />
          </div>
        </div>
      </Section>

      <Section label="Objeto del contrato">
        <div>
          <label className={labelCls}>Descripción de servicios *</label>
          <textarea
            name="descripcionServicios"
            required
            rows={4}
            placeholder="Describe detalladamente los servicios que prestará..."
            className={`${inputCls} resize-none`}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Honorarios totales (S/) *</label>
            <input
              name="honorariosTotal"
              type="number"
              required
              min={0}
              step={0.01}
              placeholder="5000.00"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Duración (meses) *</label>
            <input
              name="duracionMeses"
              type="number"
              required
              min={1}
              max={24}
              placeholder="3"
              className={inputCls}
            />
          </div>
          <div>
            {/* spacer */}
          </div>
        </div>
      </Section>

      <Section label="Vigencia del contrato">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Fecha de inicio *</label>
            <input name="fechaInicio" required placeholder="DD/MM/YYYY" maxLength={10} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Fecha de fin *</label>
            <input name="fechaFin" required placeholder="DD/MM/YYYY" maxLength={10} className={inputCls} />
          </div>
        </div>
      </Section>

      {/* ── Pagos ── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <p className={sectionHeaderCls} style={{ color: 'rgba(74,195,178,0.85)', margin: 0 }}>
            Cronograma de pagos
          </p>
          {pagos.length < 4 && (
            <button
              type="button"
              onClick={addPago}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
              style={{
                backgroundColor: 'rgba(5,150,105,0.08)',
                color: '#059669',
                border: '1px solid rgba(5,150,105,0.2)',
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir pago
            </button>
          )}
        </div>

        <div className="cetox-card overflow-hidden">
          {/* Table header */}
          <div
            className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: 'rgba(0,0,0,0.03)', color: '#64748b' }}
          >
            <div className="col-span-1">#</div>
            <div className="col-span-4">Entregable / descripción</div>
            <div className="col-span-3">Fecha de pago</div>
            <div className="col-span-3">Monto (S/)</div>
            <div className="col-span-1"></div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {pagos.map((pago, i) => (
              <div key={pago.id} className="grid grid-cols-12 gap-2 items-center px-4 py-3">
                <div className="col-span-1">
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold"
                    style={{ backgroundColor: 'rgba(5,150,105,0.1)', color: '#059669' }}
                  >
                    {pago.id}
                  </span>
                </div>
                <div className="col-span-4">
                  <input
                    value={pago.entregable}
                    onChange={e => updatePago(i, 'entregable', e.target.value)}
                    placeholder="Primer entregable..."
                    className={inputCls}
                    required
                  />
                </div>
                <div className="col-span-3">
                  <input
                    value={pago.fechaPago}
                    onChange={e => updatePago(i, 'fechaPago', e.target.value)}
                    placeholder="DD/MM/YYYY"
                    maxLength={10}
                    className={inputCls}
                    required
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    value={pago.monto || ''}
                    onChange={e => updatePago(i, 'monto', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min={0}
                    step={0.01}
                    className={inputCls}
                    required
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  {pagos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePago(i)}
                      className="p-1.5 rounded-md transition hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div
            className="flex items-center justify-end gap-3 px-4 py-3 text-sm font-semibold"
            style={{ backgroundColor: 'rgba(5,150,105,0.05)', borderTop: '1px solid rgba(5,150,105,0.12)' }}
          >
            <span className="text-slate-500 text-xs">Total honorarios:</span>
            <span style={{ color: '#059669' }}>
              S/ {totalPagos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <Section label="Lugar y fecha de firma">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Día *</label>
            <input name="diaFirma" required maxLength={2} placeholder="01" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Mes *</label>
            <input name="mesFirma" required placeholder="enero" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Año *</label>
            <input name="anioFirma" required maxLength={4} placeholder="2025" className={inputCls} />
          </div>
        </div>
      </Section>

      <Actions />
    </form>
  )
}

// ── Actions bar ───────────────────────────────────────────────────────────────

function Actions() {
  return (
    <div className="flex items-center justify-end gap-3 pt-2">
      <Link
        href="/rrhh/contratos"
        className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
        style={{ fontFamily: 'var(--font-montserrat)' }}
      >
        Cancelar
      </Link>
      <button
        type="submit"
        className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition"
        style={{
          background: 'linear-gradient(135deg, #13602C 0%, #2d6fa8 100%)',
          fontFamily: 'var(--font-montserrat)',
        }}
      >
        <Printer className="w-4 h-4" />
        Generar documento
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  tipo: TipoContrato
}

export function NuevoContratoForm({ tipo }: Props) {
  const meta = TIPO_META[tipo]

  function handleGenerar(html: string) {
    const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const win  = window.open(url, '_blank')
    if (!win) {
      alert('El navegador bloqueó la ventana emergente. Permite las ventanas emergentes para esta página.')
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-8">
        <Link
          href="/rrhh/contratos"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition mb-4"
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Tipos de contrato
        </Link>

        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ backgroundColor: `${meta.color}18` }}
          >
            <FileText className="w-5 h-5" style={{ color: meta.color }} />
          </div>
          <div>
            <h1
              className="text-lg font-bold text-slate-900 leading-none"
              style={{ fontFamily: 'var(--font-oswald)', letterSpacing: '0.05em' }}
            >
              {meta.titulo.toUpperCase()}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: 'var(--font-montserrat)' }}>
              {meta.subtitulo}
            </p>
          </div>
        </div>
      </div>

      {/* ── Form ── */}
      {tipo === 'INDETERMINADO' && (
        <FormIndeterminado onGenerar={handleGenerar} />
      )}
      {tipo === 'INDETERMINADO_ALTA_DIR' && (
        // Re-use same form, pass tipo via hidden input so we call the right generator
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            const g = (k: string) => (fd.get(k) as string | null) ?? ''
            const funcionesEspecificas = g('funcionesEspecificas')
              .split('\n')
              .map((l) => l.trim())
              .filter((l) => l.length > 0)
            const campos = {
              trabajadorNombre:       g('trabajadorNombre'),
              trabajadorDni:          g('trabajadorDni'),
              trabajadorDomicilio:    g('trabajadorDomicilio'),
              trabajadorDistrito:     g('trabajadorDistrito'),
              cargo:                  g('cargo'),
              fechaIngresoServicios:  g('fechaIngresoServicios'),
              remuneracionNum:        parseFloat(g('remuneracionNum')) || 0,
              fechaAntiguedadTexto:   g('fechaAntiguedadTexto'),
              funcionesEspecificas,
              diaFirma:               g('diaFirma'),
              mesFirma:               g('mesFirma'),
              anioFirma:              g('anioFirma'),
            }
            handleGenerar(generarIndeterminadoAltaDireccion(campos))
          }}
          className="space-y-6"
        >
          <Section label="Datos del ejecutivo">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nombre completo *</label>
                <input name="trabajadorNombre" required placeholder="Apellidos y nombre" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>DNI *</label>
                <input name="trabajadorDni" required maxLength={12} placeholder="00000000" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Domicilio *</label>
                <input name="trabajadorDomicilio" required placeholder="Av. / Jr. / Calle..." className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Distrito *</label>
                <input name="trabajadorDistrito" required placeholder="Ej: Lima, San Borja..." className={inputCls} />
              </div>
            </div>
          </Section>

          <Section label="Datos laborales">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Cargo *</label>
                <input name="cargo" required placeholder="Ej: Gerente General, Director..." className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Remuneración mensual (S/) *</label>
                <input
                  name="remuneracionNum"
                  type="number"
                  required
                  min={0}
                  step={0.01}
                  placeholder="8000.00"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Fecha de inicio de servicios *</label>
                <input name="fechaIngresoServicios" required placeholder="DD/MM/YYYY" maxLength={10} className={inputCls} />
                <p className="text-[10px] text-slate-400 mt-1">Formato: 01/10/2024</p>
              </div>
              <div>
                <label className={labelCls}>Fecha de antigüedad (cláusula 11) *</label>
                <input name="fechaAntiguedadTexto" required placeholder="DD/MM/YYYY" maxLength={10} className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Funciones específicas del cargo (cláusula 7)</label>
              <textarea
                name="funcionesEspecificas"
                rows={6}
                placeholder={'Una función por línea. Ej:\nDirigir la estrategia comercial y operativa\nRepresentar legalmente a la empresa\nSupervisar al equipo directivo'}
                className={`${inputCls} resize-y`}
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Se añaden como A), B), C)… al final de la cláusula 7. Déjalo vacío para el texto genérico.
              </p>
            </div>
          </Section>

          <Section label="Lugar y fecha de firma">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Día *</label>
                <input name="diaFirma" required maxLength={2} placeholder="01" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Mes *</label>
                <input name="mesFirma" required placeholder="enero" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Año *</label>
                <input name="anioFirma" required maxLength={4} placeholder="2025" className={inputCls} />
              </div>
            </div>
          </Section>

          <Actions />
        </form>
      )}
      {tipo === 'PLAZO_FIJO' && (
        <FormPlazoFijo onGenerar={handleGenerar} />
      )}
      {tipo === 'LOCACION_SERVICIOS' && (
        <FormLocacion onGenerar={handleGenerar} />
      )}

    </div>
  )
}
