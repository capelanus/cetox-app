'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { resolverPeticion } from '@/app/actions/peticiones'
import { toast } from 'sonner'

interface Props {
  peticionId:       string
  montoSolicitado:  number
  moneda:           string
}

export function AprobacionButtons({ peticionId, montoSolicitado, moneda }: Props) {
  const [isPending, startTransition] = useTransition()
  const [modo, setModo]              = useState<'idle' | 'aprobar' | 'rechazar'>('idle')
  const [monto, setMonto]            = useState(montoSolicitado.toString())
  const [motivo, setMotivo]          = useState('')

  function handleAprobar() {
    const m = parseFloat(monto)
    if (isNaN(m) || m <= 0) { toast.error('Monto inválido'); return }
    startTransition(async () => {
      try {
        await resolverPeticion(peticionId, 'APROBAR', m)
        toast.success('Petición aprobada. Se creó el ingreso en Caja Chica.')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error al aprobar')
      }
    })
  }

  function handleRechazar() {
    if (!motivo.trim()) { toast.error('Ingresa el motivo de rechazo'); return }
    startTransition(async () => {
      try {
        await resolverPeticion(peticionId, 'RECHAZAR', undefined, motivo)
        toast.success('Petición rechazada.')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error al rechazar')
      }
    })
  }

  if (modo === 'aprobar') {
    return (
      <div className="flex flex-col gap-2 min-w-[220px]">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Monto a aprobar ({moneda}):</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={monto}
            onChange={e => setMonto(e.target.value)}
            className="w-24 h-7 rounded border border-slate-300 px-2 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAprobar}
            disabled={isPending}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
            Confirmar aprobación
          </button>
          <button onClick={() => setModo('idle')} disabled={isPending} className="text-xs text-slate-400 hover:text-slate-600">
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  if (modo === 'rechazar') {
    return (
      <div className="flex flex-col gap-2 min-w-[240px]">
        <textarea
          rows={2}
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          placeholder="Motivo de rechazo…"
          className="w-full rounded border border-slate-300 px-2 py-1 text-xs resize-none"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleRechazar}
            disabled={isPending}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-700 border border-red-300 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
            Confirmar rechazo
          </button>
          <button onClick={() => setModo('idle')} disabled={isPending} className="text-xs text-slate-400 hover:text-slate-600">
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setModo('aprobar')}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-colors"
      >
        <CheckCircle className="h-3.5 w-3.5" />
        Aprobar
      </button>
      <button
        onClick={() => setModo('rechazar')}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-colors"
      >
        <XCircle className="h-3.5 w-3.5" />
        Rechazar
      </button>
    </div>
  )
}
