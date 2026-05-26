'use client'

import { useState, useTransition } from 'react'
import { aprobarCotizacionProveedor, rechazarCotizacionProveedor } from '@/app/actions/cotizaciones-proveedor'
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  cotId: string
}

export default function AprobacionControls({ cotId }: Props) {
  const [motivo, setMotivo]       = useState('')
  const [showRechazo, setShowRechazo] = useState(false)
  const [isPending, startTransition]  = useTransition()
  const router = useRouter()

  function handleAprobar() {
    if (!confirm('¿Aprobar esta cotización? Se notificará a Operaciones para emitir la OC.')) return
    startTransition(async () => {
      await aprobarCotizacionProveedor(cotId, new FormData())
      router.refresh()
    })
  }

  function handleRechazar() {
    if (!motivo.trim()) { alert('Indica el motivo del rechazo.'); return }
    if (!confirm('¿Rechazar esta cotización?')) return
    const fd = new FormData()
    fd.set('motivo', motivo)
    startTransition(async () => {
      await rechazarCotizacionProveedor(cotId, fd)
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          disabled={isPending}
          onClick={handleAprobar}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" />
          Aprobar
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => setShowRechazo(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          <XCircle className="w-4 h-4" />
          Rechazar
          {showRechazo ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
        </button>
      </div>

      {showRechazo && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Motivo del rechazo (requerido)..."
            className="flex-1 border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <button
            type="button"
            disabled={isPending || !motivo.trim()}
            onClick={handleRechazar}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Guardando...' : 'Confirmar rechazo'}
          </button>
        </div>
      )}
    </div>
  )
}
