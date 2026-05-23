'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

const ESTADO_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador',
  EN_REVISION: 'En revisión',
  ENVIADA: 'Enviada',
  ACEPTADA: 'Aceptada',
  RECHAZADA: 'Rechazada',
  VENCIDA: 'Vencida',
}

interface Ensayo { nombre: string; alias: string | null }
interface Item { ensayo: Ensayo }
interface Cliente { razonSocial: string; ruc: string; telefono: string | null }
interface Muestra { nombre: string }
interface CotizacionData {
  id: string
  numero: number
  anio: number
  sufijo: string
  fechaEmision: Date | string
  estado: string
  contactoNombre: string | null
  contactoEmail: string | null
  contactoTelefono: string | null
  paisOrigen: string | null
  cliente: Cliente
  creadoPor: { nombre: string }
  items: Item[]
  muestras: Muestra[]
}

interface Props {
  cotizaciones: CotizacionData[]
}

export function ResumenTable({ cotizaciones }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const filtradas = useMemo(() => {
    return cotizaciones.filter((c) => {
      if (filtroEstado && c.estado !== filtroEstado) return false
      if (busqueda) {
        const q = busqueda.toLowerCase()
        return (
          c.cliente.razonSocial.toLowerCase().includes(q) ||
          c.cliente.ruc.includes(q) ||
          (c.contactoNombre ?? '').toLowerCase().includes(q) ||
          (c.contactoEmail ?? '').toLowerCase().includes(q) ||
          String(c.numero).includes(q)
        )
      }
      return true
    })
  }, [cotizaciones, busqueda, filtroEstado])

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por cliente, RUC, contacto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm flex-1 min-w-48"
        />
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
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Cód. Cotización</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Fecha</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Razón Social / Cliente</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">RUC / DNI</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Atención</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Email</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Teléfono</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Muestras</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Análisis solicitado</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">País</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Estado</th>
              <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Aprobación</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtradas.map((c) => {
              const codigoCot = `COT-${String(c.numero).padStart(4, '0')}-${c.anio}${c.sufijo}`
              const analisis = c.items
                .map((it) => it.ensayo.alias ?? it.ensayo.nombre)
                .join(', ')

              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono font-medium whitespace-nowrap">{codigoCot}</td>
                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                    {new Date(c.fechaEmision).toLocaleDateString('es-PE')}
                  </td>
                  <td className="px-3 py-2 font-medium">{c.cliente.razonSocial}</td>
                  <td className="px-3 py-2 font-mono">{c.cliente.ruc}</td>
                  <td className="px-3 py-2">{c.contactoNombre ?? '—'}</td>
                  <td className="px-3 py-2">{c.contactoEmail ?? '—'}</td>
                  <td className="px-3 py-2">{c.contactoTelefono ?? c.cliente.telefono ?? '—'}</td>
                  <td className="px-3 py-2 max-w-40">
                    {c.muestras.length > 0
                      ? c.muestras.map((m) => m.nombre).join(', ')
                      : '—'}
                  </td>
                  <td className="px-3 py-2 max-w-48 truncate" title={analisis}>{analisis || '—'}</td>
                  <td className="px-3 py-2">{c.paisOrigen ?? '—'}</td>
                  <td className="px-3 py-2">
                    <Badge
                      className={
                        c.estado === 'ACEPTADA' ? 'bg-green-100 text-green-700' :
                        c.estado === 'RECHAZADA' ? 'bg-red-100 text-red-700' : ''
                      }
                      variant={c.estado === 'RECHAZADA' ? 'destructive' : c.estado === 'EN_REVISION' ? 'outline' : 'secondary'}
                    >
                      {ESTADO_LABELS[c.estado] ?? c.estado}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    {c.estado === 'ACEPTADA' ? (
                      <span className="text-green-700 font-medium text-xs">✓ Aprobada</span>
                    ) : c.estado === 'RECHAZADA' ? (
                      <span className="text-red-600 font-medium text-xs">✗ Rechazada</span>
                    ) : (
                      <span className="text-slate-400 text-xs">Pendiente</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/cotizaciones/${c.id}`} className="text-blue-600 hover:underline whitespace-nowrap">
                      Ver →
                    </Link>
                  </td>
                </tr>
              )
            })}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={13} className="px-4 py-8 text-center text-slate-400">
                  No hay resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">{filtradas.length} cotización{filtradas.length !== 1 ? 'es' : ''}</p>
    </div>
  )
}
