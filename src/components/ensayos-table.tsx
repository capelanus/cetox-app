'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatMoneda } from '@/lib/format'
import { Search } from 'lucide-react'
import type { Ensayo } from '@/generated/prisma/client'

const AREA_LABELS: Record<string, string> = {
  B: 'Biológica',
  Q: 'Química',
  M: 'Microbiológica',
}

const AREAS = [
  { value: '',  label: 'Todos' },
  { value: 'B', label: 'Biológica' },
  { value: 'Q', label: 'Química' },
  { value: 'M', label: 'Microbiológica' },
]

interface Props {
  ensayos: Ensayo[]
  canEdit: boolean
}

export function EnsayosTable({ ensayos, canEdit }: Props) {
  const [area, setArea]   = useState('')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ensayos.filter((e) => {
      const matchArea  = !area || e.area === area
      const matchQuery = !q || [e.codigo, e.nombre, e.metodoNorma, e.prefijoInforme]
        .some((v) => v?.toLowerCase().includes(q))
      return matchArea && matchQuery
    })
  }, [ensayos, area, query])

  return (
    <div className="space-y-4">
      {/* ── Filtros ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Área chips */}
        <div className="flex gap-1.5">
          {AREAS.map((a) => {
            const active = area === a.value
            return (
              <button
                key={a.value}
                onClick={() => setArea(a.value)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: active ? '#13602C' : '#f1f5f9',
                  color:           active ? '#ffffff' : '#475569',
                  boxShadow:       active ? '0 0 0 2px #13602C40' : undefined,
                }}
              >
                {a.label}
                <span
                  className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: active ? '#ffffff30' : '#e2e8f0',
                    color:           active ? '#fff'       : '#64748b',
                  }}
                >
                  {a.value ? ensayos.filter((e) => e.area === a.value).length : ensayos.length}
                </span>
              </button>
            )
          })}
        </div>

        {/* Búsqueda por palabra clave */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm flex-1 min-w-[200px] max-w-xs"
          style={{ borderColor: query ? '#4AC3B2' : '#e2e8f0', backgroundColor: 'white',
                   boxShadow: query ? '0 0 0 2px #4AC3B240' : undefined }}
        >
          <Search className="h-4 w-4 flex-shrink-0" style={{ color: query ? '#4AC3B2' : '#94a3b8' }} />
          <input
            type="text"
            placeholder="Buscar por nombre, código, método…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 outline-none bg-transparent text-slate-700 placeholder:text-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 text-xs leading-none"
            >
              ✕
            </button>
          )}
        </div>

        {/* Resultado count */}
        {(area || query) && (
          <span className="text-sm text-slate-500">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Código</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Nombre</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Área</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Método / Norma</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Costo USD</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Plazo</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Acreditado</th>
              {canEdit && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{e.codigo}</td>
                <td className="px-4 py-3 font-medium">{e.nombre}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: e.area === 'B' ? '#1F4E79' : e.area === 'Q' ? '#13602C' : '#4AC3B2',
                      color:       e.area === 'B' ? '#1F4E79' : e.area === 'Q' ? '#13602C' : '#0f766e',
                    }}
                  >
                    {AREA_LABELS[e.area] ?? e.area}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs max-w-48 truncate" title={e.metodoNorma}>
                  {e.metodoNorma}
                </td>
                <td className="px-4 py-3">
                  {e.costoUSD ? formatMoneda(e.costoUSD, 'USD') : '—'}
                </td>
                <td className="px-4 py-3 text-slate-600">{e.tiempoEntregaDias} días</td>
                <td className="px-4 py-3">
                  {e.acreditadoINACAL ? (
                    <Badge style={{ backgroundColor: '#DCF0E4', color: '#13602C' }}>INACAL</Badge>
                  ) : (
                    <Badge variant="secondary">No acreditado</Badge>
                  )}
                </td>
                {canEdit && (
                  <td className="px-4 py-3">
                    <Link href={`/ensayos/${e.id}`} className="text-blue-600 hover:underline text-sm">
                      Editar
                    </Link>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 8 : 7} className="px-4 py-10 text-center text-slate-400">
                  {query || area
                    ? 'Sin resultados para los filtros aplicados'
                    : 'No hay ensayos registrados'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
