'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Cliente } from '@/generated/prisma/client'
import { useRef } from 'react'
import { toast } from 'sonner'

const MODALIDADES = [
  { value: 'ANTICIPO_50_50', label: 'Anticipo 50/50' },
  { value: 'ANTICIPO_100', label: 'Anticipo 100%' },
  { value: 'CREDITO_100', label: 'Crédito 100%' },
  { value: 'CREDITO_50_50', label: 'Crédito 50/50' },
  { value: 'CREDITO_MENSUAL', label: 'Crédito mensual' },
  { value: 'CREDITO_QUINCENAL', label: 'Crédito quincenal' },
  { value: 'AL_CULMINAR', label: 'Al culminar' },
]

interface ClienteFormProps {
  action: (formData: FormData) => Promise<void>
  cliente?: Cliente
}

export function ClienteForm({ action, cliente }: ClienteFormProps) {
  const ref = useRef<HTMLFormElement>(null)

  async function handleSubmit(formData: FormData) {
    try {
      await action(formData)
    } catch (e) {
      if ((e as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw e
      toast.error('Error al guardar el cliente')
    }
  }

  return (
    <form ref={ref} action={handleSubmit} className="space-y-5 bg-white p-6 rounded-xl border shadow-sm">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="razonSocial">Razón social *</Label>
          <Input id="razonSocial" name="razonSocial" defaultValue={cliente?.razonSocial} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ruc">RUC *</Label>
          <Input id="ruc" name="ruc" defaultValue={cliente?.ruc} required maxLength={11} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="modalidadPago">Modalidad de pago *</Label>
          <select
            name="modalidadPago"
            defaultValue={cliente?.modalidadPago ?? 'ANTICIPO_50_50'}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            {MODALIDADES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2 space-y-2">
          <Label htmlFor="direccion">Dirección *</Label>
          <Input id="direccion" name="direccion" defaultValue={cliente?.direccion} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contacto">Persona de contacto</Label>
          <Input id="contacto" name="contacto" defaultValue={cliente?.contacto ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" name="telefono" defaultValue={cliente?.telefono ?? ''} />
        </div>
        <div className="col-span-2 space-y-2">
          <Label htmlFor="email">Email de contacto</Label>
          <Input id="email" name="email" type="text" defaultValue={cliente?.email ?? ''} />
          <p className="text-xs text-slate-400">Separar por comas si hay varios: email1@ejemplo.com, email2@ejemplo.com</p>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="submit" style={{ backgroundColor: '#1F4E79' }}>
          {cliente ? 'Guardar cambios' : 'Crear cliente'}
        </Button>
      </div>
    </form>
  )
}
