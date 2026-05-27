'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Copy, FilePlus, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { duplicarCotizacion, nuevaCotizacionDesde, eliminarCotizacion } from '@/app/actions/cotizaciones'
import { toast } from 'sonner'

interface Props {
  id: string
  hasSets: boolean
  numCotizacion: string
}

export function CotizacionActionsMenu({ id, hasSets, numCotizacion }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function runAction(action: () => Promise<void>) {
    startTransition(async () => {
      try {
        await action()
      } catch (e) {
        if ((e as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw e
        toast.error((e as Error).message ?? 'Error al ejecutar la acción')
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
          disabled={isPending}
          onClick={() => runAction(() => eliminarCotizacion(id))}
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Sí, eliminar'}
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
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none transition-colors"
      >
        {isPending
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <MoreHorizontal className="h-4 w-4" />
        }
        Acciones
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => router.push(`/cotizaciones/${id}/editar`)}>
          <Pencil className="h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => runAction(() => duplicarCotizacion(id))}>
          <Copy className="h-4 w-4" />
          Duplicar (mismo N°)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => runAction(() => nuevaCotizacionDesde(id))}>
          <FilePlus className="h-4 w-4" />
          Nueva desde esta
        </DropdownMenuItem>
        {!hasSets && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setConfirming(true)}
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
