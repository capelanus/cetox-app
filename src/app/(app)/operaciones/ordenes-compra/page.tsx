import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { formatNumOrdenCompra, formatFecha } from '@/lib/format'
import { ESTADO_OC_LABELS } from '@/lib/constants'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function OrdenesCompraPage() {
  await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  const ocs = await prisma.ordenCompra.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      proveedor: true,
      requerimiento: true,
      emitidoPor: true,
    },
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>Órdenes de Compra</h1>
          <p className="text-gray-500 text-sm">{ocs.length} orden(es)</p>
        </div>
        <Link href="/operaciones/ordenes-compra/nueva">
          <Button className="bg-[#13602C] hover:bg-[#0e4a21] text-white">
            <Plus className="w-4 h-4 mr-2" />Nueva OC
          </Button>
        </Link>
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
            {ocs.map(oc => (
              <tr key={oc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/operaciones/ordenes-compra/${oc.id}`} className="font-mono text-[#13602C] font-medium hover:underline">
                    {formatNumOrdenCompra(oc.numero, oc.anio)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-700">{oc.proveedor.razonSocial}</td>
                <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{oc.requerimiento.descripcion}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">{oc.moneda} {oc.total.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    oc.estado === 'CERRADA' ? 'bg-green-100 text-green-700' :
                    oc.estado === 'EN_TRANSITO' ? 'bg-blue-100 text-blue-700' :
                    oc.estado === 'RECIBIDA' ? 'bg-purple-100 text-purple-700' :
                    oc.estado === 'CANCELADA' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {ESTADO_OC_LABELS[oc.estado] || oc.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{formatFecha(oc.createdAt)}</td>
              </tr>
            ))}
            {ocs.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">No hay órdenes de compra</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
