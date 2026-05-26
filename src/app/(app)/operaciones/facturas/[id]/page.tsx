import { requireRol, hasRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { formatFecha } from '@/lib/format'
import { ESTADO_FACTURA_LABELS, CONDICION_PAGO_LABELS } from '@/lib/constants'
import { crearProvisionPago } from '@/app/actions/facturas-proveedor'

export default async function FacturaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA', 'DIRECTOR_CALIDAD'])
  const { id } = await params
  const rol = session.user.rol

  const factura = await prisma.factura.findUnique({
    where: { id },
    include: {
      ordenCompra: { include: { proveedor: true } },
      registradoPor: true,
      provision: {
        include: {
          aprobadoPor: true,
          pago: true,
        },
      },
    },
  })
  if (!factura) notFound()

  const crearProvision = crearProvisionPago.bind(null, id)

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/operaciones/facturas">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Volver</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Factura {factura.serie ? `${factura.serie}-${factura.numero}` : factura.numero}
          </h1>
          <p className="text-sm text-gray-500">{factura.ordenCompra.proveedor.razonSocial}</p>
        </div>
        <div className="ml-auto">
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${
            factura.estado === 'PAGADA' ? 'bg-green-100 text-green-700' :
            factura.estado === 'EN_PROVISION' ? 'bg-blue-100 text-blue-700' :
            'bg-amber-100 text-amber-700'
          }`}>
            {ESTADO_FACTURA_LABELS[factura.estado] || factura.estado}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Proveedor:</span>{' '}
          <Link href={`/operaciones/proveedores/${factura.ordenCompra.proveedorId}`} className="font-medium text-[#13602C] hover:underline">
            {factura.ordenCompra.proveedor.razonSocial}
          </Link>
        </div>
        <div>
          <span className="text-gray-500">OC:</span>{' '}
          <Link href={`/operaciones/ordenes-compra/${factura.ordenCompraId}`} className="font-medium text-[#13602C] hover:underline">
            OC-{String(factura.ordenCompra.numero).padStart(4, '0')}-{factura.ordenCompra.anio}
          </Link>
        </div>
        <div>
          <span className="text-gray-500">Registrado por:</span>{' '}
          <span className="font-medium">{factura.registradoPor.nombre}</span>
        </div>
        <div>
          <span className="text-gray-500">Fecha emisión:</span>{' '}
          <span className="font-medium">{formatFecha(factura.fechaEmision)}</span>
        </div>
        {factura.fechaVencimiento && (
          <div>
            <span className="text-gray-500">Vencimiento:</span>{' '}
            <span className="font-medium">{formatFecha(factura.fechaVencimiento)}</span>
          </div>
        )}
        <div>
          <span className="text-gray-500">Moneda:</span>{' '}
          <span className="font-medium">{factura.moneda}</span>
        </div>
      </div>

      {/* Totales */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex justify-end">
          <div className="text-sm space-y-2 min-w-[220px]">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal:</span>
              <span className="font-mono">{factura.moneda} {factura.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">IGV (18%):</span>
              <span className="font-mono">{factura.moneda} {factura.igv.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-[#13602C] text-base border-t border-gray-200 pt-2">
              <span>Total:</span>
              <span className="font-mono">{factura.moneda} {factura.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Provisión */}
      {factura.provision ? (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-700">Provisión de pago</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Monto:</span>{' '}
              <span className="font-medium font-mono">{factura.moneda} {factura.provision.monto.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-500">Condición:</span>{' '}
              <span className="font-medium">{CONDICION_PAGO_LABELS[factura.provision.condicionPago] || factura.provision.condicionPago}</span>
            </div>
            <div>
              <span className="text-gray-500">Aprobado por:</span>{' '}
              <span className="font-medium">{factura.provision.aprobadoPor.nombre}</span>
            </div>
            {factura.provision.concepto && (
              <div className="col-span-3">
                <span className="text-gray-500">Concepto:</span>{' '}
                <span className="font-medium">{factura.provision.concepto}</span>
              </div>
            )}
          </div>
          {factura.provision.pago && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm">
              <p className="font-medium text-green-800">
                Pago registrado: PAG-{String(factura.provision.pago.numero).padStart(4, '0')}-{factura.provision.pago.anio}
              </p>
              <Link href={`/operaciones/pagos/${factura.provision.pago.id}`} className="text-xs text-green-700 hover:underline">
                Ver detalle del pago →
              </Link>
            </div>
          )}
        </div>
      ) : (
        hasRol(rol, 'DIRECTOR_CALIDAD') && factura.estado === 'REGISTRADA' && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-700 mb-4">Crear provisión de pago</h2>
            <form action={crearProvision} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condición de pago</label>
                  <select name="condicionPago" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]">
                    <option value="CREDITO_30">Crédito 30 días</option>
                    <option value="CREDITO_15">Crédito 15 días</option>
                    <option value="CONTRA_ENTREGA">Contra entrega</option>
                    <option value="ANTICIPO">Anticipo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
                  <input name="concepto" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                  <textarea name="observaciones" rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
                </div>
              </div>
              <Button type="submit" className="bg-[#13602C] hover:bg-[#0e4a21] text-white">
                Aprobar y crear provisión por {factura.moneda} {factura.total.toFixed(2)}
              </Button>
            </form>
          </div>
        )
      )}
    </div>
  )
}
