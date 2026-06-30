import { requireRol, hasRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ShoppingCart, Paperclip } from 'lucide-react'
import { formatNumCotizacionProveedor, formatFecha } from '@/lib/format'
import { ESTADO_COT_PROVEEDOR_LABELS } from '@/lib/constants'
import AprobacionControls from '../aprobacion-client'

export default async function CotizacionProveedorDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA', 'DIRECTOR_CALIDAD'])
  const { id } = await params
  const rol = session.user.rol

  const cot = await prisma.cotizacionProveedor.findUnique({
    where: { id },
    include: {
      proveedor: true,
      requerimiento: { include: { items: true } },
      items: { orderBy: { orden: 'asc' } },
      creadoPor: true,
      aprobadoPor: true,
    },
  })
  if (!cot) notFound()

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/operaciones/cotizaciones-proveedor">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Volver</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
            {formatNumCotizacionProveedor(cot.numero, cot.anio)}
          </h1>
          <p className="text-sm text-gray-500">{cot.proveedor.razonSocial}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {cot.archivoUrl && (
            <a
              href={cot.archivoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-[#13602C] text-[#13602C] hover:bg-green-50 transition-colors font-medium"
            >
              <Paperclip className="w-3.5 h-3.5" />
              Ver documento adjunto
            </a>
          )}
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${
            cot.estado === 'APROBADA' ? 'bg-green-100 text-green-700' :
            cot.estado === 'RECHAZADA' ? 'bg-red-100 text-red-700' :
            cot.estado === 'ENVIADA_CALIDAD' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {ESTADO_COT_PROVEEDOR_LABELS[cot.estado] || cot.estado}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Proveedor:</span>{' '}
          <Link href={`/operaciones/proveedores/${cot.proveedorId}`} className="font-medium text-[#13602C] hover:underline">
            {cot.proveedor.razonSocial}
          </Link>
        </div>
        <div>
          <span className="text-gray-500">Requerimiento:</span>{' '}
          <Link href={`/operaciones/requerimientos/${cot.requerimientoId}`} className="font-medium text-[#13602C] hover:underline">
            {cot.requerimiento.descripcion.substring(0, 40)}
          </Link>
        </div>
        <div>
          <span className="text-gray-500">Creado por:</span>{' '}
          <span className="font-medium">{cot.creadoPor.nombre}</span>
        </div>
        <div>
          <span className="text-gray-500">Moneda:</span>{' '}
          <span className="font-medium">{cot.moneda}</span>
        </div>
        {cot.plazoEntregaDias && (
          <div>
            <span className="text-gray-500">Plazo entrega:</span>{' '}
            <span className="font-medium">{cot.plazoEntregaDias} días</span>
          </div>
        )}
        {cot.validezDias && (
          <div>
            <span className="text-gray-500">Validez:</span>{' '}
            <span className="font-medium">{cot.validezDias} días</span>
          </div>
        )}
        {cot.condicionesPago && (
          <div>
            <span className="text-gray-500">Condiciones pago:</span>{' '}
            <span className="font-medium">{cot.condicionesPago}</span>
          </div>
        )}
        <div>
          <span className="text-gray-500">Fecha:</span>{' '}
          <span className="font-medium">{formatFecha(cot.createdAt)}</span>
        </div>
        {cot.observaciones && (
          <div className="col-span-3">
            <span className="text-gray-500">Observaciones:</span>{' '}
            <span className="font-medium">{cot.observaciones}</span>
          </div>
        )}
        {cot.aprobadoPor && (
          <div className="col-span-3">
            <span className="text-gray-500">{cot.estado === 'APROBADA' ? 'Aprobado por:' : 'Revisado por:'}</span>{' '}
            <span className="font-medium">{cot.aprobadoPor.nombre}</span>
            {cot.fechaAprobacion && <span className="text-gray-500"> el {formatFecha(cot.fechaAprobacion)}</span>}
          </div>
        )}
        {cot.motivoRechazo && (
          <div className="col-span-3">
            <span className="text-gray-500">Motivo rechazo:</span>{' '}
            <span className="font-medium text-red-600">{cot.motivoRechazo}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-700">Ítems cotizados</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">#</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Descripción</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Cantidad</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Unidad</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">P. Unit.</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cot.items.map((item, i) => (
              <tr key={item.id}>
                <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                <td className="px-4 py-2">{item.descripcion}</td>
                <td className="px-4 py-2 text-right font-mono">{item.cantidad}</td>
                <td className="px-4 py-2 text-gray-600">{item.unidad}</td>
                <td className="px-4 py-2 text-right font-mono">{item.precioUnitario.toFixed(2)}</td>
                <td className="px-4 py-2 text-right font-mono">{item.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t border-gray-200">
            <tr>
              <td colSpan={5} className="px-4 py-2 text-right text-gray-500">Subtotal:</td>
              <td className="px-4 py-2 text-right font-mono">{cot.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={5} className="px-4 py-2 text-right text-gray-500">IGV (18%):</td>
              <td className="px-4 py-2 text-right font-mono">{cot.igv.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={5} className="px-4 py-2 text-right font-bold text-[#13602C]">Total {cot.moneda}:</td>
              <td className="px-4 py-2 text-right font-bold font-mono text-[#13602C]">{cot.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        {/* Approve/Reject (director calidad) — inline desde el detalle */}
        {hasRol(rol, 'DIRECTOR_CALIDAD') && cot.estado === 'ENVIADA_CALIDAD' && (
          <AprobacionControls cotId={id} />
        )}

        {/* Create OC if approved */}
        {hasRol(rol, 'JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA') && cot.estado === 'APROBADA' && (
          <Link href={`/operaciones/ordenes-compra/nueva?req=${cot.requerimientoId}&cot=${cot.id}`}>
            <Button className="bg-[#13602C] hover:bg-[#0e4a21] text-white">
              <ShoppingCart className="w-4 h-4 mr-2" />Crear Orden de Compra
            </Button>
          </Link>
        )}

        {/* Link back to requerimiento */}
        <Link href={`/operaciones/requerimientos/${cot.requerimientoId}`}>
          <Button variant="outline">Ver requerimiento completo</Button>
        </Link>
      </div>
    </div>
  )
}
