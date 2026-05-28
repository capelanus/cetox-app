'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import { Search, AlertTriangle, X } from 'lucide-react'

interface Props {
  categorias: string[]
  currentQ?: string
  currentCategoria?: string
  currentAlerta?: string
}

export default function InventarioSearchClient({ categorias, currentQ, currentCategoria, currentAlerta }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const navigate = useCallback((params: Record<string, string | undefined>) => {
    const sp = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v) })
    const qs = sp.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }, [router, pathname])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      navigate({ q: value || undefined, categoria: currentCategoria, alerta: currentAlerta })
    }, 400)
  }, [navigate, currentCategoria, currentAlerta])

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search box */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          defaultValue={currentQ ?? ''}
          placeholder="Buscar por descripción o código..."
          className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
          onChange={e => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Category filter */}
      {categorias.length > 0 && (
        <select
          value={currentCategoria ?? ''}
          onChange={e => navigate({ q: currentQ, categoria: e.target.value || undefined, alerta: currentAlerta })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C] bg-white"
        >
          <option value="">Todas las categorías</option>
          {categorias.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )}

      {/* Alert filter */}
      <button
        onClick={() => navigate({ q: currentQ, categoria: currentCategoria, alerta: currentAlerta === '1' ? undefined : '1' })}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
          currentAlerta === '1'
            ? 'bg-red-50 border-red-300 text-red-700'
            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
        }`}
      >
        <AlertTriangle className="w-4 h-4" />
        Stock bajo
      </button>

      {/* Clear filters */}
      {(currentQ || currentCategoria || currentAlerta) && (
        <button
          onClick={() => navigate({})}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <X className="w-4 h-4" />
          Limpiar
        </button>
      )}
    </div>
  )
}
