'use client'

import { useState, useTransition } from 'react'
import { Award, Download, Loader2, ArrowLeft, ChevronDown } from 'lucide-react'
import { emitirCertificado, type EmitirCertificadoInput } from '@/app/actions/certificados'
import Link from 'next/link'

interface Empleado {
  id:     string
  nombre: string
  cargo:  string | null
  area:   string | null
}

interface Props {
  empleados: Empleado[]
}

type Tipo = EmitirCertificadoInput['tipoReconocimiento']

const TIPOS: { value: Tipo; label: string }[] = [
  { value: 'participación', label: 'Participación' },
  { value: 'desempeño',     label: 'Desempeño' },
  { value: 'logro',         label: 'Logro' },
]

function todayISOEs(): string {
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  const d = new Date()
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`
}

export function CertificadoForm({ empleados }: Props) {
  const [pending, start] = useTransition()
  const [empleadoId, setEmpleadoId] = useState('')
  const [nombre, setNombre]         = useState('')
  const [tipo, setTipo]             = useState<Tipo>('participación')
  const [motivo, setMotivo]         = useState('')
  const [lugar, setLugar]           = useState('CETOX LAB — Lima, Perú')
  const [fecha, setFecha]           = useState(todayISOEs())
  const [error, setError]           = useState('')
  const [resultUrl, setResultUrl]   = useState<string | null>(null)

  function onEmpleadoChange(id: string) {
    setEmpleadoId(id)
    const e = empleados.find(x => x.id === id)
    if (e && !nombre) setNombre(e.nombre)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setResultUrl(null)
    if (!empleadoId) { setError('Selecciona un empleado.'); return }
    start(async () => {
      const res = await emitirCertificado({
        empleadoId,
        nombre,
        tipoReconocimiento: tipo,
        motivo,
        lugar,
        fecha,
      })
      if ('error' in res) setError(res.error)
      else setResultUrl(res.url)
    })
  }

  if (resultUrl) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-5 py-16 rounded-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(19,96,44,0.05), rgba(74,195,178,0.05))', border: '1.5px solid rgba(19,96,44,0.15)' }}
      >
        <div
          className="flex items-center justify-center w-20 h-20 rounded-full"
          style={{ background: 'linear-gradient(135deg, #13602C, #004d1c)' }}
        >
          <Award className="h-10 w-10 text-white" />
        </div>
        <div className="text-center">
          <p className="font-bold text-xl" style={{ color: '#13602C', fontFamily: 'var(--font-oswald)', letterSpacing: '0.03em' }}>
            ¡CERTIFICADO EMITIDO!
          </p>
          <p className="text-sm mt-2" style={{ color: '#64748b' }}>
            Guardado en el perfil del empleado y listo para descarga.
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href={resultUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#13602C' }}
          >
            <Download className="h-4 w-4" />
            Descargar PDF
          </a>
          <button
            onClick={() => { setResultUrl(null); setEmpleadoId(''); setNombre(''); setMotivo('') }}
            className="cetox-btn-secondary text-sm px-5 py-2.5"
          >
            Emitir otro
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Empleado */}
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#64748b' }}>
          Empleado <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <select
            value={empleadoId}
            onChange={e => onEmpleadoChange(e.target.value)}
            className="cetox-input text-sm appearance-none pr-8"
            required
          >
            <option value="">Selecciona un empleado…</option>
            {empleados.map(e => (
              <option key={e.id} value={e.id}>
                {e.nombre}{e.area ? ` — ${e.area}` : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-slate-400" />
        </div>
        <p className="text-[10px] mt-1" style={{ color: '#94a3b8' }}>
          El certificado se guardará en sus documentos.
        </p>
      </div>

      {/* Nombre como aparecerá en el certificado */}
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#64748b' }}>
          Nombre como aparecerá en el certificado <span className="text-red-400">*</span>
        </label>
        <input
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          className="cetox-input text-sm"
          placeholder="Andrea Castillo Blanco"
          required
        />
        <p className="text-[10px] mt-1" style={{ color: '#94a3b8' }}>
          Puedes ajustarlo (ej. añadir título profesional).
        </p>
      </div>

      {/* Tipo de reconocimiento */}
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#64748b' }}>
          Tipo de reconocimiento <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2">
          {TIPOS.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTipo(t.value)}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-all"
              style={{
                backgroundColor: tipo === t.value ? '#13602C' : 'transparent',
                color:           tipo === t.value ? 'white' : '#64748b',
                borderColor:     tipo === t.value ? '#13602C' : '#e2e8f0',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Motivo */}
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#64748b' }}>
          Curso, evento, capacitación o motivo <span className="text-red-400">*</span>
        </label>
        <textarea
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          className="cetox-input text-sm"
          placeholder="el Curso Internacional de Buenas Prácticas de Laboratorio 2026"
          rows={2}
          required
        />
        <p className="text-[10px] mt-1" style={{ color: '#94a3b8' }}>
          Iniciar con artículo (&ldquo;el Curso…&rdquo;, &ldquo;la Capacitación…&rdquo;, &ldquo;el Taller…&rdquo;).
        </p>
      </div>

      {/* Lugar y fecha */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#64748b' }}>
            Lugar <span className="text-red-400">*</span>
          </label>
          <input
            value={lugar}
            onChange={e => setLugar(e.target.value)}
            className="cetox-input text-sm"
            placeholder="Lima, Perú"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#64748b' }}>
            Fecha <span className="text-red-400">*</span>
          </label>
          <input
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="cetox-input text-sm"
            placeholder="15 de marzo de 2026"
            required
          />
        </div>
      </div>

      {error && (
        <div
          className="rounded-lg border px-3 py-2 text-xs"
          style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#7f1d1d' }}
        >
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Link
          href="/rrhh/contratos"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending || !empleadoId || !motivo.trim()}
          className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #13602C, #004d1c)' }}
        >
          {pending
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando…</>
            : <><Award className="h-4 w-4" /> Emitir certificado</>
          }
        </button>
      </div>
    </form>
  )
}
