'use client'

import { useTransition } from 'react'
import { CheckCircle2, XCircle, MessageCircle, Loader2 } from 'lucide-react'
import {
  aprobarSolicitudVacaciones,
  rechazarSolicitudVacaciones,
  marcarSolicitudComunicada,
} from '@/app/actions/vacaciones'

type Mode = 'aprobar' | 'comunicar'

interface Props {
  solicitudId: string
  mode: Mode
}

export function SolicitudActions({ solicitudId, mode }: Props) {
  const [pending, start] = useTransition()

  async function run(action: (id: string) => Promise<{ ok: true } | { error: string }>) {
    start(async () => {
      const res = await action(solicitudId)
      if ('error' in res) alert(res.error)
    })
  }

  if (mode === 'comunicar') {
    return (
      <button
        onClick={() => run(marcarSolicitudComunicada)}
        disabled={pending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
        style={{ backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' }}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageCircle className="h-3.5 w-3.5" />}
        Marcar como comunicada
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => run(aprobarSolicitudVacaciones)}
        disabled={pending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
        style={{ backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        Aprobar
      </button>
      <button
        onClick={() => { if (confirm('¿Rechazar esta solicitud?')) run(rechazarSolicitudVacaciones) }}
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
