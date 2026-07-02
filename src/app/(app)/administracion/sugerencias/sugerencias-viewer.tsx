'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, MessageSquare, Building2, Phone } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Sugerencia {
  id: string
  medioContacto: string[]
  ratingAtencion: string | null
  ratingRapidez: string | null
  ratingInformacion: string | null
  ratingAmbiente: string | null
  ratingCumplimiento: string | null
  ratingTiempoEspera: string | null
  satisfecho: boolean | null
  tuvoQuejaAntes: boolean | null
  quejaCuando: string | null
  quejaSobre: string | null
  quejaManejo: string | null
  sugerencias: string | null
  empresa: string | null
  contacto: string | null
  fechaCliente: string | null
  createdAt: string | Date
}

interface Props { sugerencias: Sugerencia[] }

// ── Constants ──────────────────────────────────────────────────────────────────

const RATING_LABELS: Record<string, string> = {
  MUY_BUENO: 'Muy bueno',
  BUENO:     'Bueno',
  REGULAR:   'Regular',
  MALO:      'Malo',
  MUY_MALO:  'Muy malo',
}
const RATING_COLOR: Record<string, string> = {
  MUY_BUENO: '#10b981',
  BUENO:     '#6ee7b7',
  REGULAR:   '#f59e0b',
  MALO:      '#f97316',
  MUY_MALO:  '#ef4444',
}
const MEDIO_LABELS: Record<string, string> = {
  PERSONALMENTE:   'Personalmente',
  TELEFONICAMENTE: 'Telefónicamente',
  EMAIL:           'E-mail',
  OTROS:           'Otros',
}
const ASPECTOS = [
  { key: 'ratingAtencion',     label: 'Atención y cortesía' },
  { key: 'ratingRapidez',      label: 'Rapidez de respuesta' },
  { key: 'ratingInformacion',  label: 'Información técnica' },
  { key: 'ratingAmbiente',     label: 'Ambiente y orden' },
  { key: 'ratingCumplimiento', label: 'Cumplimiento del servicio' },
  { key: 'ratingTiempoEspera', label: 'Tiempo de espera' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function ratingScore(r: string | null): number {
  return r ? ({ MUY_BUENO: 5, BUENO: 4, REGULAR: 3, MALO: 2, MUY_MALO: 1 }[r] ?? 0) : 0
}

function avgRating(s: Sugerencia): number | null {
  const vals = ASPECTOS.map(a => ratingScore(s[a.key as keyof Sugerencia] as string | null)).filter(v => v > 0)
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function RatingBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-slate-300 text-xs">—</span>
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
      style={{ backgroundColor: RATING_COLOR[value] ?? '#94a3b8' }}
    >
      {RATING_LABELS[value] ?? value}
    </span>
  )
}

function ScoreDot({ avg }: { avg: number | null }) {
  if (avg === null) return null
  const color = avg >= 4 ? '#10b981' : avg >= 3 ? '#f59e0b' : '#ef4444'
  const label = avg >= 4 ? 'Bueno' : avg >= 3 ? 'Regular' : 'Malo'
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color }}>
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      {label} ({avg.toFixed(1)})
    </span>
  )
}

// ── Card component ─────────────────────────────────────────────────────────────

function SugerenciaCard({ s, index }: { s: Sugerencia; index: number }) {
  const [open, setOpen] = useState(false)
  const avg = avgRating(s)
  const hasQueja = s.tuvoQuejaAntes === true

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* ── Header ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-slate-50/60 transition-colors"
      >
        {/* Number */}
        <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">
          {index + 1}
        </span>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {s.empresa && (
              <span className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {s.empresa}
              </span>
            )}
            {s.contacto && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Phone className="w-3 h-3" />
                {s.contacto}
              </span>
            )}
            {!s.empresa && !s.contacto && (
              <span className="text-sm text-slate-400 italic">Anónimo</span>
            )}
            {hasQueja && (
              <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-semibold border border-orange-200">
                Con queja previa
              </span>
            )}
            {s.satisfecho === false && (
              <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-semibold border border-red-200">
                No satisfecho
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-slate-400">{formatDate(s.createdAt)}</span>
            {avg !== null && <ScoreDot avg={avg} />}
            {s.medioContacto?.length > 0 && (
              <span className="text-xs text-slate-400">
                vía {s.medioContacto.map(m => MEDIO_LABELS[m] ?? m).join(', ')}
              </span>
            )}
          </div>
          {s.sugerencias && !open && (
            <p className="text-xs text-slate-500 mt-1 truncate max-w-xl italic">"{s.sugerencias}"</p>
          )}
        </div>

        {/* Chevron */}
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </button>

      {/* ── Detail ── */}
      {open && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-5">

          {/* Ratings table */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Calificaciones</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
              {ASPECTOS.map(a => (
                <div key={a.key} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-600">{a.label}</span>
                  <RatingBadge value={s[a.key as keyof Sugerencia] as string | null} />
                </div>
              ))}
            </div>
          </div>

          {/* Satisfacción */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">¿Satisfecho con el servicio?</span>
            {s.satisfecho === null
              ? <span className="text-slate-300 text-xs">No respondido</span>
              : <span className={`text-xs font-bold ${s.satisfecho ? 'text-green-600' : 'text-red-500'}`}>
                  {s.satisfecho ? 'SÍ' : 'NO'}
                </span>
            }
          </div>

          {/* Queja */}
          {s.tuvoQuejaAntes !== null && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Quejas anteriores</p>
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <span className="text-xs text-slate-500 w-28 flex-shrink-0">¿Tuvo queja?</span>
                  <span className="text-xs font-semibold text-slate-700">{s.tuvoQuejaAntes ? 'SÍ' : 'NO'}</span>
                </div>
                {s.quejaCuando && (
                  <div className="flex gap-2">
                    <span className="text-xs text-slate-500 w-28 flex-shrink-0">Cuándo</span>
                    <span className="text-xs text-slate-700">{s.quejaCuando}</span>
                  </div>
                )}
                {s.quejaSobre && (
                  <div className="flex gap-2">
                    <span className="text-xs text-slate-500 w-28 flex-shrink-0">Sobre qué</span>
                    <span className="text-xs text-slate-700">{s.quejaSobre}</span>
                  </div>
                )}
                {s.quejaManejo && (
                  <div className="flex gap-2">
                    <span className="text-xs text-slate-500 w-28 flex-shrink-0">Satisfecho con manejo</span>
                    <span className="text-xs text-slate-700">{s.quejaManejo}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sugerencias libres */}
          {s.sugerencias && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Sugerencias</p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-4 py-3 border border-slate-100 leading-relaxed">
                {s.sugerencias}
              </p>
            </div>
          )}

          {/* Datos de contacto */}
          {(s.empresa || s.contacto || s.fechaCliente) && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Datos de contacto</p>
              <div className="space-y-1">
                {s.empresa    && <p className="text-xs text-slate-600"><span className="font-medium">Empresa:</span> {s.empresa}</p>}
                {s.contacto   && <p className="text-xs text-slate-600"><span className="font-medium">Telef/e-mail:</span> {s.contacto}</p>}
                {s.fechaCliente && <p className="text-xs text-slate-600"><span className="font-medium">Fecha indicada:</span> {s.fechaCliente}</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function SugerenciasViewer({ sugerencias }: Props) {
  const total      = sugerencias.length
  const satisfechos = sugerencias.filter(s => s.satisfecho === true).length
  const conQuejas  = sugerencias.filter(s => s.tuvoQuejaAntes === true).length

  const allAvgs = sugerencias.map(s => avgRating(s)).filter((v): v is number => v !== null)
  const globalAvg = allAvgs.length ? allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length : null

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Sugerencias del cliente</h1>
        <p className="text-sm text-slate-500 mt-0.5">Formularios recibidos desde {' '}
          <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">cetoxlab.tech/sugerencias</span>
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total recibidas', value: total, color: '#3b82f6' },
          { label: 'Satisfechos', value: `${satisfechos}/${total}`, color: '#10b981' },
          { label: 'Con quejas previas', value: conQuejas, color: '#f59e0b' },
          { label: 'Puntaje promedio', value: globalAvg ? `${globalAvg.toFixed(1)}/5` : '—', color: '#8b5cf6' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {total === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-slate-500 text-sm font-medium">Sin sugerencias aún</p>
          <p className="text-slate-400 text-xs mt-1">Comparte el link <span className="font-mono">cetoxlab.tech/sugerencias</span> con los clientes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sugerencias.map((s, i) => (
            <SugerenciaCard key={s.id} s={s} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
