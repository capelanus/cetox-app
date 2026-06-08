'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, XCircle, MessageCircle, Loader2, Pencil } from 'lucide-react'
import {
  aprobarSolicitudVacaciones,
  rechazarSolicitudVacaciones,
  marcarSolicitudComunicada,
} from '@/app/actions/vacaciones'

interface AprobarProps {
  mode: 'aprobar'
  solicitudId: string
}

interface ComunicarProps {
  mode: 'comunicar'
  solicitudId: string
  diasOriginales: string[]   // todos los días aprobados
}

type Props = AprobarProps | ComunicarProps

export function SolicitudActions(props: Props) {
  const [pending, start] = useTransition()
  const [editing, setEditing] = useState(false)
  const [diasFinales, setDiasFinales] = useState<string[]>(
    props.mode === 'comunicar' ? props.diasOriginales : [],
  )

  async function run<T extends () => Promise<{ ok: true } | { error: string }>>(action: T) {
    start(async () => {
      const res = await action()
      if ('error' in res) alert(res.error)
    })
  }

  // ── Modo: marcar como comunicada (con opción de editar días) ──────────────
  if (props.mode === 'comunicar') {
    const { solicitudId, diasOriginales } = props

    if (editing) {
      const removidos = diasOriginales.length - diasFinales.length
      return (
        <div className="w-full mt-2 p-3 rounded-lg border border-blue-200 bg-blue-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-blue-900">
              Días tomados ({diasFinales.length}/{diasOriginales.length})
            </p>
            {removidos > 0 && (
              <p className="text-[10px] font-medium text-amber-700">
                ↩ {removidos} día(s) volverán al balance
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {diasOriginales.map(d => {
              const checked = diasFinales.includes(d)
              return (
                <label key={d} className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded cursor-pointer transition-colors ${checked ? 'bg-white border border-blue-200' : 'bg-slate-100 text-slate-400 line-through'}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setDiasFinales(prev =>
                        prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort(),
                      )
                    }}
                    className="w-3.5 h-3.5"
                  />
                  <span className="font-mono">{d}</span>
                </label>
              )
            })}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => run(() => marcarSolicitudComunicada(solicitudId, diasFinales))}
              disabled={pending || diasFinales.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: '#13602C', color: 'white' }}
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Confirmar comunicación
            </button>
            <button
              onClick={() => { setEditing(false); setDiasFinales(diasOriginales) }}
              disabled={pending}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100"
            >
              Cancelar
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => run(() => marcarSolicitudComunicada(solicitudId))}
          disabled={pending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
          style={{ backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' }}
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageCircle className="h-3.5 w-3.5" />}
          Marcar como comunicada
        </button>
        <button
          onClick={() => setEditing(true)}
          disabled={pending}
          title="Modificar días tomados (fuerza mayor)"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar días
        </button>
      </div>
    )
  }

  // ── Modo: aprobar / rechazar (jefe) ──────────────────────────────────────
  const { solicitudId } = props

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => run(() => aprobarSolicitudVacaciones(solicitudId))}
        disabled={pending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
        style={{ backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        Aprobar
      </button>
      <button
        onClick={() => { if (confirm('¿Rechazar esta solicitud?')) run(() => rechazarSolicitudVacaciones(solicitudId)) }}
        disabled={pending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
        style={{ backgroundColor: '#fee2e2', color: '#7f1d1d', border: '1px solid #fca5a5' }}
      >
        <XCircle className="h-3.5 w-3.5" />
        Rechazar
      </button>
    </div>
  )
}
