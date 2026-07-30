'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserCheck } from 'lucide-react'
import { asignarODA } from '@/app/actions/oda'

interface Analista { id: string; nombre: string }

export function OdaAsignacion({ odaId, asignadoAId, asignadoNombre, analistas, esJefe }: {
  odaId: string
  asignadoAId: string | null
  asignadoNombre: string | null
  analistas: Analista[]
  esJefe: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()

  if (esJefe) {
    return (
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
        <UserCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <span className="text-sm text-slate-600">Asignar a:</span>
        <select
          className="h-8 rounded-md border border-input bg-white px-2 text-sm shadow-sm disabled:opacity-50"
          value={asignadoAId ?? ''}
          disabled={pending}
          onChange={(e) => start(async () => { await asignarODA(odaId, e.target.value); router.refresh() })}
        >
          <option value="">— Sin asignar —</option>
          {analistas.map((a) => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select>
      </div>
    )
  }

  if (!asignadoNombre) return null
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <UserCheck className="w-4 h-4 text-slate-400" />
      Asignado a: <span className="font-medium text-slate-700">{asignadoNombre}</span>
    </div>
  )
}
