'use client'

import { useTransition } from 'react'
import { toggleProveedorActivo } from '@/app/actions/proveedores'
import { useRouter } from 'next/navigation'

export default function ToggleActivoButton({ id, activo }: { id: string; activo: boolean }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleToggle() {
    if (!confirm(activo ? '¿Desactivar este proveedor?' : '¿Reactivar este proveedor?')) return
    startTransition(async () => {
      await toggleProveedorActivo(id, !activo)
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleToggle}
      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm border font-medium transition-colors disabled:opacity-50 ${
        activo
          ? 'border-red-200 text-red-600 hover:bg-red-50'
          : 'border-green-200 text-green-600 hover:bg-green-50'
      }`}
    >
      {isPending ? '...' : activo ? 'Desactivar' : 'Reactivar'}
    </button>
  )
}
