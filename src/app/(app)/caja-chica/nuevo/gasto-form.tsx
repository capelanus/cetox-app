'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registrarGasto } from '@/app/actions/caja-chica'

const CATEGORIAS = ['Útiles', 'Limpieza', 'Transporte', 'Alimentación', 'Otro']

interface Proveedor {
  id: string
  razonSocial: string
  ruc: string | null
}

interface Props {
  proveedores: Proveedor[]
  today: string
}

export function GastoForm({ proveedores, today }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [provSel, setProvSel] = useState('')

  const provActual = proveedores.find((p) => p.id === provSel)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await registrarGasto(formData)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">

        {/* Fecha */}
        <div className="space-y-2">
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" name="fecha" type="date" defaultValue={today} required />
        </div>

        {/* Concepto */}
        <div className="space-y-2">
          <Label htmlFor="concepto">Concepto <span className="text-red-500">*</span></Label>
          <Input id="concepto" name="concepto" placeholder="Descripción del gasto" required />
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

        {/* Categoría */}
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoría</Label>
          <select
            id="categoria" name="categoria"
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="">Sin categoría</option>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* ── Proveedor ── */}
        <div className="space-y-2">
          <Label htmlFor="proveedorSeleccionado">Proveedor</Label>
          <select
            id="proveedorSeleccionado"
            name="proveedorSeleccionado"
            value={provSel}
            onChange={(e) => setProvSel(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="">Sin proveedor</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.razonSocial}{p.ruc ? ` — ${p.ruc}` : ''}
              </option>
            ))}
            <option value="otro">Otro (no registrado)</option>
          </select>
        </div>

        {/* Proveedor de la BD: mostrar RUC y razón social como referencia */}
        {provSel && provSel !== 'otro' && provActual && (
          <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg text-sm">
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Razón social</p>
              <p className="font-medium text-slate-700">{provActual.razonSocial}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-0.5">RUC</p>
              <p className="font-medium text-slate-700">{provActual.ruc ?? '—'}</p>
            </div>
          </div>
        )}

        {/* Proveedor "Otro": campos libres */}
        {provSel === 'otro' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="otroProveedorNombre">Razón social</Label>
              <Input
                id="otroProveedorNombre" name="otroProveedorNombre"
                placeholder="Nombre del proveedor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otroProveedorRuc">RUC</Label>
              <Input
                id="otroProveedorRuc" name="otroProveedorRuc"
                placeholder="20XXXXXXXXX"
              />
            </div>
          </div>
        )}

        {/* Número de factura */}
        <div className="space-y-2">
          <Label htmlFor="numeroFactura">
            N° de factura / boleta{' '}
            <span className="text-slate-400 font-normal">(opcional)</span>
          </Label>
          <Input
            id="numeroFactura" name="numeroFactura"
            placeholder="Ej. F001-00123"
          />
        </div>

        {/* Notas */}
        <div className="space-y-2">
          <Label htmlFor="notas">
            Notas <span className="text-slate-400 font-normal">(opcional)</span>
          </Label>
          <textarea
            id="notas" name="notas" rows={2}
            placeholder="Información adicional…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm resize-y min-h-[60px]"
          />
        </div>

        {/* Comprobante */}
        <div className="space-y-2">
          <Label htmlFor="comprobante">
            Comprobante{' '}
            <span className="text-slate-400 font-normal">(opcional — foto o PDF)</span>
          </Label>
          <Input
            id="comprobante" name="comprobante"
            type="file" accept="image/*,application/pdf"
            className="cursor-pointer"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending} style={{ backgroundColor: '#1F4E79' }}>
          {isPending ? 'Guardando…' : 'Registrar gasto'}
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
