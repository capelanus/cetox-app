'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registrarIngreso } from '@/app/actions/caja-chica'
import { ArrowDownCircle } from 'lucide-react'

interface Props {
  today: string
}

export function IngresoForm({ today }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await registrarIngreso(formData)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
        <ArrowDownCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
        <p>
          Registra aquí el dinero entregado a caja chica (reembolsos, asignaciones iniciales, etc.).
          Este monto aumentará el saldo disponible.
        </p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">

        {/* Fecha */}
        <div className="space-y-2">
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" name="fecha" type="date" defaultValue={today} required />
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <Label htmlFor="descripcion">
            Descripción <span className="text-red-500">*</span>
          </Label>
          <Input
            id="descripcion" name="descripcion"
            placeholder="Ej. Asignación mensual, Reembolso de gerencia…"
            required
          />
        </div>

        {/* Monto + Moneda */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="monto">Monto <span className="text-red-500">*</span></Label>
            <Input
              id="monto" name="monto" type="number"
              step="0.01" min="0.01" placeholder="0.00" required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="moneda">Moneda</Label>
            <select
              id="moneda" name="moneda" defaultValue="PEN"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="PEN">Soles (PEN)</option>
              <option value="USD">Dólares (USD)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="submit" disabled={isPending}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isPending ? 'Registrando…' : 'Registrar ingreso'}
        </Button>
        <Button
          type="button" variant="outline" disabled={isPending}
          onClick={() => router.push('/caja-chica')}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
