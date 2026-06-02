'use client'

import { useTransition } from 'react'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { autorizarSolicitudVacaciones, rechazarSolicitudVacaciones } from '@/app/actions/vacaciones'

interface Props {
  solicitudId: string
}

export function SolicitudActions({ solicitudId }: Props) {
  const [pending, start] = useTransition()

  function handleAutorizar() {
    start(() => autorizarSolicitudVacaciones(solicitudId))
  }
  function handleRechazar() {
    if (!confirm('¿Rechazar esta solicitud?')) return
    start(() => rechazarSolicitudVacaciones(solicitudId))
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleAutorizar}
        disabled={pending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
        style={{ backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        Autorizar
      </button>
      <button
        onClick={handleRechazar}
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
