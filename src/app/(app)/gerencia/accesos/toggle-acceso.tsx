'use client'

import { useTransition, useState } from 'react'
import { toggleAccesoUsuario } from '@/app/actions/gerencia'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface Props {
  usuarioId: string
  nombre:    string
  activo:    boolean
}

export function ToggleAcceso({ usuarioId, nombre, activo }: Props) {
  const [isPending, startTransition] = useTransition()
  const [confirmando, setConfirmando] = useState(false)

  function handleClick() {
    // Si se va a desactivar, pedir confirmación primero
    if (activo && !confirmando) {
      setConfirmando(true)
      return
    }

    setConfirmando(false)
    startTransition(async () => {
      try {
        const res = await toggleAccesoUsuario(usuarioId, !activo)
        toast.success(
          activo
            ? `Acceso desactivado para ${res.nombre}`
            : `Acceso reactivado para ${res.nombre}`,
          { description: activo ? 'El usuario no podrá iniciar sesión.' : 'El usuario puede volver a ingresar.' }
        )
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error al actualizar acceso')
      }
    })
  }

  if (confirmando) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-600 font-medium">¿Desactivar acceso?</span>
        <button
          onClick={handleClick}
          disabled={isPending}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={{ backgroundColor: '#ef4444', color: 'white' }}
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirmar'}
        </button>
        <button
          onClick={() => setConfirmando(false)}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title={activo ? `Desactivar acceso de ${nombre}` : `Reactivar acceso de ${nombre}`}
      className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
      style={{
        backgroundColor: activo ? '#dcfce7' : '#fee2e2',
        color:           activo ? '#16a34a' : '#dc2626',
        border:          `1px solid ${activo ? '#bbf7d0' : '#fecaca'}`,
      }}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        /* Toggle switch visual */
        <span
          className="flex items-center w-7 h-4 rounded-full transition-all duration-300 flex-shrink-0"
          style={{ backgroundColor: activo ? '#16a34a' : '#d1d5db' }}
        >
          <span
            className="w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300 ml-0.5"
            style={{ transform: activo ? 'translateX(12px)' : 'translateX(0)' }}
          />
        </span>
      )}
      {activo ? 'Activo' : 'Desactivado'}
    </button>
  )
}
