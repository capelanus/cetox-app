'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { Cliente, Ensayo } from '@/generated/prisma/client'
import { crearCotizacion } from '@/app/actions/cotizaciones'
import { toast } from 'sonner'
import { formatMoneda } from '@/lib/format'
import { ContactoFields } from './contacto-fields'
import { MuestraEditor } from './muestra-editor'
import { ObservacionPicker } from './observacion-picker'

interface NuevaCotizacionFormProps {
  clientes: Cliente[]
  ensayos: Ensayo[]
  tipo?: 'NORMAL' | 'ABIERTA'
}

export function NuevaCotizacionForm({ clientes, ensayos, tipo = 'NORMAL' }: NuevaCotizacionFormProps) {
  const [moneda, setMoneda] = useState<'USD' | 'PEN'>('USD')
  const [subtotal, setSubtotal] = useState(0)
  const [itemCount, setItemCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [observaciones, setObservaciones] = useState('')

  function appendObservacion(texto: string) {
    setObservaciones((prev) => (prev.trim() ? `${prev.trim()}\n\n${texto}` : texto))
  }

  const igv = subtotal * 0.18
  const total = subtotal + igv

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (itemCount === 0) { toast.error('Agrega al menos un ensayo'); return }
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await crearCotizacion(formData)
    } catch (e) {
      if ((e as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw e
      toast.error('Error al crear la cotización')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border shadow-sm">
      <input type="hidden" name="tipo" value={tipo} />
      {tipo === 'ABIERTA' && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">Cotización abierta</span>
          <span className="text-amber-600">— se creará directamente en estado Aceptada y será disponible para SETs con costo.</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label>Cliente *</Label>
          <select
            name="clienteId"
            required
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
        <div className="space-y-2">
          <Label>Modalidad de pago *</Label>
          <select
            name="modalidadPago"
            defaultValue="ANTICIPO_50_50"
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="ANTICIPO_50_50">Anticipo 50/50</option>
            <option value="ANTICIPO_100">Anticipo 100%</option>
            <option value="CREDITO_100">Crédito 100%</option>
            <option value="CREDITO_50_50">Crédito 50/50</option>
            <option value="CREDITO_MENSUAL">Crédito mensual</option>
            <option value="CREDITO_QUINCENAL">Crédito quincenal</option>
            <option value="AL_CULMINAR">Al culminar</option>
          </select>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Datos de contacto</h3>
        <ContactoFields />
      </div>

      <div className="space-y-2">
        <Label>Observaciones</Label>
        <ObservacionPicker onSelect={appendObservacion} />
        <textarea
          name="observaciones"
          placeholder="Observaciones adicionales..."
          rows={3}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm resize-y min-h-[80px]"
        />
      </div>

      <div>
        <Label className="text-base font-semibold mb-3 block">Muestras y ensayos</Label>
        <MuestraEditor
          moneda={moneda}
          ensayos={ensayos}
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

      <Button type="submit" style={{ backgroundColor: '#13602C' }} disabled={loading}>
        {loading ? 'Creando...' : 'Crear cotización'}
      </Button>
    </form>
  )
}
