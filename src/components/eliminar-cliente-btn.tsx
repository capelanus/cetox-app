'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface Props {
  action: () => Promise<void>
  nombre: string
}

export function EliminarClienteBtn({ action, nombre }: Props) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!confirm) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-400"
        onClick={() => setConfirm(true)}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Eliminar
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
      <span className="text-sm text-red-700">¿Eliminar <strong>{nombre}</strong>?</span>
      <button
        type="button"
        className="text-xs text-slate-500 hover:text-slate-700 px-2"
        onClick={() => setConfirm(false)}
      >
        Cancelar
      </button>
      <form action={async () => { setLoading(true); await action() }}>
        <Button
          type="submit"
          size="sm"
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white h-7 text-xs"
        >
          {loading ? 'Eliminando...' : 'Sí, eliminar'}
        </Button>
      </form>
    </div>
  )
}
