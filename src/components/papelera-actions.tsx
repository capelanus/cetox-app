'use client'

import { useTransition } from 'react'
import { RotateCcw, Trash2 } from 'lucide-react'
import { restaurarCotizacion, eliminarDefinitivamente } from '@/app/actions/cotizaciones'

interface Props {
  id: string
}

export function PapeleraActions({ id }: Props) {
  const [pendingRestore, startRestore] = useTransition()
  const [pendingDelete,  startDelete]  = useTransition()

  function handleRestore() {
    startRestore(() => restaurarCotizacion(id))
  }

  function handleDelete() {
    if (!confirm('¿Eliminar definitivamente? Esta acción no se puede deshacer.')) return
    startDelete(() => eliminarDefinitivamente(id))
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleRestore}
        disabled={pendingRestore}
        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        style={{ color: '#13602C', backgroundColor: '#DCF0E4' }}
        title="Restaurar"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        {pendingRestore ? 'Restaurando…' : 'Restaurar'}
      </button>
      <button
        onClick={handleDelete}
        disabled={pendingDelete}
        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors text-red-600 hover:bg-red-50 disabled:opacity-50"
        title="Eliminar definitivamente"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {pendingDelete ? 'Eliminando…' : 'Eliminar'}
      </button>
    </div>
  )
}
