import { requireNotAnalista, hasRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatFecha, formatNumSET } from '@/lib/format'
import { Plus } from 'lucide-react'

const ESTADO_LABELS: Record<string, string> = {
  EMITIDA: 'Emitida',
  VALIDADA_CLIENTE: 'Validada',
  EN_EJECUCION: 'En ejecución',
  FINALIZADA: 'Finalizada',
  ENTREGADA: 'Entregada',
}

const ESTADO_COLORS: Record<string, string> = {
  EMITIDA: 'secondary',
  VALIDADA_CLIENTE: 'outline',
  EN_EJECUCION: 'default',
  FINALIZADA: 'default',
  ENTREGADA: 'default',
}

const MOTIVO_LABELS: Record<string, string> = {
  REENSAYO: 'Reensayo',
  INGRESOS_INTERNOS: 'Interno',
  MODIFICACION_SIN_COSTO: 'Modificación',
}

export default async function SETPage() {
  const session = await requireNotAnalista()
  const sets = await prisma.sET.findMany({
    include: { cliente: true, creadoPor: true, odas: true },
    orderBy: [{ anio: 'desc' }, { numero: 'desc' }],
  })
  const canCreate = hasRol(session?.user.rol ?? '', 'ADMINISTRACION')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Solicitudes de Ensayo (SET)</h1>
        {canCreate && (
          <Link href="/set/nuevo-cero">
            <Button variant="outline" className="border-dashed" style={{ borderColor: '#4AC3B2', color: '#13602C' }}>
              <Plus className="h-4 w-4 mr-2" />
              SET sin costo
            </Button>
          </Link>
        )}
      </div>

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
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sets.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
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
                <td className="px-4 py-3">
                  <Badge
                    className={s.estado === 'EN_EJECUCION' ? 'bg-blue-100 text-blue-700' : ''}
                    variant={ESTADO_COLORS[s.estado] as 'default' | 'secondary' | 'outline' ?? 'secondary'}
                  >
                    {ESTADO_LABELS[s.estado] ?? s.estado}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/set/${s.id}`} className="text-blue-600 hover:underline text-sm">Ver</Link>
                </td>
              </tr>
            ))}
            {sets.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">No hay SETs registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
