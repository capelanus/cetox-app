'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'
import type { Cliente } from '@/generated/prisma/client'

const ESTADOS = [
  { value: '',       label: 'Todos' },
  { value: 'activo', label: 'Activos' },
  { value: 'inactivo', label: 'Inactivos' },
]

interface Props {
  clientes: Cliente[]
  canEdit: boolean
}

export function ClientesTable({ clientes, canEdit }: Props) {
  const [estado, setEstado] = useState('')
  const [query, setQuery]   = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return clientes.filter((c) => {
      const matchEstado =
        !estado ||
        (estado === 'activo'   &&  c.activo) ||
        (estado === 'inactivo' && !c.activo)
      const matchQuery =
        !q ||
        [c.razonSocial, c.ruc, c.direccion, c.contacto, c.email]
          .some((v) => v?.toLowerCase().includes(q))
      return matchEstado && matchQuery
    })
  }, [clientes, estado, query])

  return (
    <div className="space-y-4">
      {/* ── Filtros ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Estado chips */}
        <div className="flex gap-1.5">
          {ESTADOS.map((e) => {
            const active = estado === e.value
            const count =
              e.value === ''         ? clientes.length
              : e.value === 'activo' ? clientes.filter((c) =>  c.activo).length
              :                        clientes.filter((c) => !c.activo).length
            return (
              <button
                key={e.value}
                onClick={() => setEstado(e.value)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: active ? '#13602C' : '#f1f5f9',
                  color:           active ? '#ffffff'  : '#475569',
                  boxShadow:       active ? '0 0 0 2px #13602C40' : undefined,
                }}
              >
                {e.label}
                <span
                  className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: active ? '#ffffff30' : '#e2e8f0',
                    color:           active ? '#fff'       : '#64748b',
                  }}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Búsqueda */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm flex-1 min-w-[200px] max-w-sm"
          style={{
            borderColor:     query ? '#4AC3B2' : '#e2e8f0',
            backgroundColor: 'white',
            boxShadow:       query ? '0 0 0 2px #4AC3B240' : undefined,
          }}
        >
          <Search className="h-4 w-4 flex-shrink-0" style={{ color: query ? '#4AC3B2' : '#94a3b8' }} />
          <input
            type="text"
            placeholder="Buscar por razón social, RUC, dirección…"
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

        {(estado || query) && (
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
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Razón social</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">RUC</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Dirección</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
              {canEdit && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{c.razonSocial}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.ruc}</td>
                <td className="px-4 py-3 text-slate-600 max-w-48 truncate">{c.direccion}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={c.activo ? 'default' : 'secondary'}
                    style={c.activo ? { backgroundColor: '#DCF0E4', color: '#13602C' } : undefined}
                  >
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                {canEdit && (
                  <td className="px-4 py-3">
                    <Link href={`/clientes/${c.id}`} className="text-blue-600 hover:underline text-sm">
                      Editar
                    </Link>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 5 : 4} className="px-4 py-10 text-center text-slate-400">
                  {query || estado
                    ? 'Sin resultados para los filtros aplicados'
                    : 'No hay clientes registrados'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
