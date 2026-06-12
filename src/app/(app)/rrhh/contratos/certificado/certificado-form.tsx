'use client'

import { useState } from 'react'
import { Award, Download, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { CalendarioMultiSelect } from '@/app/(app)/vacaciones/calendario'

type Tipo = 'participación' | 'desempeño' | 'logro'

const TIPOS: { value: Tipo; label: string }[] = [
  { value: 'participación', label: 'Participación' },
  { value: 'desempeño',     label: 'Desempeño' },
  { value: 'logro',         label: 'Logro' },
]

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function formatDayPreview(dias: string[]): string {
  if (dias.length === 0) return ''
  const sorted = [...dias].sort()
  const parts = sorted.map(s => {
    const [y, m, d] = s.split('-').map(Number)
    return { y, m: m - 1, d }
  })
  if (parts.length === 1) {
    const f = parts[0]
    return `el día ${f.d} de ${MESES[f.m]} de ${f.y}`
  }
  // Agrupar por (y,m)
  const grupos = new Map<string, number[]>()
  for (const f of parts) {
    const k = `${f.y}-${f.m}`
    if (!grupos.has(k)) grupos.set(k, [])
    grupos.get(k)!.push(f.d)
  }
  const tramos: string[] = []
  for (const [k, dds] of grupos) {
    const [y, m] = k.split('-').map(Number)
    const list = dds.length === 1 ? `${dds[0]}` :
                 dds.length === 2 ? `${dds[0]} y ${dds[1]}` :
                 `${dds.slice(0,-1).join(', ')} y ${dds[dds.length-1]}`
    tramos.push(`${list} de ${MESES[m]} de ${y}`)
  }
  const phrase = tramos.length === 1 ? tramos[0] :
                 tramos.length === 2 ? `${tramos[0]} y ${tramos[1]}` :
                 `${tramos.slice(0,-1).join(', ')} y ${tramos[tramos.length-1]}`
  return `los días ${phrase}`
}

export function CertificadoForm() {
  const [busy, setBusy]           = useState(false)
  const [nombre, setNombre]       = useState('')
  const [tipo, setTipo]           = useState<Tipo>('participación')
  const [motivo, setMotivo]       = useState('')
  const [lugar, setLugar]         = useState('CETOX LAB — Lima, Perú')
  const [dias, setDias]           = useState<string[]>([])
  const [horas, setHoras]         = useState('')
  const [expositor, setExpositor] = useState('')
  const [error, setError]         = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const horasNum = Number(horas)
      const res = await fetch('/api/certificados/generar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          nombre, tipoReconocimiento: tipo, motivo, lugar, dias,
          horas: Number.isFinite(horasNum) && horasNum > 0 ? horasNum : undefined,
          expositor,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: 'Error generando el PDF' }))
        setError(j.error ?? 'Error desconocido')
        return
      }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      const slug = nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
      a.download = `certificado-${slug}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError('Error de red.')
    } finally {
      setBusy(false)
    }
  }

  const canSubmit = nombre.trim() && motivo.trim() && lugar.trim() && dias.length > 0

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Nombre */}
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#64748b' }}>
          Nombre como aparecerá en el certificado <span className="text-red-400">*</span>
        </label>
        <input
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          className="cetox-input text-sm"
          placeholder="Ej. Dra. Andrea Castillo Blanco"
          required
          autoFocus
        />
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

      {/* Lugar */}
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#64748b' }}>
          Lugar <span className="text-red-400">*</span>
        </label>
        <input
          value={lugar}
          onChange={e => setLugar(e.target.value)}
          className="cetox-input text-sm"
          required
        />
      </div>

      {/* Calendario de días */}
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#64748b' }}>
          Día(s) del evento <span className="text-red-400">*</span>
        </label>
        <div className="rounded-xl border p-3" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          <CalendarioMultiSelect selected={dias} onChange={setDias} />
        </div>
        {dias.length > 0 && (
          <p className="text-[11px] mt-1.5" style={{ color: '#13602C' }}>
            <strong>{dias.length} día{dias.length > 1 ? 's' : ''}:</strong> {formatDayPreview(dias)}
          </p>
        )}
      </div>

      {/* Horas + Expositor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#64748b' }}>
            Horas académicas
          </label>
          <input
            type="number"
            min={1}
            step={1}
            value={horas}
            onChange={e => setHoras(e.target.value)}
            className="cetox-input text-sm"
            placeholder="Ej. 8"
          />
          <p className="text-[10px] mt-1" style={{ color: '#94a3b8' }}>
            Opcional. Se añade al texto si la indicas.
          </p>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#64748b' }}>
            Nombre del expositor
          </label>
          <input
            value={expositor}
            onChange={e => setExpositor(e.target.value)}
            className="cetox-input text-sm"
            placeholder="Ej. Dr. Juan Pérez"
          />
          <p className="text-[10px] mt-1" style={{ color: '#94a3b8' }}>
            Aparecerá encima de la etiqueta &ldquo;Expositor&rdquo;. Opcional.
          </p>
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
          disabled={busy || !canSubmit}
          className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #13602C, #004d1c)' }}
        >
          {busy
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando…</>
            : <><Download className="h-4 w-4" /> Descargar certificado</>
          }
        </button>
      </div>

      <p className="text-[10px] pt-1" style={{ color: '#94a3b8' }}>
        <Award className="inline h-3 w-3 mr-0.5" />
        El PDF se descargará automáticamente. No se guarda copia en el sistema.
      </p>
    </form>
  )
}
