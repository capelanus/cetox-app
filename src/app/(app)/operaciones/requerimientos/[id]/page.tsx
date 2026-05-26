import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus } from 'lucide-react'
import { formatNumRequerimiento, formatFecha } from '@/lib/format'
import { AREA_SOLICITANTE_LABELS, ESTADO_REQUERIMIENTO_LABELS } from '@/lib/constants'
import { enviarRequerimiento } from '@/app/actions/requerimientos'

export default async function RequerimientoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  const { id } = await params
  const req = await prisma.requerimiento.findUnique({
    where: { id },
    include: {
      items: { orderBy: { orden: 'asc' } },
      creadoPor: true,
      cotizacionesProveedor: {
        include: { proveedor: true },
        orderBy: { createdAt: 'desc' },
      },
      ordenesCompra: {
        include: { proveedor: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!req) notFound()

  const enviar = enviarRequerimiento.bind(null, id)
  const puedeEnviar = req.estado === 'BORRADOR'

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/operaciones/requerimientos">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Volver</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
            {formatNumRequerimiento(req.numero, req.anio)}
          </h1>
          <p className="text-sm text-gray-500">{req.descripcion}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${req.estado === 'CERRADO' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {ESTADO_REQUERIMIENTO_LABELS[req.estado] || req.estado}
          </span>
          {puedeEnviar && (
            <form action={enviar}>
              <Button type="submit" size="sm" className="bg-[#13602C] hover:bg-[#0e4a21] text-white">
                Enviar para cotizar
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Área:</span>{' '}
            <span className="font-medium">{AREA_SOLICITANTE_LABELS[req.areaSolicitante] || req.areaSolicitante}</span>
          </div>
          <div>
            <span className="text-gray-500">Urgencia:</span>{' '}
            <span className={`font-medium ${req.urgencia === 'MUY_URGENTE' ? 'text-red-600' : req.urgencia === 'URGENTE' ? 'text-amber-600' : 'text-gray-700'}`}>
              {req.urgencia}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Solicitado por:</span>{' '}
            <span className="font-medium">{req.creadoPor.nombre}</span>
          </div>
          <div>
            <span className="text-gray-500">Fecha:</span>{' '}
            <span className="font-medium">{formatFecha(req.createdAt)}</span>
          </div>
          {req.fechaRequerida && (
            <div>
              <span className="text-gray-500">Fecha requerida:</span>{' '}
              <span className="font-medium">{formatFecha(req.fechaRequerida)}</span>
            </div>
          )}
          {req.justificacion && (
            <div className="col-span-3">
              <span className="text-gray-500">Justificación:</span>{' '}
              <span className="font-medium">{req.justificacion}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-700">Productos / Servicios</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">#</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Descripción</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Cantidad</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Unidad</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Especificaciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {req.items.map((item, i) => (
              <tr key={item.id}>
                <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                <td className="px-4 py-2 font-medium">{item.descripcion}</td>
                <td className="px-4 py-2">{item.cantidad}</td>
                <td className="px-4 py-2 text-gray-600">{item.unidad}</td>
                <td className="px-4 py-2 text-gray-500">{item.especificaciones || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cotizaciones de proveedor */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="font-semibold text-gray-700">Cotizaciones de Proveedor</span>
          {req.estado !== 'BORRADOR' && req.estado !== 'CERRADO' && req.estado !== 'CANCELADO' && (
            <Link href={`/operaciones/cotizaciones-proveedor/nueva?req=${req.id}`}>
              <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" />Agregar cotización</Button>
            </Link>
          )}
        </div>
        {req.cotizacionesProveedor.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">Sin cotizaciones de proveedor</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Proveedor</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Total</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {req.cotizacionesProveedor.map(cot => (
                <tr key={cot.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link href={`/operaciones/cotizaciones-proveedor/${cot.id}`} className="text-[#13602C] hover:underline">
                      {cot.proveedor.razonSocial}
                    </Link>
                  </td>
                  <td className="px-4 py-2 font-mono">{cot.moneda} {cot.total.toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cot.estado === 'APROBADA' ? 'bg-green-100 text-green-700' : cot.estado === 'RECHAZADA' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {cot.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Órdenes de compra */}
      {req.ordenesCompra.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-700">Órdenes de Compra</div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">OC</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Proveedor</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Total</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {req.ordenesCompra.map(oc => (
                <tr key={oc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link href={`/operaciones/ordenes-compra/${oc.id}`} className="font-mono text-[#13602C] hover:underline">
                      OC-{String(oc.numero).padStart(4, '0')}-{oc.anio}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{oc.proveedor.razonSocial}</td>
                  <td className="px-4 py-2 font-mono">{oc.moneda} {oc.total.toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{oc.estado}</span>
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
