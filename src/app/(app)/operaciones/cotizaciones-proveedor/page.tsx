import { requireRol, hasRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { formatNumCotizacionProveedor, formatFecha } from '@/lib/format'
import { ESTADO_COT_PROVEEDOR_LABELS } from '@/lib/constants'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function CotizacionesProveedorPage() {
  const session = await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA', 'DIRECTOR_CALIDAD'])
  const rol = session.user.rol

  const cotizaciones = await prisma.cotizacionProveedor.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      proveedor: true,
      requerimiento: true,
      creadoPor: true,
      aprobadoPor: true,
    },
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Cotizaciones de Proveedor
          </h1>
          <p className="text-gray-500 text-sm">{cotizaciones.length} cotización(es)</p>
        </div>
        {hasRol(rol, 'JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA') && (
          <Link href="/operaciones/cotizaciones-proveedor/nueva">
            <Button className="bg-[#13602C] hover:bg-[#0e4a21] text-white">
              <Plus className="w-4 h-4 mr-2" />Nueva cotización
            </Button>
          </Link>
        )}
      </div>

      {/* Pending approval for DIRECTOR_CALIDAD */}
      {hasRol(rol, 'DIRECTOR_CALIDAD') && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800">
            Pendientes de aprobación: {cotizaciones.filter(c => c.estado === 'ENVIADA_CALIDAD').length}
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Número</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Proveedor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Requerimiento</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cotizaciones.map(cot => (
              <tr key={cot.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/operaciones/cotizaciones-proveedor/${cot.id}`} className="font-mono text-[#13602C] font-medium hover:underline">
                    {formatNumCotizacionProveedor(cot.numero, cot.anio)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-700">{cot.proveedor.razonSocial}</td>
                <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{cot.requerimiento.descripcion}</td>
                <td className="px-4 py-3 font-mono text-gray-700">{cot.moneda} {cot.total.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    cot.estado === 'APROBADA' ? 'bg-green-100 text-green-700' :
                    cot.estado === 'RECHAZADA' ? 'bg-red-100 text-red-700' :
                    cot.estado === 'ENVIADA_CALIDAD' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {ESTADO_COT_PROVEEDOR_LABELS[cot.estado] || cot.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{formatFecha(cot.createdAt)}</td>
              </tr>
            ))}
            {cotizaciones.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">No hay cotizaciones registradas</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
