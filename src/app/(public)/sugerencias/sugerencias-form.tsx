'use client'

import { useState, useTransition } from 'react'
import { enviarSugerencia } from '@/app/actions/sugerencias'

// ── Types ──────────────────────────────────────────────────────────────────────
type Rating = 'MUY_BUENO' | 'BUENO' | 'REGULAR' | 'MALO' | 'MUY_MALO' | ''

interface FormState {
  medioContacto: Set<string>
  ratingAtencion: Rating
  ratingRapidez: Rating
  ratingInformacion: Rating
  ratingAmbiente: Rating
  ratingCumplimiento: Rating
  ratingTiempoEspera: Rating
  satisfecho: '' | 'SI' | 'NO'
  tuvoQuejaAntes: '' | 'NO' | 'SI'
  quejaCuando: string
  quejaSobre: string
  quejaManejo: string
  sugerencias: string
  empresa: string
  contacto: string
  fechaCliente: string
}

const INITIAL: FormState = {
  medioContacto: new Set(),
  ratingAtencion: '', ratingRapidez: '', ratingInformacion: '',
  ratingAmbiente: '', ratingCumplimiento: '', ratingTiempoEspera: '',
  satisfecho: '', tuvoQuejaAntes: '',
  quejaCuando: '', quejaSobre: '', quejaManejo: '',
  sugerencias: '', empresa: '', contacto: '', fechaCliente: '',
}

const RATINGS: { key: Rating; label: string }[] = [
  { key: 'MUY_BUENO', label: 'Muy bueno' },
  { key: 'BUENO',     label: 'Bueno' },
  { key: 'REGULAR',   label: 'Regular' },
  { key: 'MALO',      label: 'Malo' },
  { key: 'MUY_MALO',  label: 'Muy malo' },
]

const ASPECTOS: { field: keyof FormState; label: string }[] = [
  { field: 'ratingAtencion',     label: 'Atención y cortesía' },
  { field: 'ratingRapidez',      label: 'Rapidez en brindar respuesta según sus requerimientos' },
  { field: 'ratingInformacion',  label: 'Información y orientación técnica' },
  { field: 'ratingAmbiente',     label: 'Ambiente, orden y limpieza' },
  { field: 'ratingCumplimiento', label: 'Cumplimiento del servicio (entrega de informes)' },
  { field: 'ratingTiempoEspera', label: 'Tiempo de espera antes de ser atendido' },
]

// ── Styles ─────────────────────────────────────────────────────────────────────
const inputCls = 'border-b border-slate-400 bg-transparent w-full text-sm py-0.5 focus:outline-none focus:border-slate-700 placeholder:text-slate-400'
const sectionTitle = 'font-bold text-sm mb-2 text-slate-800'
const checkboxLabel = 'flex items-center gap-1.5 text-sm cursor-pointer select-none'

// ── Component ──────────────────────────────────────────────────────────────────
export function SugerenciasForm() {
  const [form, setForm]         = useState<FormState>(INITIAL)
  const [enviado, setEnviado]   = useState(false)
  const [isPending, startTransition] = useTransition()

  function toggleMedio(key: string) {
    setForm(f => {
      const s = new Set(f.medioContacto)
      s.has(key) ? s.delete(key) : s.add(key)
      return { ...f, medioContacto: s }
    })
  }

  function setRating(field: keyof FormState, value: Rating) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await enviarSugerencia({
        medioContacto:      Array.from(form.medioContacto),
        ratingAtencion:     form.ratingAtencion     || undefined,
        ratingRapidez:      form.ratingRapidez      || undefined,
        ratingInformacion:  form.ratingInformacion  || undefined,
        ratingAmbiente:     form.ratingAmbiente     || undefined,
        ratingCumplimiento: form.ratingCumplimiento || undefined,
        ratingTiempoEspera: form.ratingTiempoEspera || undefined,
        satisfecho:         form.satisfecho === 'SI' ? true : form.satisfecho === 'NO' ? false : undefined,
        tuvoQuejaAntes:     form.tuvoQuejaAntes === 'SI' ? true : form.tuvoQuejaAntes === 'NO' ? false : undefined,
        quejaCuando:        form.quejaCuando   || undefined,
        quejaSobre:         form.quejaSobre    || undefined,
        quejaManejo:        form.quejaManejo   || undefined,
        sugerencias:        form.sugerencias   || undefined,
        empresa:            form.empresa       || undefined,
        contacto:           form.contacto      || undefined,
        fechaCliente:       form.fechaCliente  || undefined,
      })
      setEnviado(true)
      setTimeout(() => { window.location.href = 'https://cetox.com.pe' }, 3000)
    })
  }

  // ── Success screen ───────────────────────────────────────────────────────────
  if (enviado) {
    return (
      <div className="bg-white w-full max-w-[420px] rounded-lg shadow-md p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">¡Gracias por su opinión!</h2>
        <p className="text-slate-500 text-sm">Su sugerencia ha sido registrada. Trabajaremos para mejorar nuestro servicio.</p>
        <p className="mt-1 text-xs text-slate-400 font-semibold tracking-wide">CETOX LAB</p>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="bg-white w-full max-w-[420px] shadow-md rounded-lg overflow-hidden">

      {/* Header */}
      <div className="px-6 pt-5 pb-4 text-center" style={{ backgroundColor: '#13602C' }}>
        <img src="/cetox-logo.svg" alt="CETOX Lab" className="h-16 w-auto mx-auto" />
      </div>

      <div className="px-6 pt-4 pb-6 space-y-5">

        {/* Title */}
        <div>
          <h1 className="text-base font-bold text-center text-slate-900 mb-1">SUGERENCIAS DEL CLIENTE</h1>
          <p className="text-[11px] text-slate-500 text-center leading-snug">
            Su opinión es valiosa para nosotros. Agradeceremos los comentarios que nos pueda hacer llegar para mejorar nuestra atención y/o servicios.
          </p>
        </div>

        {/* Medio de contacto */}
        <div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {[
              { key: 'PERSONALMENTE',  label: 'Personalmente' },
              { key: 'TELEFONICAMENTE', label: 'Telefónicamente' },
              { key: 'EMAIL',          label: 'E-mail' },
              { key: 'OTROS',          label: 'Otros' },
            ].map(m => (
              <label key={m.key} className={checkboxLabel}>
                <input type="checkbox" checked={form.medioContacto.has(m.key)} onChange={() => toggleMedio(m.key)}
                  className="w-3.5 h-3.5 accent-slate-700 cursor-pointer" />
                <span className="text-xs">{m.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Rating table */}
        <div>
          <p className={sectionTitle}>¿Cómo nos calificaría en los siguientes aspectos?</p>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr>
                  <th className="border border-slate-300 px-2 py-1.5 text-left font-semibold text-slate-700 bg-slate-50 w-[40%]">ASPECTOS</th>
                  {RATINGS.map(r => (
                    <th key={r.key} className="border border-slate-300 px-1 py-1.5 text-center font-semibold text-slate-700 bg-slate-50 whitespace-nowrap">
                      {r.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ASPECTOS.map(a => (
                  <tr key={a.field} className="hover:bg-slate-50/60">
                    <td className="border border-slate-300 px-2 py-2 text-slate-700 leading-tight">{a.label}</td>
                    {RATINGS.map(r => (
                      <td key={r.key} className="border border-slate-300 text-center py-2">
                        <input
                          type="radio"
                          name={a.field}
                          value={r.key}
                          checked={form[a.field] === r.key}
                          onChange={() => setRating(a.field, r.key)}
                          className="w-3.5 h-3.5 accent-slate-700 cursor-pointer"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Satisfacción */}
        <div>
          <p className={sectionTitle}>¿Se siente usted satisfecho con nuestro servicio?</p>
          <div className="flex gap-6">
            {(['SI', 'NO'] as const).map(v => (
              <label key={v} className={checkboxLabel}>
                <input type="radio" name="satisfecho" value={v} checked={form.satisfecho === v}
                  onChange={() => setForm(f => ({ ...f, satisfecho: v }))}
                  className="w-3.5 h-3.5 accent-slate-700 cursor-pointer" />
                <span className="text-sm">{v}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Quejas */}
        <div>
          <p className={sectionTitle}>¿Tuvo alguna queja con nosotros antes?</p>
          <div className="flex items-center gap-4 mb-3">
            {(['NO', 'SI'] as const).map(v => (
              <label key={v} className={checkboxLabel}>
                <input type="radio" name="tuvoQueja" value={v} checked={form.tuvoQuejaAntes === v}
                  onChange={() => setForm(f => ({ ...f, tuvoQuejaAntes: v }))}
                  className="w-3.5 h-3.5 accent-slate-700 cursor-pointer" />
                <span className="text-sm">{v}</span>
              </label>
            ))}
            {form.tuvoQuejaAntes === 'SI' && (
              <div className="flex items-center gap-1 flex-1">
                <span className="text-xs text-slate-500 whitespace-nowrap">Cuándo:</span>
                <input type="text" value={form.quejaCuando} onChange={e => setForm(f => ({ ...f, quejaCuando: e.target.value }))}
                  className={inputCls} />
              </div>
            )}
          </div>
          {form.tuvoQuejaAntes === 'SI' && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 whitespace-nowrap">Sobre qué?</span>
                <input type="text" value={form.quejaSobre} onChange={e => setForm(f => ({ ...f, quejaSobre: e.target.value }))}
                  className={inputCls} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 whitespace-nowrap">¿Quedó satisfecho con el manejo de su queja?</span>
                <input type="text" value={form.quejaManejo} onChange={e => setForm(f => ({ ...f, quejaManejo: e.target.value }))}
                  className={inputCls} />
              </div>
            </div>
          )}
        </div>

        {/* Sugerencias */}
        <div>
          <p className={sectionTitle}>¿Qué podríamos hacer para atenderlo mejor?</p>
          <div className="border border-slate-300 rounded">
            <textarea
              rows={5}
              value={form.sugerencias}
              onChange={e => setForm(f => ({ ...f, sugerencias: e.target.value }))}
              className="w-full text-sm px-2 py-2 resize-none focus:outline-none bg-transparent placeholder:text-slate-400"
              placeholder="Escriba aquí sus sugerencias…"
            />
          </div>
        </div>

        {/* Datos de contacto */}
        <div className="border-t border-slate-200 pt-4 space-y-3">
          <p className="text-[11px] text-slate-500">Si desea déjenos sus datos para contactarnos con Usted:</p>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600 whitespace-nowrap w-24 flex-shrink-0">Empresa:</label>
            <input type="text" value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))}
              className={inputCls} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600 whitespace-nowrap w-24 flex-shrink-0">Telef / e-mail:</label>
            <input type="text" value={form.contacto} onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))}
              className={inputCls} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600 whitespace-nowrap w-24 flex-shrink-0">Fecha:</label>
            <input type="text" placeholder="dd/mm/aaaa" value={form.fechaCliente}
              onChange={e => setForm(f => ({ ...f, fechaCliente: e.target.value }))}
              className={inputCls} />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 rounded-lg text-white text-sm font-bold disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#13602C' }}
        >
          {isPending ? 'Enviando…' : 'Enviar sugerencia'}
        </button>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400 font-semibold tracking-wide">
          MUCHAS GRACIAS<br />
          <span className="font-normal">FR N° 021-CETOX-V.04</span>
        </p>
      </div>
    </form>
  )
}
