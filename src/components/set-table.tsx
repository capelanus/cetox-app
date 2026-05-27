'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { formatFecha, formatNumSET } from '@/lib/format'

const ESTADO_LABELS: Record<string, string> = {
  EMITIDA: 'Emitida',
  VALIDADA_CLIENTE: 'Validada',
  EN_EJECUCION: 'En ejecución',
  FINALIZADA: 'Finalizada',
  ENTREGADA: 'Entregada',
}

const MOTIVO_LABELS: Record<string, string> = {
  REENSAYO: 'Reensayo',
  INGRESOS_INTERNOS: 'Interno',
  MODIFICACION_SIN_COSTO: 'Modificación',
}

interface SETRow {
  id: string
  numero: number
  anio: number
  estado: string
  motivoCero: string | null
  nombreComercial: string | null
  codigoMuestra: string | null
  fechaIngreso: Date | string
  cliente: { razonSocial: string }
  odas: { id: string }[]
}

interface Props {
  sets: SETRow[]
}

export function SETTable({ sets }: Props) {
  const router = useRouter()

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">SET</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Cliente</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Muestra</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Código muestra</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Ingreso</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">ODAs</th>
            <th className="text-right px-4 py-3 font-semibold text-slate-600">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {sets.map((s) => (
            <tr
              key={s.id}
              onClick={() => router.push(`/set/${s.id}`)}
              className="hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3">
                <span className="font-mono text-xs font-medium">{formatNumSET(s.numero, s.anio)}</span>
                {s.motivoCero && (
                  <span
                    className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: '#DCF0E4', color: '#13602C' }}
                  >
                    {MOTIVO_LABELS[s.motivoCero] ?? s.motivoCero}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">{s.cliente.razonSocial}</td>
              <td className="px-4 py-3 font-medium">{s.nombreComercial}</td>
              <td className="px-4 py-3 font-mono text-xs">{s.codigoMuestra}</td>
              <td className="px-4 py-3 text-slate-600">{formatFecha(s.fechaIngreso)}</td>
              <td className="px-4 py-3">{s.odas.length}</td>
              <td className="px-4 py-3 text-right">
                <Badge
                  className={s.estado === 'EN_EJECUCION' ? 'bg-blue-100 text-blue-700' : ''}
                  variant={(['EMITIDA', 'VALIDADA_CLIENTE'].includes(s.estado) ? 'secondary' : 'outline') as 'default' | 'secondary' | 'outline'}
                >
                  {ESTADO_LABELS[s.estado] ?? s.estado}
                </Badge>
              </td>
            </tr>
          ))}
          {sets.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-slate-400">No hay SETs registrados</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
