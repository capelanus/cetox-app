import { requireRol, hasRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { formatFecha } from '@/lib/format'
import { ESTADO_FACTURA_LABELS } from '@/lib/constants'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { obtenerAlertasVencimiento } from '@/lib/alertas'
import { AlertasVencimientoBanner } from '@/components/alertas-vencimiento'

export default async function FacturasPage() {
  const session = await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA', 'DIRECTOR_CALIDAD', 'COORDINADOR_CALIDAD'])
  const rol = session.user.rol

  const [facturas, alertas] = await Promise.all([
    prisma.factura.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        ordenCompra: { include: { proveedor: true } },
        registradoPor: true,
        provision: true,
      },
    }),
    obtenerAlertasVencimiento(),
  ])

  return (
    <div className="p-6 space-y-6">
      <AlertasVencimientoBanner alertas={alertas} tipo="FACTURA_PROVEEDOR" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>Facturas</h1>
          <p className="text-gray-500 text-sm">{facturas.length} factura(s)</p>
        </div>
        {hasRol(rol, 'JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA') && (
          <Link href="/operaciones/facturas/nueva">
            <Button className="bg-[#13602C] hover:bg-[#0e4a21] text-white">
              <Plus className="w-4 h-4 mr-2" />Registrar factura
            </Button>
          </Link>
        )}
      </div>

      {hasRol(rol, 'DIRECTOR_CALIDAD') && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-medium text-blue-800">
            Pendientes de provisión: {facturas.filter(f => f.estado === 'REGISTRADA').length}
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Factura</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Proveedor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha emisión</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Vencimiento</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {facturas.map(fac => (
              <tr key={fac.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/operaciones/facturas/${fac.id}`} className="font-medium text-[#13602C] hover:underline">
                    {fac.serie ? `${fac.serie}-${fac.numero}` : fac.numero}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-700">{fac.ordenCompra.proveedor.razonSocial}</td>
                <td className="px-4 py-3 text-gray-600">{formatFecha(fac.fechaEmision)}</td>
                <td className="px-4 py-3 text-gray-600">{fac.fechaVencimiento ? formatFecha(fac.fechaVencimiento) : '—'}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">{fac.moneda} {fac.total.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    fac.estado === 'PAGADA' ? 'bg-green-100 text-green-700' :
                    fac.estado === 'EN_PROVISION' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {ESTADO_FACTURA_LABELS[fac.estado] || fac.estado}
                  </span>
                </td>
              </tr>
            ))}
            {facturas.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">No hay facturas registradas</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
