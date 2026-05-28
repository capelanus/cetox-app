'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Circle, Loader2, CalendarDays } from 'lucide-react'
import { toggleTareaCompleta } from '@/app/actions/equipos'

interface Tarea {
  id:         string
  tipo:       string
  mes:        number
  anio:       number
  completado: boolean
  fechaReal:  Date | null
  nota:       string | null
  estado:     string
}

interface TipoCfg {
  label: string
  color: string
  bg:    string
}

export function TareaActions({ tarea, tipoCfg }: { tarea: Tarea; tipoCfg: TipoCfg }) {
  const [pending, startTransition] = useTransition()
  const [done, setDone]            = useState(tarea.completado)
  const [fechaReal, setFechaReal]  = useState<Date | null>(tarea.fechaReal)

  function handleToggle() {
    const next = !done
    setDone(next)
    if (next) setFechaReal(new Date())
    else      setFechaReal(null)

    startTransition(async () => {
      try {
        await toggleTareaCompleta(tarea.id, next)
      } catch {
        // revert on error
        setDone(!next)
        setFechaReal(tarea.fechaReal)
      }
    })
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 transition-colors"
      style={{ backgroundColor: done ? 'rgba(34,197,94,0.03)' : 'transparent' }}
    >
      {/* Toggle button */}
      <button
        onClick={handleToggle}
        disabled={pending}
        className="flex-shrink-0 transition-all duration-150 hover:scale-110"
        title={done ? 'Marcar como pendiente' : 'Marcar como completada'}
      >
        {pending ? (
          <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
        ) : done ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400" />
        )}
      </button>

      {/* Type badge */}
      <span
        className="px-2 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0"
        style={{
          backgroundColor: tipoCfg.bg,
          color:           tipoCfg.color,
          fontFamily:      'var(--font-montserrat)',
          textDecoration:  done ? 'line-through' : 'none',
          opacity:         done ? 0.6 : 1,
        }}
      >
        {tipoCfg.label}
      </span>

      {/* Task description */}
      <span
        className="flex-1 text-sm text-slate-700"
        style={{
          fontFamily:     'var(--font-montserrat)',
          textDecoration: done ? 'line-through' : 'none',
          opacity:        done ? 0.5 : 1,
        }}
      >
        {tarea.tipo === 'PREVENTIVO'   && 'Mantenimiento preventivo programado'}
        {tarea.tipo === 'CALIBRACION'  && 'Calibración con proveedor acreditado'}
        {tarea.tipo === 'VERIFICACION' && 'Verificación interna con patrones'}
      </span>

      {/* Completion date */}
      {done && fechaReal && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <CalendarDays className="w-3 h-3 text-green-500" />
          <span className="text-[10px] text-green-600" style={{ fontFamily: 'var(--font-montserrat)' }}>
            {new Date(fechaReal).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
          </span>
        </div>
      )}

      {/* Note */}
      {tarea.nota && (
        <span className="text-[10px] text-slate-400 italic flex-shrink-0 max-w-32 truncate" title={tarea.nota}>
          {tarea.nota}
        </span>
      )}
    </div>
  )
}
