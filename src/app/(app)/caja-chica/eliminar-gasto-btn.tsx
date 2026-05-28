'use client'

import { Trash2 } from 'lucide-react'
import { eliminarGasto } from '@/app/actions/caja-chica'
import { useTransition } from 'react'

export function EliminarGastoBtn({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('¿Eliminar este gasto?')) return
    startTransition(async () => {
      await eliminarGasto(id)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      title="Eliminar gasto"
      className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-40"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
