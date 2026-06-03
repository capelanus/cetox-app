'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registrarGasto } from '@/app/actions/caja-chica'

const CAJAS = [
  '102102 CAJA CHICA DE CETOX',
]

const TIPOS_DOCUMENTO = [
  'Factura',
  'Boleta',
  'Recibo por honorarios',
  'Nota de crédito',
  'Nota de débito',
  'Ticket',
  'Otro',
]

const CONDICIONES = ['Contado', 'Crédito']

const MONEDAS = [
  { value: 'PEN', label: 'Soles (PEN)' },
  { value: 'USD', label: 'Dólares (USD)' },
]

const CENTROS_COSTO: string[] = []
const CUENTAS_GASTO: string[] = []

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

  const [ruc,            setRuc]            = useState('')
  const [proveedorNombre, setProveedorNombre] = useState('')
  const [proveedorId,    setProveedorId]    = useState<string | null>(null)
  const [moneda,         setMoneda]         = useState('PEN')
  const [afecto,         setAfecto]         = useState(false)
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Auto-buscar proveedor por RUC ──────────────────────────────────────
  useEffect(() => {
    if (lookupTimer.current) clearTimeout(lookupTimer.current)
    const cleanRuc = ruc.trim()
    if (!cleanRuc) {
      setProveedorId(null)
      return
    }

    lookupTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/proveedores/by-ruc?ruc=${encodeURIComponent(cleanRuc)}`)
        if (!res.ok) return
        const { proveedor } = await res.json()
        if (proveedor) {
          setProveedorId(proveedor.id)
          setProveedorNombre(proveedor.razonSocial)
        } else {
          setProveedorId(null)
        }
      } catch { /* ignore */ }
    }, 400)

    return () => { if (lookupTimer.current) clearTimeout(lookupTimer.current) }
  }, [ruc])

  // ── Selección manual de proveedor de la lista ───────────────────────────
  function handleSelectProveedor(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    if (!id) {
      setProveedorId(null)
      return
    }
    const p = proveedores.find((x) => x.id === id)
    if (p) {
      setProveedorId(p.id)
      setProveedorNombre(p.razonSocial)
      setRuc(p.ruc ?? '')
    }
  }

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

        {/* 1. Caja */}
        <div className="space-y-2">
          <Label htmlFor="caja">Caja <span className="text-red-500">*</span></Label>
          <select
            id="caja" name="caja" defaultValue={CAJAS[0]}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            required
          >
            {CAJAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* 2-3. Fecha proceso + Nº Comprobante */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha proceso <span className="text-red-500">*</span></Label>
            <Input id="fecha" name="fecha" type="date" defaultValue={today} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="numComprobante">N° Comprobante</Label>
            <Input id="numComprobante" name="numComprobante" placeholder="Ej. C-00123" />
          </div>
        </div>

        {/* 4. RUC + Proveedor */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ruc">RUC</Label>
            <Input
              id="ruc" name="ruc"
              value={ruc}
              onChange={(e) => setRuc(e.target.value)}
              placeholder="20XXXXXXXXX"
              maxLength={11}
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="proveedorSeleccionado">Proveedor</Label>
            <select
              id="proveedorSeleccionado"
              name="proveedorSeleccionado"
              value={proveedorId ?? ''}
              onChange={handleSelectProveedor}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="">— Sin proveedor / libre —</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.razonSocial}{p.ruc ? ` — ${p.ruc}` : ''}
                </option>
              ))}
            </select>
            {!proveedorId && ruc && (
              <Input
                name="proveedorNombre"
                value={proveedorNombre}
                onChange={(e) => setProveedorNombre(e.target.value)}
                placeholder="Nombre del proveedor (no registrado)"
                className="mt-2"
              />
            )}
            {proveedorId && (
              <p className="text-xs text-emerald-600 font-medium">
                ✓ {proveedorNombre}
              </p>
            )}
          </div>
        </div>

        {/* 5-7. Tipo documento + Serie + Número */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tipoDocumento">Tipo de documento</Label>
            <select
              id="tipoDocumento" name="tipoDocumento"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="">—</option>
              {TIPOS_DOCUMENTO.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="serie">Serie</Label>
            <Input id="serie" name="serie" placeholder="Ej. F001" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="numero">Número</Label>
            <Input id="numero" name="numero" placeholder="Ej. 00000123" />
          </div>
        </div>

        {/* 8-9. Fecha emisión + Fecha vencimiento */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fechaEmision">Fecha emisión</Label>
            <Input id="fechaEmision" name="fechaEmision" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fechaVencimiento">Fecha vencimiento</Label>
            <Input id="fechaVencimiento" name="fechaVencimiento" type="date" />
          </div>
        </div>

        {/* 10-12. Condición + Moneda + Tipo de cambio */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="condicion">Condición</Label>
            <select
              id="condicion" name="condicion"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="">—</option>
              {CONDICIONES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="moneda">Moneda</Label>
            <select
              id="moneda" name="moneda"
              value={moneda}
              onChange={(e) => setMoneda(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              {MONEDAS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipoCambio">Tipo de cambio</Label>
            <Input
              id="tipoCambio" name="tipoCambio" type="number"
              step="0.0001" min="0" placeholder={moneda === 'USD' ? '3.75' : '1'}
              defaultValue={moneda === 'USD' ? '' : '1'}
            />
          </div>
        </div>

        {/* 13. Glosa */}
        <div className="space-y-2">
          <Label htmlFor="glosa">Glosa <span className="text-red-500">*</span></Label>
          <Input id="glosa" name="glosa" placeholder="Descripción / concepto del gasto" required />
        </div>

        {/* 14-15. Centro Costo + Cta Gasto */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="centroCosto">Centro Costo</Label>
            <select
              id="centroCosto" name="centroCosto"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="">—</option>
              {CENTROS_COSTO.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctaGasto">Cta Gasto</Label>
            <select
              id="ctaGasto" name="ctaGasto"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="">—</option>
              {CUENTAS_GASTO.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* 16. Importe + Afecto */}
        <div className="grid grid-cols-3 gap-4 items-end">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="monto">Importe <span className="text-red-500">*</span></Label>
            <Input
              id="monto" name="monto" type="number"
              step="0.01" min="0.01" placeholder="0.00" required
            />
          </div>
          <div className="flex items-center gap-2 h-9">
            <input
              id="afecto" name="afecto" type="checkbox"
              checked={afecto}
              onChange={(e) => setAfecto(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="afecto" className="cursor-pointer select-none">Afecto</Label>
          </div>
        </div>

        {/* Comprobante (archivo) */}
        <div className="space-y-2 pt-2 border-t">
          <Label htmlFor="comprobante">
            Comprobante <span className="text-slate-400 font-normal">(opcional — foto o PDF)</span>
          </Label>
          <Input
            id="comprobante" name="comprobante"
            type="file" accept="image/*,application/pdf"
            className="cursor-pointer"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending} style={{ backgroundColor: '#13602C' }}>
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
