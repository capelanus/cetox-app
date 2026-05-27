'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Ensayo } from '@/generated/prisma/client'
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react'

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
  indicacionQ: string
  indicacionB: string
  indicacionM: string
  areaFilter: string
  search: string
  dropdownOpen: boolean
}

export interface InitialMuestra {
  nombre: string
  indicacionQ?: string | null
  indicacionB?: string | null
  indicacionM?: string | null
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

function EnsayoDropdown({
  muestraKey,
  ensayosFiltrados,
  search,
  dropdownOpen,
  onSearch,
  onToggle,
  onAdd,
}: {
  muestraKey: string
  ensayosFiltrados: Ensayo[]
  search: string
  dropdownOpen: boolean
  onSearch: (val: string) => void
  onToggle: (open: boolean) => void
  onAdd: (id: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onToggle(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onToggle])

  const isOpen = dropdownOpen || search.length > 0

  return (
    <div ref={containerRef} className="relative flex-1 min-w-48">
      <div className="flex">
        <Input
          value={search}
          onChange={(e) => { onSearch(e.target.value); onToggle(true) }}
          onFocus={() => onToggle(true)}
          placeholder="Buscar ensayo..."
          className="h-8 text-sm rounded-r-none border-r-0"
        />
        <button
          type="button"
          onClick={() => onToggle(!isOpen)}
          className="h-8 px-2 border border-input border-l-0 rounded-r-md bg-white hover:bg-slate-50 transition-colors"
        >
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-0.5 bg-white border border-input rounded-md shadow-lg max-h-56 overflow-y-auto">
          {ensayosFiltrados.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-400">
              {search ? 'Sin resultados' : 'Todos los ensayos ya agregados'}
            </p>
          ) : (
            ensayosFiltrados.map((e) => (
              <button
                key={e.id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors border-b last:border-0"
                onMouseDown={(ev) => { ev.preventDefault(); onAdd(e.id); onSearch(''); onToggle(false) }}
              >
                <span className="font-medium">{e.nombre}</span>
                <span className="text-slate-400 ml-2 text-xs">{e.codigo}</span>
                {e.acreditadoINACAL && <span className="ml-2 text-xs text-green-600">[INACAL]</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export function MuestraEditor({ moneda, ensayos, initialMuestras, onChange }: Props) {
  const [muestras, setMuestras] = useState<MuestraState[]>(() => {
    if (initialMuestras && initialMuestras.length > 0) {
      return initialMuestras.map((m) => ({
        key: newKey(),
        nombre: m.nombre,
        indicacionQ: m.indicacionQ ?? '',
        indicacionB: m.indicacionB ?? '',
        indicacionM: m.indicacionM ?? '',
        areaFilter: '',
        search: '',
        dropdownOpen: false,
        items: m.items.map((it) => ({
          ensayoId: it.ensayoId,
          costo: it.costo,
          tiempoEntregaDias: it.tiempoEntregaDias,
          nombre: it.ensayo.nombre,
        })),
      }))
    }
    return [{ key: newKey(), nombre: '', items: [], indicacionQ: '', indicacionB: '', indicacionM: '', areaFilter: '', search: '', dropdownOpen: false }]
  })

  const stableOnChange = useCallback(onChange ?? (() => {}), []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const allItems = muestras.flatMap((m) => m.items)
    stableOnChange(allItems.reduce((s, it) => s + it.costo, 0), allItems.length)
  }, [muestras, stableOnChange])

  function update(key: string, patch: Partial<MuestraState>) {
    setMuestras((prev) => prev.map((m) => (m.key === key ? { ...m, ...patch } : m)))
  }

  function addMuestra() {
    setMuestras((prev) => [...prev, { key: newKey(), nombre: '', items: [], indicacionQ: '', indicacionB: '', indicacionM: '', areaFilter: '', search: '', dropdownOpen: false }])
  }

  function removeMuestra(key: string) {
    setMuestras((prev) => prev.filter((m) => m.key !== key))
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

  function moveItem(muestraKey: string, index: number, dir: -1 | 1) {
    const muestra = muestras.find((m) => m.key === muestraKey)
    if (!muestra) return
    const items = [...muestra.items]
    const target = index + dir
    if (target < 0 || target >= items.length) return
    ;[items[index], items[target]] = [items[target], items[index]]
    update(muestraKey, { items })
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

        const areas = [...new Set(
          muestra.items
            .map((it) => ensayos.find((e) => e.id === it.ensayoId)?.area)
            .filter((a): a is string => !!a)
        )].sort()

        const AREA_STYLES: Record<string, { badge: string; border: string; label: string }> = {
          Q: { badge: 'bg-blue-100 text-blue-700', border: 'border-blue-200 focus:ring-1 focus:ring-blue-300 focus:border-blue-400', label: 'Química' },
          B: { badge: 'bg-green-100 text-green-700', border: 'border-green-200 focus:ring-1 focus:ring-green-300 focus:border-green-400', label: 'Biología' },
          M: { badge: 'bg-purple-100 text-purple-700', border: 'border-purple-200 focus:ring-1 focus:ring-purple-300 focus:border-purple-400', label: 'Microbiología' },
        }

        const indicacionKey: Record<string, keyof Pick<MuestraState, 'indicacionQ' | 'indicacionB' | 'indicacionM'>> = {
          Q: 'indicacionQ', B: 'indicacionB', M: 'indicacionM',
        }

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
            <div className="flex gap-2 items-start">
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
              <EnsayoDropdown
                muestraKey={muestra.key}
                ensayosFiltrados={ensayosFiltrados}
                search={muestra.search}
                dropdownOpen={muestra.dropdownOpen}
                onSearch={(val) => update(muestra.key, { search: val })}
                onToggle={(open) => update(muestra.key, { dropdownOpen: open })}
                onAdd={(id) => addEnsayo(muestra.key, id)}
              />
            </div>

            {/* Items table */}
            {muestra.items.length === 0 ? (
              <div className="border-2 border-dashed rounded-lg p-3 text-center text-slate-400 text-sm">
                Selecciona ensayos del buscador superior
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-2 py-2 w-8"></th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600">Ensayo</th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600 w-32">Plazo (días)</th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600 w-32">Costo ({moneda})</th>
                      <th className="px-3 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {muestra.items.map((it, ii) => (
                      <tr key={it.ensayoId} className="group">
                        {/* Botones de orden */}
                        <td className="px-2 py-2">
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              disabled={ii === 0}
                              onClick={() => moveItem(muestra.key, ii, -1)}
                              className="rounded p-0.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-0 transition-all"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={ii === muestra.items.length - 1}
                              onClick={() => moveItem(muestra.key, ii, 1)}
                              className="rounded p-0.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-0 transition-all"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
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

            {/* Indicaciones por laboratorio — aparecen según áreas involucradas */}
            {areas.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Indicaciones al laboratorio
                </p>
                <div className={`grid gap-3 ${areas.length === 3 ? 'grid-cols-3' : areas.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {areas.map((area) => {
                    const st = AREA_STYLES[area]
                    const stateKey = indicacionKey[area]
                    if (!st || !stateKey) return null
                    return (
                      <div key={area} className="space-y-1">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${st.badge}`}>
                          {st.label}
                        </span>
                        <textarea
                          name={`muestras[${mi}][indicacion${area}]`}
                          value={muestra[stateKey]}
                          onChange={(e) => update(muestra.key, { [stateKey]: e.target.value })}
                          rows={3}
                          placeholder={`Indicaciones para ${st.label}...`}
                          className={`w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm resize-y min-h-[72px] outline-none ${st.border}`}
                        />
                      </div>
                    )
                  })}
                </div>
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
