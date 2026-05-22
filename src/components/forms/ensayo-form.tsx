'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Ensayo } from '@/generated/prisma/client'
import { toast } from 'sonner'

const AREAS = [
  { value: 'Q', label: 'Química' },
  { value: 'B', label: 'Biología' },
  { value: 'M', label: 'Microbiología' },
]

interface EnsayoFormProps {
  action: (formData: FormData) => Promise<void>
  ensayo?: Ensayo
}

export function EnsayoForm({ action, ensayo }: EnsayoFormProps) {
  async function handleSubmit(formData: FormData) {
    try {
      await action(formData)
    } catch {
      toast.error('Error al guardar el ensayo')
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5 bg-white p-6 rounded-xl border shadow-sm">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="codigo">Código *</Label>
          <Input id="codigo" name="codigo" defaultValue={ensayo?.codigo} required placeholder="OECD-423-OCT" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prefijoInforme">Prefijo informe *</Label>
          <Input id="prefijoInforme" name="prefijoInforme" defaultValue={ensayo?.prefijoInforme} required placeholder="OCT" />
        </div>
        <div className="col-span-2 space-y-2">
          <Label htmlFor="nombre">Nombre del ensayo *</Label>
          <Input id="nombre" name="nombre" defaultValue={ensayo?.nombre} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="area">Área *</Label>
          <select
            name="area"
            defaultValue={ensayo?.area ?? 'Q'}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            {AREAS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="metodoNorma">Método / Norma *</Label>
          <Input id="metodoNorma" name="metodoNorma" defaultValue={ensayo?.metodoNorma} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="costoUSD">Costo USD</Label>
          <Input id="costoUSD" name="costoUSD" type="number" step="0.01" defaultValue={ensayo?.costoUSD ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="costoPEN">Costo PEN</Label>
          <Input id="costoPEN" name="costoPEN" type="number" step="0.01" defaultValue={ensayo?.costoPEN ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tiempoEntregaDias">Tiempo de entrega (días) *</Label>
          <Input id="tiempoEntregaDias" name="tiempoEntregaDias" type="number" defaultValue={ensayo?.tiempoEntregaDias} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipoMuestra">Tipo de muestra</Label>
          <Input id="tipoMuestra" name="tipoMuestra" defaultValue={ensayo?.tipoMuestra ?? ''} />
        </div>
        <div className="col-span-2 space-y-2">
          <Label htmlFor="plantillaWord">Plantilla Word</Label>
          <Input id="plantillaWord" name="plantillaWord" defaultValue={ensayo?.plantillaWord ?? ''} placeholder="PLANTILLA PQ.docx" />
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="acreditadoINACAL"
            name="acreditadoINACAL"
            value="true"
            defaultChecked={ensayo?.acreditadoINACAL}
            className="h-4 w-4"
          />
          <Label htmlFor="acreditadoINACAL">Acreditado INACAL</Label>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="tercerizado"
            name="tercerizado"
            value="true"
            defaultChecked={ensayo?.tercerizado}
            className="h-4 w-4"
          />
          <Label htmlFor="tercerizado">Tercerizado</Label>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="submit" style={{ backgroundColor: '#1F4E79' }}>
          {ensayo ? 'Guardar cambios' : 'Crear ensayo'}
        </Button>
      </div>
    </form>
  )
}
