'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Ensayo } from '@/generated/prisma/client'
import { Trash2, Plus } from 'lucide-react'

interface ItemState {
  ensayoId: string
  costo: number
  tiempoEntregaDias: number
  nombre: string
}

interface MuestraState {
  key: string
  nombre: string
  items: ItemState[]
  areaFilter: string
  search: string
}

export interface InitialMuestra {
  nombre: string
  items: { ensayoId: string; costo: number; tiempoEntregaDias: number; ensayo: Ensayo }[]
}

interface Props {
  moneda: 'USD' | 'PEN'
  ensayos: Ensayo[]
  initialMuestras?: InitialMuestra[]
  onChange?: (subtotal: number, itemCount: number) => void
}

let _counter = 0
function newKey() { return `m-${++_counter}` }

export function MuestraEditor({ moneda, ensayos, initialMuestras, onChange }: Props) {
  const [muestras, setMuestras] = useState<MuestraState[]>(() => {
    if (initialMuestras && initialMuestras.length > 0) {
      return initialMuestras.map((m) => ({
        key: newKey(),
        nombre: m.nombre,
        areaFilter: '',
        search: '',
        items: m.items.map((it) => ({
          ensayoId: it.ensayoId,
          costo: it.costo,
          tiempoEntregaDias: it.tiempoEntregaDias,
          nombre: it.ensayo.nombre,
        })),
      }))
    }
    return [{ key: newKey(), nombre: '', items: [], areaFilter: '', search: '' }]
  })

  function notify(next: MuestraState[]) {
    const allItems = next.flatMap((m) => m.items)
    onChange?.(allItems.reduce((s, it) => s + it.costo, 0), allItems.length)
  }

  function update(key: string, patch: Partial<MuestraState>) {
    setMuestras((prev) => {
      const next = prev.map((m) => (m.key === key ? { ...m, ...patch } : m))
      notify(next)
      return next
    })
  }

  function addMuestra() {
    setMuestras((prev) => [...prev, { key: newKey(), nombre: '', items: [], areaFilter: '', search: '' }])
  }

  function removeMuestra(key: string) {
    setMuestras((prev) => {
      const next = prev.filter((m) => m.key !== key)
      notify(next)
      return next
    })
  }

  function addEnsayo(muestraKey: string, ensayoId: string) {
    const ensayo = ensayos.find((e) => e.id === ensayoId)
    if (!ensayo) return
    const muestra = muestras.find((m) => m.key === muestraKey)
    if (!muestra || muestra.items.some((i) => i.ensayoId === ensayoId)) return
    const costo = moneda === 'USD' ? (ensayo.costoUSD ?? 0) : (ensayo.costoPEN ?? 0)
    update(muestraKey, {
      items: [...muestra.items, { ensayoId, costo, tiempoEntregaDias: ensayo.tiempoEntregaDias, nombre: ensayo.nombre }],
    })
  }

  function removeItem(muestraKey: string, ensayoId: string) {
    const muestra = muestras.find((m) => m.key === muestraKey)
    if (!muestra) return
    update(muestraKey, { items: muestra.items.filter((i) => i.ensayoId !== ensayoId) })
  }

  function updateItemField(muestraKey: string, ensayoId: string, field: 'costo' | 'tiempoEntregaDias', val: string) {
    const muestra = muestras.find((m) => m.key === muestraKey)
    if (!muestra) return
    update(muestraKey, {
      items: muestra.items.map((i) => (i.ensayoId === ensayoId ? { ...i, [field]: Number(val) } : i)),
    })
  }

  return (
    <div className="space-y-3">
      {muestras.map((muestra, mi) => {
        const ensayosFiltrados = ensayos.filter((e) => {
          if (muestra.items.some((i) => i.ensayoId === e.id)) return false
          if (muestra.areaFilter && e.area !== muestra.areaFilter) return false
          if (muestra.search) {
            const q = muestra.search.toLowerCase()
            if (!e.nombre.toLowerCase().includes(q) && !e.codigo.toLowerCase().includes(q)) return false
          }
          return true
        })

        return (
          <div key={muestra.key} className="border rounded-lg p-4 space-y-3 bg-slate-50/50">
            {/* Hidden inputs */}
            <input type="hidden" name={`muestras[${mi}][nombre]`} value={muestra.nombre} />
            {muestra.items.map((it, ii) => (
              <span key={it.ensayoId} style={{ display: 'none' }}>
                <input type="hidden" name={`muestras[${mi}][items][${ii}][ensayoId]`} value={it.ensayoId} />
                <input type="hidden" name={`muestras[${mi}][items][${ii}][costo]`} value={String(it.costo)} />
                <input type="hidden" name={`muestras[${mi}][items][${ii}][tiempoEntregaDias]`} value={String(it.tiempoEntregaDias)} />
              </span>
            ))}

            {/* Header */}
            <div className="flex items-center gap-3">
              <Label className="shrink-0 text-sm font-semibold text-slate-700">Muestra {mi + 1}</Label>
              <textarea
                value={muestra.nombre}
                onChange={(e) => update(muestra.key, { nombre: e.target.value })}
                placeholder="Nombre de la muestra (ej. Producto A, Lote #123)"
                rows={2}
                className="flex-1 text-sm bg-white rounded-md border border-input px-3 py-1.5 shadow-sm resize-y min-h-[56px]"
              />
              {muestras.length > 1 && (
                <button type="button" onClick={() => removeMuestra(muestra.key)} className="shrink-0">
                  <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                </button>
              )}
            </div>

            {/* Ensayo selector row */}
            <div className="flex gap-2 flex-wrap">
              <select
                className="h-8 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm shrink-0"
                value={muestra.areaFilter}
                onChange={(e) => update(muestra.key, { areaFilter: e.target.value })}
              >
                <option value="">Todas las áreas</option>
                <option value="Q">Química</option>
                <option value="B">Biología</option>
                <option value="M">Microbiología</option>
              </select>
              <Input
                value={muestra.search}
                onChange={(e) => update(muestra.key, { search: e.target.value })}
                placeholder="Buscar ensayo..."
                className="h-8 text-sm w-40 shrink-0"
              />
              <select
                className="h-8 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm flex-1 min-w-48"
                onChange={(e) => { if (e.target.value) addEnsayo(muestra.key, e.target.value); e.target.value = '' }}
              >
                <option value="">+ Agregar ensayo...</option>
                {ensayosFiltrados.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre} ({e.codigo})</option>
                ))}
              </select>
            </div>

            {/* Items table */}
            {muestra.items.length === 0 ? (
              <div className="border-2 border-dashed rounded-lg p-3 text-center text-slate-400 text-sm">
                Selecciona ensayos del menú superior
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-slate-600">Ensayo</th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600 w-32">Plazo (días)</th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600 w-32">Costo ({moneda})</th>
                      <th className="px-3 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {muestra.items.map((it) => (
                      <tr key={it.ensayoId}>
                        <td className="px-3 py-2">{it.nombre}</td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min="1"
                            value={it.tiempoEntregaDias}
                            onChange={(e) => updateItemField(muestra.key, it.ensayoId, 'tiempoEntregaDias', e.target.value)}
                            className="w-20 h-7 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={it.costo}
                            onChange={(e) => updateItemField(muestra.key, it.ensayoId, 'costo', e.target.value)}
                            className="w-24 h-7 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button type="button" onClick={() => removeItem(muestra.key, it.ensayoId)}>
                            <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addMuestra}
        className="w-full border-dashed text-slate-500"
      >
        <Plus className="h-4 w-4 mr-1" /> Agregar muestra
      </Button>
    </div>
  )
}
