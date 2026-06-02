'use client'

import { useState, useTransition } from 'react'
import { CalendarioMultiSelect } from './calendario'
import { crearSolicitudVacaciones, type TipoVacaciones, type TipoLicencia } from '@/app/actions/vacaciones'
import { Loader2, AlertCircle, CheckCircle2, Send } from 'lucide-react'

interface Props {
  nombre:       string
  cargoDefault: string
  deptDefault:  string
  jefes:        { id: string; nombre: string }[]
}

const TIPO_VAC: { value: TipoVacaciones; label: string }[] = [
  { value: 'REGLAMENTARIA', label: 'Reglamentaria' },
  { value: 'ATRASADA',      label: 'Atrasada' },
  { value: 'ADELANTADA',    label: 'Adelantada' },
]
const TIPO_LIC: { value: TipoLicencia; label: string }[] = [
  { value: 'CON_GOCE',           label: 'Con goce de haber' },
  { value: 'SIN_GOCE',           label: 'Sin goce de haber' },
  { value: 'MOTIVOS_PERSONALES', label: 'Por motivos personales' },
  { value: 'OTROS',              label: 'Otros' },
]

export function SolicitudVacacionesForm({ nombre, cargoDefault, deptDefault, jefes }: Props) {
  const [pending, start] = useTransition()
  const [dias,    setDias]    = useState<string[]>([])
  const [tipoVac, setTipoVac] = useState<TipoVacaciones>('REGLAMENTARIA')
  const [tipoLic, setTipoLic] = useState<TipoLicencia>('CON_GOCE')
  const [cargo,   setCargo]   = useState(cargoDefault)
  const [dept,    setDept]    = useState(deptDefault)
  const [jefe,    setJefe]    = useState(jefes[0]?.nombre ?? '')
  const [delegado, setDelegado] = useState('')
  const [obs,     setObs]     = useState('')
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    start(async () => {
      const result = await crearSolicitudVacaciones({
        cargo,
        departamento:    dept,
        jefeInmediato:   jefe,
        diasSolicitados: dias,
        tipoVacaciones:  tipoVac,
        tipoLicencia:    tipoLic,
        personaDelegada: delegado,
        observaciones:   obs,
      })
      if ('error' in result) {
        setError(result.error)
      } else {
        setSuccess(true)
        setDias([])
      }
    })
  }

  if (success) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 py-12 rounded-2xl"
        style={{ backgroundColor: 'rgba(19,96,44,0.05)', border: '1.5px solid rgba(19,96,44,0.15)' }}
      >
        <CheckCircle2 className="h-12 w-12" style={{ color: '#13602C' }} />
        <div className="text-center">
          <p className="font-bold text-lg" style={{ color: '#13602C' }}>¡Solicitud enviada!</p>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            Tu solicitud fue enviada al área de RRHH para revisión.
          </p>
        </div>
        <button
          onClick={() => setSuccess(false)}
          className="cetox-btn-secondary text-sm px-6 py-2"
        >
          Nueva solicitud
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Datos personales */}
      <div className="cetox-card p-5 space-y-4">
        <h3 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#4AC3B2' }}>
          Datos del solicitante
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nombre (read-only) */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: '#64748b' }}>
              Apellidos y nombres
            </label>
            <input
              value={nombre}
              readOnly
              className="cetox-input text-sm bg-slate-50"
              style={{ color: '#94a3b8', cursor: 'not-allowed' }}
            />
          </div>

          {/* Cargo */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: '#64748b' }}>
              Cargo <span className="text-red-400">*</span>
            </label>
            <input
              value={cargo}
              onChange={e => setCargo(e.target.value)}
              className="cetox-input text-sm"
              placeholder="Ej. Analista de Laboratorio"
              required
            />
          </div>

          {/* Departamento */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: '#64748b' }}>
              Departamento / Área <span className="text-red-400">*</span>
            </label>
            <input
              value={dept}
              onChange={e => setDept(e.target.value)}
              className="cetox-input text-sm"
              placeholder="Ej. Laboratorio de Química"
              required
            />
          </div>

          {/* Jefe Inmediato */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: '#64748b' }}>
              Jefe inmediato superior <span className="text-red-400">*</span>
            </label>
            {jefes.length > 0 ? (
              <select
                value={jefe}
                onChange={e => setJefe(e.target.value)}
                className="cetox-input text-sm"
                required
              >
                {jefes.map(j => (
                  <option key={j.id} value={j.nombre}>{j.nombre}</option>
                ))}
              </select>
            ) : (
              <input
                value={jefe}
                onChange={e => setJefe(e.target.value)}
                className="cetox-input text-sm"
                placeholder="Nombre del jefe"
                required
              />
            )}
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="cetox-card p-5">
        <h3 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#4AC3B2' }}>
          Días solicitados <span className="text-red-400">*</span>
        </h3>
        <CalendarioMultiSelect selected={dias} onChange={setDias} />
      </div>

      {/* Tipo vacaciones */}
      <div className="cetox-card p-5 space-y-4">
        <h3 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#4AC3B2' }}>
          Tipo de vacaciones
        </h3>
        <div className="flex flex-wrap gap-3">
          {TIPO_VAC.map(t => (
            <label key={t.value} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="radio"
                name="tipoVac"
                value={t.value}
                checked={tipoVac === t.value}
                onChange={() => setTipoVac(t.value)}
                className="sr-only"
              />
              <span
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  backgroundColor: tipoVac === t.value ? '#13602C' : 'transparent',
                  color:           tipoVac === t.value ? 'white' : '#64748b',
                  border:          tipoVac === t.value ? '1.5px solid #13602C' : '1.5px solid #e2e8f0',
                }}
              >
                {tipoVac === t.value && <span>✓</span>}
                {t.label}
              </span>
            </label>
          ))}
        </div>

        <h3 className="text-xs font-bold tracking-widest uppercase pt-2" style={{ color: '#4AC3B2' }}>
          Tipo de licencia
        </h3>
        <div className="flex flex-wrap gap-3">
          {TIPO_LIC.map(t => (
            <label key={t.value} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="radio"
                name="tipoLic"
                value={t.value}
                checked={tipoLic === t.value}
                onChange={() => setTipoLic(t.value)}
                className="sr-only"
              />
              <span
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  backgroundColor: tipoLic === t.value ? '#4AC3B2' : 'transparent',
                  color:           tipoLic === t.value ? 'white' : '#64748b',
                  border:          tipoLic === t.value ? '1.5px solid #4AC3B2' : '1.5px solid #e2e8f0',
                }}
              >
                {tipoLic === t.value && <span>✓</span>}
                {t.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Delegado + Observaciones */}
      <div className="cetox-card p-5 space-y-4">
        <h3 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#4AC3B2' }}>
          Información adicional
        </h3>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: '#64748b' }}>
            Persona a quien se delega sus funciones
          </label>
          <input
            value={delegado}
            onChange={e => setDelegado(e.target.value)}
            className="cetox-input text-sm"
            placeholder="Nombre del colega que asumirá las funciones"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: '#64748b' }}>
            Observaciones / Pendientes a informar
          </label>
          <textarea
            value={obs}
            onChange={e => setObs(e.target.value)}
            rows={3}
            className="cetox-input text-sm resize-none"
            placeholder="Aquí colocar los pendientes a realizar o algún dato importante que informar"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
          style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#7f1d1d' }}
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={pending || dias.length === 0}
        className="cetox-btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm"
      >
        {pending
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando solicitud…</>
          : <><Send className="h-4 w-4" /> Enviar solicitud ({dias.length} día{dias.length !== 1 ? 's' : ''})</>
        }
      </button>
    </form>
  )
}
