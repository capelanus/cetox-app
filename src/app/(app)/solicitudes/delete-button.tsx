'use client'

import { useTransition } from 'react'
import { eliminarRequerimiento } from '@/app/actions/requerimientos'
import { Trash2 } from 'lucide-react'

interface Props {
  id: string
  variant?: 'icon' | 'full'
}

export default function DeleteRequerimientoButton({ id, variant = 'icon' }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    const msg = variant === 'full'
      ? '¿Eliminar esta solicitud? Esta acción no se puede deshacer.'
      : '¿Eliminar esta solicitud?'
    if (!confirm(msg)) return
    startTransition(async () => {
      await eliminarRequerimiento(id)
    })
  }

  if (variant === 'full') {
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" />
        {isPending ? 'Eliminando...' : 'Eliminar'}
      </button>
    )
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      title="Eliminar solicitud"
      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
