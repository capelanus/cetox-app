'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import { Search, X, Tag } from 'lucide-react'

interface Props {
  especialidades: string[]
  currentQ?: string
  currentEspecialidad?: string
  currentEstado?: string
  currentProducto?: string
}

export default function ProveedoresFilters({ especialidades, currentQ, currentEspecialidad, currentEstado, currentProducto }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const navigate = useCallback((params: Record<string, string | undefined>) => {
    const sp = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v) })
    const qs = sp.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }, [router, pathname])

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  const handleProductoChange = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      navigate({ q: currentQ, especialidad: currentEspecialidad, estado: currentEstado, producto: value || undefined })
    }, 400)
  }, [navigate, currentQ, currentEspecialidad, currentEstado])

  const hasFilters = !!(currentQ || currentEspecialidad || currentEstado || currentProducto)

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          defaultValue={currentQ ?? ''}
          placeholder="Buscar por nombre, RUC o email..."
          className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
          onKeyDown={e => {
            if (e.key === 'Enter') {
              navigate({ q: (e.target as HTMLInputElement).value || undefined, especialidad: currentEspecialidad, estado: currentEstado, producto: currentProducto })
            }
          }}
        />
      </div>

      {/* Filtrar por producto */}
      <div className="relative min-w-[200px]">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          defaultValue={currentProducto ?? ''}
          placeholder="Filtrar por producto..."
          className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
          onChange={e => handleProductoChange(e.target.value)}
        />
      </div>

      {/* Especialidad */}
      <select
        value={currentEspecialidad ?? ''}
        onChange={e => navigate({ q: currentQ, especialidad: e.target.value || undefined, estado: currentEstado, producto: currentProducto })}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C] bg-white max-w-[220px]"
      >
        <option value="">Todas las especialidades</option>
        {especialidades.map(e => (
          <option key={e} value={e}>{e}</option>
        ))}
      </select>

      {/* Estado */}
      <select
        value={currentEstado ?? ''}
        onChange={e => navigate({ q: currentQ, especialidad: currentEspecialidad, estado: e.target.value || undefined, producto: currentProducto })}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C] bg-white"
      >
        <option value="">Todos</option>
        <option value="activo">Solo activos</option>
        <option value="inactivo">Solo inactivos</option>
      </select>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={() => navigate({})}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <X className="w-4 h-4" />Limpiar
        </button>
      )}
    </div>
  )
}
