'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { Cliente, Ensayo } from '@/generated/prisma/client'
import { editarCotizacion } from '@/app/actions/cotizaciones'
import { toast } from 'sonner'
import { formatMoneda } from '@/lib/format'
import { ContactoFields } from './contacto-fields'
import { MuestraEditor, type InitialMuestra } from './muestra-editor'

interface CotizacionData {
  id: string
  moneda: string
  clienteId: string
  observaciones: string | null
  contactoNombre: string | null
  contactoEmail: string | null
  contactoTelefono: string | null
  contactoRuc: string | null
  formaContacto: string | null
  fechaContacto: string | null
  horaContacto: string | null
  paisOrigen: string | null
  muestras: {
    nombre: string
    orden: number
    indicacionQ?: string | null
    indicacionB?: string | null
    indicacionM?: string | null
    items: { ensayoId: string; costo: number; tiempoEntregaDias: number; ensayo: Ensayo }[]
  }[]
  items: { ensayoId: string; costo: number; tiempoEntregaDias: number; ensayo: Ensayo }[]
}

interface Props {
  cotizacion: CotizacionData
  clientes: Cliente[]
  ensayos: Ensayo[]
}

export function EditarCotizacionForm({ cotizacion, clientes, ensayos }: Props) {
  const [moneda, setMoneda] = useState<'USD' | 'PEN'>(cotizacion.moneda as 'USD' | 'PEN')
  const [loading, setLoading] = useState(false)

  // Build initialMuestras: prefer structured muestras, fall back to legacy flat items
  const initialMuestras: InitialMuestra[] = cotizacion.muestras.length > 0
    ? cotizacion.muestras
        .slice()
        .sort((a, b) => a.orden - b.orden)
        .map((m) => ({
          nombre: m.nombre,
          indicacionQ: m.indicacionQ,
          indicacionB: m.indicacionB,
          indicacionM: m.indicacionM,
          items: m.items,
        }))
    : cotizacion.items.length > 0
      ? [{ nombre: 'Muestra 1', items: cotizacion.items }]
      : []

  const initialSubtotal = cotizacion.muestras.length > 0
    ? cotizacion.muestras.flatMap((m) => m.items).reduce((s, it) => s + it.costo, 0)
    : cotizacion.items.reduce((s, it) => s + it.costo, 0)

  const [subtotal, setSubtotal] = useState(initialSubtotal)
  const [itemCount, setItemCount] = useState(
    cotizacion.muestras.length > 0
      ? cotizacion.muestras.flatMap((m) => m.items).length
      : cotizacion.items.length
  )

  const igv = subtotal * 0.18
  const total = subtotal + igv

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (itemCount === 0) { toast.error('Agrega al menos un ensayo'); return }
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await editarCotizacion(cotizacion.id, formData)
    } catch (e) {
      if ((e as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw e
      toast.error('Error al guardar los cambios')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border shadow-sm">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cliente *</Label>
          <select
            name="clienteId"
            required
            defaultValue={cotizacion.clienteId}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="">Seleccionar...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.razonSocial} — {c.ruc}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Moneda *</Label>
          <select
            name="moneda"
            value={moneda}
            onChange={(e) => setMoneda(e.target.value as 'USD' | 'PEN')}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="USD">USD (Dólares)</option>
            <option value="PEN">PEN (Soles)</option>
          </select>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Datos de contacto</h3>
        <ContactoFields defaults={cotizacion} />
      </div>

      <div className="space-y-2">
        <Label>Observaciones</Label>
        <textarea
          name="observaciones"
          defaultValue={cotizacion.observaciones ?? ''}
          placeholder="Observaciones adicionales..."
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm resize-y min-h-[80px]"
        />
      </div>

      <div>
        <Label className="text-base font-semibold mb-3 block">Muestras y ensayos</Label>
        <MuestraEditor
          moneda={moneda}
          ensayos={ensayos}
          initialMuestras={initialMuestras}
          onChange={(s, count) => { setSubtotal(s); setItemCount(count) }}
        />
      </div>

      {itemCount > 0 && (
        <div className="border-t pt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal</span>
            <span>{formatMoneda(subtotal, moneda)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">IGV (18%)</span>
            <span>{formatMoneda(igv, moneda)}</span>
          </div>
          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span>{formatMoneda(total, moneda)}</span>
          </div>
        </div>
      )}

      <Button type="submit" style={{ backgroundColor: '#1F4E79' }} disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    </form>
  )
}
