'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'

interface Row {
  id: string
  numero: string
  proveedor: string
  requerimiento: string
  total: string
  estado: string
  fecha: string
  productos: string
}

interface Props {
  rows: Row[]
  estadoLabels: Record<string, string>
}

export default function OCListClient({ rows, estadoLabels }: Props) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? rows.filter(r => {
        const q = query.toLowerCase()
        return (
          r.proveedor.toLowerCase().includes(q) ||
          r.productos.toLowerCase().includes(q) ||
          r.numero.toLowerCase().includes(q) ||
          r.requerimiento.toLowerCase().includes(q)
        )
      })
    : rows

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por producto o proveedor..."
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Número</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Proveedor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Requerimiento</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(oc => (
              <tr key={oc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/operaciones/ordenes-compra/${oc.id}`} className="font-mono text-[#13602C] font-medium hover:underline">
                    {oc.numero}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-700">{oc.proveedor}</td>
                <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{oc.requerimiento}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">{oc.total}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    oc.estado === 'CERRADA'     ? 'bg-green-100 text-green-700' :
                    oc.estado === 'EN_TRANSITO' ? 'bg-blue-100 text-blue-700' :
                    oc.estado === 'RECIBIDA'    ? 'bg-purple-100 text-purple-700' :
                    oc.estado === 'CANCELADA'   ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {estadoLabels[oc.estado] || oc.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{oc.fecha}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">
                  {query ? `Sin resultados para "${query}"` : 'No hay órdenes de compra'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
