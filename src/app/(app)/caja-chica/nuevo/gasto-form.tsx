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
  '01 FACTURAS',
  '02 RECIBO POR HONORARIOS',
  '03 BOLETA DE VENTA',
  '07 NOTA DE CREDITO',
  '14 RECIBO POR SERVICIO PUBLICO',
  'PM PLANILLA DE MOVILIDAD',
  'VR VARIOS',
]

const CONDICIONES = ['Contado', 'Crédito']

const MONEDAS = [
  { value: 'PEN', label: 'Soles (PEN)' },
  { value: 'USD', label: 'Dólares (USD)' },
]

const CENTROS_COSTO = [
  '20000 PAI',
  '20001 QUIMICA',
  '20002 BIOLOGIA',
  '20003 MICROBIOLOGIA',
  '20004 CALIDAD',
  '20005 ADMINISTRACION',
]

const CUENTAS_GASTO = [
  '0000000002 MOVILIDAD DE PRODUCCION — 923272',
  '0000000003 UTILES LIMPIEZA B/V — 945612',
  '0000000004 UTILES DE OFICINA — 945611',
  '0000000005 CONSUMO ATENCION A PERSONAL — 942511',
  '0000000006 AGUA PARA LABORATORIOS — 923271',
  '0000000007 SUMINISTROS DE ENSAYOS — 923271',
  '0000000008 SUMINISTRO DE ANIMALES PARA ENSAYOS — 923274',
  '0000000009 MOVILIDAD ADMINISTRATIVA — 942512',
  '0000000010 HONORARIOS CRIANZA DE ANIMALES — 923272',
  '0000000011 GASTOS SIN SUSTENTO — 945922',
  '0000000012 MANTENIMIENTO DE LOCAL — 943431',
  '0000000013 ACTIVO FIJO MENOR DE 1/4 UIT — 945617',
  '0000000014 PUBLICIDAD O MARKETIN IMPRESO — 953711',
  '0000000015 EQUIPOS DE PROTECCION DE PERSONAL — 945616',
  '0000000016 CAPACITACIONES O CHARLAS — 942411',
  '0000000017 RELACIONES PUBLICAS-ATENCION CLIENTES — 943732',
  '0000000018 COURRIER — 943121',
  '0000000019 CERTIFICADO ENSAYO - LICENCIAS — 928611',
  '0000000020 SERVICIO MANTENIMIENTO DE EQUIPO — 923434',
  '0000000021 PERCEPCIÓN — 401131',
  '0000000022 INVESTIGACION Y ANALISIS DE MUESTRAS — 923261',
  '0000000023 COMBUSTIBLE — 945615',
  '0000000024 EVALUADOR INACAL — 943731',
  '0000000025 INTERNET — 943651',
  '0000000026 TASAS-REGISTRO PUBLICO — 945929',
  '0000000027 APOYO DOCUMENTARIO — 943121',
  '0000000028 OTROS GASTOS A RENDIR — 169111',
  '0000000029 UNIFORMES O VESTIMENTA — 945616',
  '0000000030 VIGILANCIA SERVICIO DE MONITOREO — 945923',
  '0000000031 ASEGURAMIENTO DE CALIDAD — 945923',
  '0000000032 ADELANTO DE SUELDO — 411111',
  '0000000033 SEGURO DE VIDA LEY — 945113',
]

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
