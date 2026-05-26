import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { formatNumPago, formatFecha } from '@/lib/format'
import { ESTADO_PAGO_LABELS, MEDIO_PAGO_LABELS } from '@/lib/constants'
import { confirmarPagoAlProveedor } from '@/app/actions/pagos-proveedor'

export default async function PagoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol(['DIRECTOR_CALIDAD'])
  const { id } = await params

  const pago = await prisma.pago.findUnique({
    where: { id },
    include: {
      provision: {
        include: {
          factura: {
            include: {
              ordenCompra: { include: { proveedor: true } },
            },
          },
          aprobadoPor: true,
        },
      },
      aprobadoPor: true,
    },
  })
  if (!pago) notFound()

  const confirmar = confirmarPagoAlProveedor.bind(null, id)

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/operaciones/pagos">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Volver</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
            {formatNumPago(pago.numero, pago.anio)}
          </h1>
          <p className="text-sm text-gray-500">{pago.provision.factura.ordenCompra.proveedor.razonSocial}</p>
        </div>
        <div className="ml-auto">
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${
            pago.estado === 'CONFIRMADO_PROVEEDOR' ? 'bg-green-100 text-green-700' :
            pago.estado === 'PAGADO' ? 'bg-blue-100 text-blue-700' :
            'bg-amber-100 text-amber-700'
          }`}>
            {ESTADO_PAGO_LABELS[pago.estado] || pago.estado}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Proveedor:</span>{' '}
          <span className="font-medium">{pago.provision.factura.ordenCompra.proveedor.razonSocial}</span>
        </div>
        <div>
          <span className="text-gray-500">Factura:</span>{' '}
          <Link href={`/operaciones/facturas/${pago.provision.facturaId}`} className="font-medium text-[#13602C] hover:underline">
            {pago.provision.factura.serie
              ? `${pago.provision.factura.serie}-${pago.provision.factura.numero}`
              : pago.provision.factura.numero}
          </Link>
        </div>
        <div>
          <span className="text-gray-500">Aprobado por:</span>{' '}
          <span className="font-medium">{pago.aprobadoPor.nombre}</span>
        </div>
        <div>
          <span className="text-gray-500">Monto:</span>{' '}
          <span className="font-bold text-[#13602C] font-mono">{pago.moneda} {pago.monto.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-500">Medio de pago:</span>{' '}
          <span className="font-medium">{MEDIO_PAGO_LABELS[pago.medioPago] || pago.medioPago}</span>
        </div>
        <div>
          <span className="text-gray-500">Fecha de pago:</span>{' '}
          <span className="font-medium">{formatFecha(pago.fechaPago)}</span>
        </div>
        {pago.referencia && (
          <div>
            <span className="text-gray-500">Referencia:</span>{' '}
            <span className="font-medium font-mono">{pago.referencia}</span>
          </div>
        )}
        {pago.confirmadoProveedor && pago.fechaConfirmacion && (
          <div>
            <span className="text-gray-500">Confirmado proveedor:</span>{' '}
            <span className="font-medium">{formatFecha(pago.fechaConfirmacion)}</span>
          </div>
        )}
        {pago.voucherUrl && (
          <div className="col-span-3">
            <span className="text-gray-500">Voucher:</span>{' '}
            <a href={pago.voucherUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-[#13602C] hover:underline">
              Ver voucher
            </a>
          </div>
        )}
      </div>

      {/* Provisión info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-700 mb-3">Provisión de pago</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Monto provisionado:</span>{' '}
            <span className="font-medium font-mono">{pago.moneda} {pago.provision.monto.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-500">Condición:</span>{' '}
            <span className="font-medium">{pago.provision.condicionPago.replace(/_/g, ' ')}</span>
          </div>
          <div>
            <span className="text-gray-500">Aprobado por:</span>{' '}
            <span className="font-medium">{pago.provision.aprobadoPor.nombre}</span>
          </div>
          {pago.provision.concepto && (
            <div className="col-span-3">
              <span className="text-gray-500">Concepto:</span>{' '}
              <span className="font-medium">{pago.provision.concepto}</span>
            </div>
          )}
        </div>
      </div>

      {/* Confirm payment */}
      {!pago.confirmadoProveedor && pago.estado === 'PAGADO' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Confirmar pago al proveedor</h2>
          <form action={confirmar} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL del voucher</label>
              <input name="voucherUrl" type="url" placeholder="https://..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
              Confirmar pago enviado al proveedor
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
