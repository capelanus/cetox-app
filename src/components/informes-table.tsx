'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { formatFechaHora, formatNumInforme } from '@/lib/format'

const ESTADO_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador',
  EN_ELABORACION: 'En elaboración',
  EN_REVISION_CALIDAD: 'En revisión',
  EN_FIRMA_GERENCIA: 'En firma',
  FIRMADO: 'Firmado',
  ENTREGADO: 'Entregado',
}

const ESTADO_STYLES: Record<string, string> = {
  FIRMADO:              'bg-green-100 text-green-700',
  ENTREGADO:            'bg-emerald-100 text-emerald-700',
  EN_REVISION_CALIDAD:  'bg-amber-100 text-amber-700',
  EN_FIRMA_GERENCIA:    'bg-blue-100 text-blue-700',
  EN_ELABORACION:       'bg-orange-100 text-orange-700',
  BORRADOR:             'bg-slate-100 text-slate-600',
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
  fechaEnvioResultados: Date | string | null
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
  const router = useRouter()
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
      {/* Filtros */}
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

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Número</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Ensayo</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Cliente</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Analista</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Recibido</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtrados.map((inf) => {
              const { fecha, hora } = formatFechaHora(inf.fechaEnvioResultados ?? inf.createdAt)
              return (
                <tr
                  key={inf.id}
                  onClick={() => router.push(`/informes/${inf.id}`)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium">
                    {formatNumInforme(inf.prefijo, inf.numero, inf.anio)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      {inf.oda.items.map((i) => (
                        <span key={i.ensayo.nombre} className="leading-snug">
                          {i.ensayo.nombre}
                          {i.ensayo.acreditadoINACAL && (
                            <span className="ml-1 text-xs text-green-600 font-medium">[INACAL]</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">{inf.oda.set.cliente.razonSocial}</td>
                  <td className="px-4 py-3 text-slate-600">{inf.analista.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <span>{fecha}</span>
                    {hora && (
                      <span className="ml-1.5 text-xs text-slate-400 font-mono">{hora}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge className={ESTADO_STYLES[inf.estado] ?? ''}>
                      {ESTADO_LABELS[inf.estado] ?? inf.estado}
                    </Badge>
                  </td>
                </tr>
              )
            })}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No hay informes</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">{filtrados.length} informe{filtrados.length !== 1 ? 's' : ''}</p>
    </div>
  )
}
