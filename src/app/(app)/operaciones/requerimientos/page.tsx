import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { formatNumRequerimiento, formatFecha } from '@/lib/format'
import { ESTADO_REQUERIMIENTO_LABELS, AREA_SOLICITANTE_LABELS } from '@/lib/constants'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function RequerimientosPage() {
  await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  const reqs = await prisma.requerimiento.findMany({
    orderBy: { createdAt: 'desc' },
    include: { creadoPor: true, items: true },
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>Requerimientos</h1>
          <p className="text-gray-500 text-sm">{reqs.length} requerimiento(s)</p>
        </div>
        <Link href="/operaciones/requerimientos/nuevo">
          <Button className="bg-[#13602C] hover:bg-[#0e4a21] text-white">
            <Plus className="w-4 h-4 mr-2" />Nuevo
          </Button>
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Número</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Área</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Descripción</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Urgencia</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reqs.map(req => (
              <tr key={req.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/operaciones/requerimientos/${req.id}`} className="font-mono text-[#13602C] font-medium hover:underline">
                    {formatNumRequerimiento(req.numero, req.anio)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{AREA_SOLICITANTE_LABELS[req.areaSolicitante] || req.areaSolicitante}</td>
                <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{req.descripcion}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${req.urgencia === 'MUY_URGENTE' ? 'bg-red-100 text-red-700' : req.urgencia === 'URGENTE' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                    {req.urgencia}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {ESTADO_REQUERIMIENTO_LABELS[req.estado] || req.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{formatFecha(req.createdAt)}</td>
              </tr>
            ))}
            {reqs.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">No hay requerimientos</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
