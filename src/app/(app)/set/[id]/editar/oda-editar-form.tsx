'use client'

import { useState, useTransition } from 'react'
import { actualizarODA, eliminarODA } from '@/app/actions/oda'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, Loader2, Trash2 } from 'lucide-react'

interface ODAItem {
  id: string
  ensayo: { nombre: string }
  costo: number
  tiempoEntregaDias: number
  fechaEntregaCompromiso: Date
}

interface ODA {
  id: string
  numero: number
  anio: number
  area: string
  fechaEntregaCompromiso: Date
  items: ODAItem[]
}

interface Props {
  oda: ODA
}

const AREA_LABELS: Record<string, string> = { Q: 'Química', B: 'Biología', M: 'Microbiología' }

function toDateInput(d: Date): string {
  return new Date(d).toISOString().split('T')[0]
}

export function OdaEditarForm({ oda }: Props) {
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [deleted, setDeleted] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaved(false)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await actualizarODA(oda.id, formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  function handleEliminar() {
    if (!confirm(
      `¿Eliminar ODA-${String(oda.numero).padStart(5, '0')} (${AREA_LABELS[oda.area] ?? oda.area})?\n\nEsta acción no se puede deshacer. Si la ODA tiene un informe en borrador, también se eliminará.`
    )) return
    startDeleteTransition(async () => {
      try {
        await eliminarODA(oda.id)
        setDeleted(true)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al eliminar la ODA'
        alert(msg)
      }
    })
  }

  const odaNum = String(oda.numero).padStart(5, '0')

  // Si fue eliminada, no renderizar nada
  if (deleted) return null

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-xl p-4 space-y-4 bg-white">
      {/* Header ODA */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-slate-800">ODA-{odaNum}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {AREA_LABELS[oda.area] ?? oda.area}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Botón eliminar */}
          <button
            type="button"
            disabled={isDeleting || isPending}
            onClick={handleEliminar}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            {isDeleting ? 'Eliminando...' : 'Eliminar ODA'}
          </button>

          {/* Botón guardar */}
          <button
            type="submit"
            disabled={isPending || isDeleting}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium bg-[#1F4E79] text-white hover:bg-[#163a5b] disabled:opacity-50 transition-colors"
          >
            {isPending ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" />Guardando...</>
            ) : saved ? (
              <><Check className="w-3.5 h-3.5" />Guardado</>
            ) : (
              'Guardar ODA'
            )}
          </button>
        </div>
      </div>

      {/* Área y fecha de entrega global */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Área</Label>
          <select
            name="area"
            defaultValue={oda.area}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="Q">Química</option>
            <option value="B">Biología</option>
            <option value="M">Microbiología</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Fecha de entrega compromiso</Label>
          <Input
            name="fechaEntregaCompromiso"
            type="date"
            defaultValue={toDateInput(oda.fechaEntregaCompromiso)}
            className="text-sm"
          />
        </div>
      </div>

      {/* Items */}
      {oda.items.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ítems</p>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-slate-600">Ensayo</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-600 w-28">Plazo (días)</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-600 w-36">Fecha entrega</th>
                  <th className="text-right px-3 py-2 font-medium text-slate-600 w-28">Costo</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {oda.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-slate-700">{item.ensayo.nombre}</td>
                    <td className="px-3 py-2">
                      <Input
                        name={`dias_${item.id}`}
                        type="number"
                        min={0}
                        defaultValue={item.tiempoEntregaDias}
                        className="h-8 text-sm w-24 text-center font-mono"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        name={`fecha_${item.id}`}
                        type="date"
                        defaultValue={toDateInput(item.fechaEntregaCompromiso)}
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Input
                        name={`costo_${item.id}`}
                        type="number"
                        min={0}
                        step="0.01"
                        defaultValue={item.costo}
                        className="h-8 text-sm w-28 text-right font-mono ml-auto"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </form>
  )
}
