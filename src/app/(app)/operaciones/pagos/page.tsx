import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { formatNumPago, formatFecha } from '@/lib/format'
import { ESTADO_PAGO_LABELS, MEDIO_PAGO_LABELS } from '@/lib/constants'
import Link from 'next/link'
import { crearPago } from '@/app/actions/pagos-proveedor'
import { Button } from '@/components/ui/button'

export default async function PagosPage() {
  await requireRol(['DIRECTOR_CALIDAD'])

  const [pagos, provisiones] = await Promise.all([
    prisma.pago.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        provision: {
          include: {
            factura: { include: { ordenCompra: { include: { proveedor: true } } } },
          },
        },
        aprobadoPor: true,
      },
    }),
    prisma.provisionPago.findMany({
      where: { pago: null },
      include: {
        factura: { include: { ordenCompra: { include: { proveedor: true } } } },
        aprobadoPor: true,
      },
      orderBy: { fechaAprobacion: 'asc' },
    }),
  ])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>Gestión de Pagos</h1>
        <p className="text-gray-500 text-sm">{pagos.length} pago(s) registrado(s)</p>
      </div>

      {/* Provisiones pendientes de pago */}
      {provisiones.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-amber-100 bg-amber-50 font-semibold text-amber-800">
            Provisiones pendientes de pago ({provisiones.length})
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Proveedor</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Factura</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">Monto</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Condición</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {provisiones.map(prov => {
                const crearPagoAction = crearPago.bind(null, prov.id)
                return (
                  <tr key={prov.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{prov.factura.ordenCompra.proveedor.razonSocial}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {prov.factura.serie ? `${prov.factura.serie}-${prov.factura.numero}` : prov.factura.numero}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#13602C]">{prov.factura.moneda} {prov.monto.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600">{prov.condicionPago.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">
                      <form action={crearPagoAction} className="flex gap-2">
                        <select name="medioPago" className="border border-gray-300 rounded px-2 py-1 text-xs">
                          <option value="TRANSFERENCIA">Transferencia</option>
                          <option value="YAPE">Yape</option>
                          <option value="CHEQUE">Cheque</option>
                          <option value="EFECTIVO">Efectivo</option>
                        </select>
                        <input name="fechaPago" type="date" required className="border border-gray-300 rounded px-2 py-1 text-xs" defaultValue={new Date().toISOString().split('T')[0]} />
                        <input name="referencia" placeholder="Referencia" className="border border-gray-300 rounded px-2 py-1 text-xs w-24" />
                        <Button type="submit" size="sm" className="bg-[#13602C] hover:bg-[#0e4a21] text-white text-xs">
                          Pagar
                        </Button>
                      </form>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagos realizados */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-700">Historial de pagos</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Número</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Proveedor</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Monto</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Medio</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pagos.map(pago => (
              <tr key={pago.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/operaciones/pagos/${pago.id}`} className="font-mono text-[#13602C] font-medium hover:underline">
                    {formatNumPago(pago.numero, pago.anio)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {pago.provision.factura.ordenCompra.proveedor.razonSocial}
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">{pago.moneda} {pago.monto.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-600">{MEDIO_PAGO_LABELS[pago.medioPago] || pago.medioPago}</td>
                <td className="px-4 py-3 text-gray-600">{formatFecha(pago.fechaPago)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    pago.estado === 'CONFIRMADO_PROVEEDOR' ? 'bg-green-100 text-green-700' :
                    pago.estado === 'PAGADO' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {ESTADO_PAGO_LABELS[pago.estado] || pago.estado}
                  </span>
                </td>
              </tr>
            ))}
            {pagos.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">No hay pagos registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
