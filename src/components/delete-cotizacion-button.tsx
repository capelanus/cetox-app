'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, AlertTriangle } from 'lucide-react'
import { eliminarCotizacion } from '@/app/actions/cotizaciones'
import { toast } from 'sonner'

interface Props {
  id: string
  hasSets: boolean
  numCotizacion: string
}

export function DeleteCotizacionButton({ id, hasSets, numCotizacion }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()

  if (hasSets) return null // no mostrar si hay SETs

  function handleDelete() {
    startTransition(async () => {
      try {
        await eliminarCotizacion(id)
      } catch (e) {
        if ((e as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw e
        toast.error((e as Error).message ?? 'Error al eliminar la cotización')
        setConfirming(false)
      }
    })
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5">
        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
        <span className="text-sm text-red-700 font-medium">
          ¿Eliminar {numCotizacion}?
        </span>
        <Button
          size="sm"
          variant="destructive"
          className="h-7 text-xs px-2"
          disabled={pending}
          onClick={handleDelete}
        >
          {pending ? 'Eliminando…' : 'Sí, eliminar'}
        </Button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-slate-500 hover:text-slate-700 ml-1"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
      onClick={() => setConfirming(true)}
    >
      <Trash2 className="h-3 w-3 mr-1" />
      Eliminar
    </Button>
  )
}
