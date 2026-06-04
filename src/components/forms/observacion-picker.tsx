'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, Plus, ChevronDown } from 'lucide-react'
import { OBSERVACIONES_PREDEFINIDAS } from '@/lib/observaciones-predefinidas'

interface Props {
  onSelect: (texto: string) => void
}

export function ObservacionPicker({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [open,  setOpen]  = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const q = query.trim().toLowerCase()
  const filtered = q
    ? OBSERVACIONES_PREDEFINIDAS.filter((o) => o.toLowerCase().includes(q))
    : OBSERVACIONES_PREDEFINIDAS

  // Cerrar al hacer click afuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleSelect(texto: string) {
    onSelect(texto)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-input bg-white text-sm text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition"
      >
        <span className="flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500">Añadir observación predefinida…</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border rounded-md shadow-lg">
          <div className="flex items-center gap-2 px-3 py-2 border-b">
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrar..."
              autoFocus
              className="w-full bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-[10px] text-slate-400 hover:text-slate-600 flex-shrink-0"
              >
                Limpiar
              </button>
            )}
          </div>

          <ul className="max-h-72 overflow-y-auto cetox-scroll">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-xs text-slate-400 text-center">
                Sin coincidencias
              </li>
            ) : (
              filtered.map((obs, i) => {
                const idx = OBSERVACIONES_PREDEFINIDAS.indexOf(obs) + 1
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => handleSelect(obs)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b last:border-b-0 flex items-start gap-2 transition-colors"
                    >
                      <span className="text-[10px] font-mono text-slate-400 mt-0.5 flex-shrink-0 w-5 text-right">
                        {idx}.
                      </span>
                      <span className="text-xs text-slate-700 leading-snug">{obs}</span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>

          <div className="px-3 py-1.5 border-t bg-slate-50 text-[10px] text-slate-400">
            {filtered.length} de {OBSERVACIONES_PREDEFINIDAS.length} · al hacer clic se añade al campo
          </div>
        </div>
      )}
    </div>
  )
}
