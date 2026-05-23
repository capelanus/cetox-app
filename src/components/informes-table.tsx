'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatFecha, formatNumInforme } from '@/lib/format'

const ESTADO_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador',
  EN_REVISION_CALIDAD: 'En revisión',
  EN_FIRMA_GERENCIA: 'En firma',
  FIRMADO: 'Firmado',
  ENTREGADO: 'Entregado',
}

interface Ensayo { nombre: string; acreditadoINACAL: boolean }
interface ODAItem { ensayo: Ensayo }
interface InformeData {
  id: string
  numero: number
  anio: number
  prefijo: string
  estado: string
  createdAt: Date | string
  analista: { nombre: string }
  oda: {
    items: ODAItem[]
    set: { cliente: { razonSocial: string } }
  }
}

interface Props {
  informes: InformeData[]
}

export function InformesTable({ informes }: Props) {
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroEnsayo, setFiltroEnsayo] = useState('')
  const [filtroAcreditado, setFiltroAcreditado] = useState('')

  const todosEnsayos = useMemo(() => {
    const names = new Set<string>()
    informes.forEach((inf) => inf.oda.items.forEach((i) => names.add(i.ensayo.nombre)))
    return [...names].sort()
  }, [informes])

  const filtrados = useMemo(() => {
    return informes.filter((inf) => {
      if (filtroEstado && inf.estado !== filtroEstado) return false
      if (filtroEnsayo && !inf.oda.items.some((i) => i.ensayo.nombre === filtroEnsayo)) return false
      if (filtroAcreditado === 'SI' && !inf.oda.items.some((i) => i.ensayo.acreditadoINACAL)) return false
      if (filtroAcreditado === 'NO' && inf.oda.items.some((i) => i.ensayo.acreditadoINACAL)) return false
      return true
    })
  }, [informes, filtroEstado, filtroEnsayo, filtroAcreditado])

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
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
        <select
          className="h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm flex-1 min-w-48"
          value={filtroEnsayo}
          onChange={(e) => setFiltroEnsayo(e.target.value)}
        >
          <option value="">Todos los ensayos</option>
          {todosEnsayos.map((nombre) => (
            <option key={nombre} value={nombre}>{nombre}</option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm"
          value={filtroAcreditado}
          onChange={(e) => setFiltroAcreditado(e.target.value)}
        >
          <option value="">Acreditación: todos</option>
          <option value="SI">Acreditado INACAL</option>
          <option value="NO">No acreditado</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Número</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Ensayo</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Cliente</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Analista</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Fecha</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtrados.map((inf) => (
              <tr key={inf.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs font-medium">
                  {formatNumInforme(inf.prefijo, inf.numero, inf.anio)}
                </td>
                <td className="px-4 py-3">
                  {inf.oda.items.map((i) => (
                    <span key={i.ensayo.nombre}>
                      {i.ensayo.nombre}
                      {i.ensayo.acreditadoINACAL && (
                        <span className="ml-1 text-xs text-green-600 font-medium">[INACAL]</span>
                      )}
                    </span>
                  ))}
                </td>
                <td className="px-4 py-3">{inf.oda.set.cliente.razonSocial}</td>
                <td className="px-4 py-3 text-slate-600">{inf.analista.nombre}</td>
                <td className="px-4 py-3 text-slate-600">{formatFecha(inf.createdAt)}</td>
                <td className="px-4 py-3">
                  <Badge
                    className={
                      inf.estado === 'FIRMADO' ? 'bg-green-100 text-green-700' :
                      inf.estado === 'EN_REVISION_CALIDAD' ? 'bg-amber-100 text-amber-700' :
                      inf.estado === 'EN_FIRMA_GERENCIA' ? 'bg-blue-100 text-blue-700' : ''
                    }
                  >
                    {ESTADO_LABELS[inf.estado] ?? inf.estado}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/informes/${inf.id}`} className="text-blue-600 hover:underline text-sm">Ver</Link>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">No hay informes</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">{filtrados.length} informe{filtrados.length !== 1 ? 's' : ''}</p>
    </div>
  )
}
