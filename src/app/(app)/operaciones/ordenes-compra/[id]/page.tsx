import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, PackageCheck, Receipt } from 'lucide-react'
import { formatNumOrdenCompra, formatNumRecepcion, formatFecha } from '@/lib/format'
import { ESTADO_OC_LABELS } from '@/lib/constants'
import { actualizarEstadoOC } from '@/app/actions/ordenes-compra'

export default async function OrdenCompraDetallePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  const { id } = await params

  const oc = await prisma.ordenCompra.findUnique({
    where: { id },
    include: {
      proveedor: true,
      requerimiento: true,
      cotizacionProveedor: true,
      items: { orderBy: { orden: 'asc' } },
      emitidoPor: true,
      recepciones: {
        include: { recibidoPor: true },
        orderBy: { fechaRecepcion: 'desc' },
      },
      facturas: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!oc) notFound()

  const confirmarProveedor = actualizarEstadoOC.bind(null, id, 'CONFIRMADA_PROVEEDOR')
  const marcarEnTransito = actualizarEstadoOC.bind(null, id, 'EN_TRANSITO')

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/operaciones/ordenes-compra">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Volver</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
            {formatNumOrdenCompra(oc.numero, oc.anio)}
          </h1>
          <p className="text-sm text-gray-500">{oc.proveedor.razonSocial}</p>
        </div>
        <div className="ml-auto">
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${
            oc.estado === 'CERRADA' ? 'bg-green-100 text-green-700' :
            oc.estado === 'EN_TRANSITO' ? 'bg-blue-100 text-blue-700' :
            oc.estado === 'RECIBIDA' ? 'bg-purple-100 text-purple-700' :
            oc.estado === 'CANCELADA' ? 'bg-red-100 text-red-700' :
            'bg-amber-100 text-amber-700'
          }`}>
            {ESTADO_OC_LABELS[oc.estado] || oc.estado}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Proveedor:</span>{' '}
          <Link href={`/operaciones/proveedores/${oc.proveedorId}`} className="font-medium text-[#13602C] hover:underline">
            {oc.proveedor.razonSocial}
          </Link>
        </div>
        <div>
          <span className="text-gray-500">Requerimiento:</span>{' '}
          <Link href={`/operaciones/requerimientos/${oc.requerimientoId}`} className="font-medium text-[#13602C] hover:underline">
            {oc.requerimiento.descripcion.substring(0, 40)}
          </Link>
        </div>
        <div>
          <span className="text-gray-500">Emitido por:</span>{' '}
          <span className="font-medium">{oc.emitidoPor.nombre}</span>
        </div>
        <div>
          <span className="text-gray-500">Moneda:</span>{' '}
          <span className="font-medium">{oc.moneda}</span>
        </div>
        {oc.condicionesPago && (
          <div>
            <span className="text-gray-500">Condiciones pago:</span>{' '}
            <span className="font-medium">{oc.condicionesPago}</span>
          </div>
        )}
        {oc.lugarEntrega && (
          <div>
            <span className="text-gray-500">Lugar entrega:</span>{' '}
            <span className="font-medium">{oc.lugarEntrega}</span>
          </div>
        )}
        {oc.fechaEntregaEstimada && (
          <div>
            <span className="text-gray-500">Entrega estimada:</span>{' '}
            <span className="font-medium">{formatFecha(oc.fechaEntregaEstimada)}</span>
          </div>
        )}
        {oc.fechaConfirmacionProveedor && (
          <div>
            <span className="text-gray-500">Confirmado proveedor:</span>{' '}
            <span className="font-medium">{formatFecha(oc.fechaConfirmacionProveedor)}</span>
          </div>
        )}
        <div>
          <span className="text-gray-500">Fecha emisión:</span>{' '}
          <span className="font-medium">{formatFecha(oc.createdAt)}</span>
        </div>
        {oc.observaciones && (
          <div className="col-span-3">
            <span className="text-gray-500">Observaciones:</span>{' '}
            <span className="font-medium">{oc.observaciones}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-700">Ítems</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">#</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Descripción</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Cant.</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Recibida</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Unidad</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">P. Unit.</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {oc.items.map((item, i) => (
              <tr key={item.id}>
                <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                <td className="px-4 py-2">{item.descripcion}</td>
                <td className="px-4 py-2 text-right font-mono">{item.cantidad}</td>
                <td className="px-4 py-2 text-right font-mono text-gray-500">{item.cantidadRecibida}</td>
                <td className="px-4 py-2 text-gray-600">{item.unidad}</td>
                <td className="px-4 py-2 text-right font-mono">{item.precioUnitario.toFixed(2)}</td>
                <td className="px-4 py-2 text-right font-mono">{item.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t border-gray-200">
            <tr>
              <td colSpan={6} className="px-4 py-2 text-right text-gray-500">Subtotal:</td>
              <td className="px-4 py-2 text-right font-mono">{oc.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={6} className="px-4 py-2 text-right text-gray-500">IGV (18%):</td>
              <td className="px-4 py-2 text-right font-mono">{oc.igv.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={6} className="px-4 py-2 text-right font-bold text-[#13602C]">Total {oc.moneda}:</td>
              <td className="px-4 py-2 text-right font-bold font-mono text-[#13602C]">{oc.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        {oc.estado === 'EMITIDA' && (
          <form action={confirmarProveedor}>
            <Button type="submit" variant="outline">Confirmar por proveedor</Button>
          </form>
        )}
        {(oc.estado === 'EMITIDA' || oc.estado === 'CONFIRMADA_PROVEEDOR') && (
          <form action={marcarEnTransito}>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Marcar en tránsito</Button>
          </form>
        )}
        {(oc.estado === 'EN_TRANSITO' || oc.estado === 'CONFIRMADA_PROVEEDOR') && (
          <Link href={`/operaciones/recepciones/nueva?oc=${oc.id}`}>
            <Button className="bg-[#13602C] hover:bg-[#0e4a21] text-white">
              <PackageCheck className="w-4 h-4 mr-2" />Registrar recepción
            </Button>
          </Link>
        )}
        {oc.estado === 'RECIBIDA' && oc.facturas.length === 0 && (
          <Link href={`/operaciones/facturas/nueva?oc=${oc.id}`}>
            <Button className="bg-[#13602C] hover:bg-[#0e4a21] text-white">
              <Receipt className="w-4 h-4 mr-2" />Registrar factura
            </Button>
          </Link>
        )}
      </div>

      {/* Recepciones */}
      {oc.recepciones.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-700">Recepciones</div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Número</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Fecha</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Recibido por</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {oc.recepciones.map(rec => (
                <tr key={rec.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link href={`/operaciones/recepciones/${rec.id}`} className="font-mono text-[#13602C] hover:underline">
                      {formatNumRecepcion(rec.numero, rec.anio)}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{formatFecha(rec.fechaRecepcion)}</td>
                  <td className="px-4 py-2">{rec.recibidoPor.nombre}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${rec.estado === 'CONFORME' ? 'bg-green-100 text-green-700' : rec.estado === 'NO_CONFORME' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {rec.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Facturas */}
      {oc.facturas.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-700">Facturas</div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Factura</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Fecha emisión</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">Total</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {oc.facturas.map(fac => (
                <tr key={fac.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link href={`/operaciones/facturas/${fac.id}`} className="text-[#13602C] hover:underline">
                      {fac.serie ? `${fac.serie}-${fac.numero}` : fac.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{formatFecha(fac.fechaEmision)}</td>
                  <td className="px-4 py-2 text-right font-mono">{fac.moneda} {fac.total.toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${fac.estado === 'PAGADA' ? 'bg-green-100 text-green-700' : fac.estado === 'EN_PROVISION' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {fac.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
