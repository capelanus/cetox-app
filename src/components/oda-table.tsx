'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatFecha, formatNumODA } from '@/lib/format'

const ESTADO_LABELS: Record<string, string> = {
  EMITIDA: 'Emitida',
  RECIBIDA: 'Recibida',
  EN_EJECUCION: 'En ejecución',
  CON_RESULTADO: 'Con resultado',
  INFORME_EMITIDO: 'Informe emitido',
}

const AREA_LABELS: Record<string, string> = { Q: 'Química', B: 'Biología', M: 'Microbiología' }

interface ODAItem {
  ensayo: { nombre: string }
}

interface ODA {
  id: string
  numero: number
  anio: number
  area: string
  estado: string
  fechaEntregaCompromiso: Date | string
  items: ODAItem[]
  set: { cliente: { razonSocial: string } }
  informe: { id: string } | null
}

interface Props {
  odas: ODA[]
  userArea: string | null
  isAnalista: boolean
}

export function ODATable({ odas, userArea, isAnalista }: Props) {
  const [filtroArea, setFiltroArea] = useState(userArea ?? '')
  const [filtroEstado, setFiltroEstado] = useState('')

  const filtradas = odas.filter((o) => {
    if (filtroArea && o.area !== filtroArea) return false
    if (filtroEstado && o.estado !== filtroEstado) return false
    return true
  })

  return (
    <div>
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        {isAnalista && userArea && (
          <span className="text-slate-500 text-sm">Área: {AREA_LABELS[userArea] ?? userArea}</span>
        )}
        {!isAnalista && (
          <select
            className="h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm"
            value={filtroArea}
            onChange={(e) => setFiltroArea(e.target.value)}
          >
            <option value="">Todas las áreas</option>
            <option value="Q">Química</option>
            <option value="B">Biología</option>
            <option value="M">Microbiología</option>
          </select>
        )}
        <select
          className="h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        {(filtroEstado || (!isAnalista && filtroArea)) && (
          <button
            className="text-sm text-slate-500 hover:text-slate-800 underline"
            onClick={() => { setFiltroEstado(''); if (!isAnalista) setFiltroArea('') }}
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-visible">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">ODA</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Área</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Ensayos</th>
              {!isAnalista && <th className="text-left px-4 py-3 font-semibold text-slate-600">Cliente</th>}
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Entrega</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtradas.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs font-medium">{formatNumODA(o.numero, o.anio)}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{AREA_LABELS[o.area] ?? o.area}</Badge>
                </td>
                <td className="px-4 py-3">
                  {o.items.length === 0 ? (
                    <span className="text-slate-400">—</span>
                  ) : o.items.length === 1 ? (
                    <span>{o.items[0].ensayo.nombre}</span>
                  ) : (
                    <span>
                      {o.items[0].ensayo.nombre}
                      <span className="ml-1 text-xs text-slate-400">+{o.items.length - 1} más</span>
                    </span>
                  )}
                </td>
                {!isAnalista && <td className="px-4 py-3">{o.set.cliente.razonSocial}</td>}
                <td className="px-4 py-3 text-slate-600">{formatFecha(o.fechaEntregaCompromiso)}</td>
                <td className="px-4 py-3">
                  <Badge
                    className={
                      o.estado === 'CON_RESULTADO' ? 'bg-green-100 text-green-700' :
                      o.estado === 'EN_EJECUCION' ? 'bg-blue-100 text-blue-700' : ''
                    }
                  >
                    {ESTADO_LABELS[o.estado] ?? o.estado}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/oda/${o.id}`} className="text-blue-600 hover:underline text-sm">Ver</Link>
                </td>
              </tr>
            ))}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">No hay ODAs</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
