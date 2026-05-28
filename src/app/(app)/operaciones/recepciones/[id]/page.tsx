import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { formatNumRecepcion, formatFecha } from '@/lib/format'
import { ESTADO_RECEPCION_LABELS } from '@/lib/constants'
import { registrarEntregaArea } from '@/app/actions/recepciones'
import ActaBtn from './acta-btn'

export default async function RecepcionDetallePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  const { id } = await params

  const rec = await prisma.recepcion.findUnique({
    where: { id },
    include: {
      ordenCompra: { include: { proveedor: true } },
      recibidoPor: true,
      items: true,
      devoluciones: { orderBy: { fechaDevolucion: 'desc' } },
    },
  })
  if (!rec) notFound()

  const entregarArea = registrarEntregaArea.bind(null, id)
  const tieneNoConformes = rec.items.some(item => !item.conforme)

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/operaciones/recepciones">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Volver</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
            {formatNumRecepcion(rec.numero, rec.anio)}
          </h1>
          <p className="text-sm text-gray-500">{rec.ordenCompra.proveedor.razonSocial}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <ActaBtn
            numero={rec.numero}
            anio={rec.anio}
            fechaRecepcion={rec.fechaRecepcion.toISOString()}
            ocNumero={`OC-${String(rec.ordenCompra.numero).padStart(4, '0')}-${rec.ordenCompra.anio}`}
            proveedor={rec.ordenCompra.proveedor.razonSocial}
            recibidoPor={rec.recibidoPor.nombre}
            items={rec.items.map(item => ({
              descripcion: item.descripcion,
              cantidadEsperada: item.cantidadEsperada,
              cantidadRecibida: item.cantidadRecibida,
              unidad: item.unidad,
              conforme: item.conforme,
              observacion: item.observacion,
            }))}
          />
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${
            rec.estado === 'CONFORME' || rec.estado === 'ENTREGADO_AREA' ? 'bg-green-100 text-green-700' :
            rec.estado === 'NO_CONFORME' ? 'bg-red-100 text-red-700' :
            'bg-amber-100 text-amber-700'
          }`}>
            {ESTADO_RECEPCION_LABELS[rec.estado] || rec.estado}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-500">OC:</span>{' '}
          <Link href={`/operaciones/ordenes-compra/${rec.ordenCompraId}`} className="font-medium text-[#13602C] hover:underline">
            OC-{String(rec.ordenCompra.numero).padStart(4, '0')}-{rec.ordenCompra.anio}
          </Link>
        </div>
        <div>
          <span className="text-gray-500">Proveedor:</span>{' '}
          <span className="font-medium">{rec.ordenCompra.proveedor.razonSocial}</span>
        </div>
        <div>
          <span className="text-gray-500">Recibido por:</span>{' '}
          <span className="font-medium">{rec.recibidoPor.nombre}</span>
        </div>
        <div>
          <span className="text-gray-500">Fecha recepción:</span>{' '}
          <span className="font-medium">{formatFecha(rec.fechaRecepcion)}</span>
        </div>
        {rec.entregadoAlAreaFecha && (
          <div>
            <span className="text-gray-500">Entregado al área:</span>{' '}
            <span className="font-medium">{formatFecha(rec.entregadoAlAreaFecha)}</span>
          </div>
        )}
        {rec.entregadoAlAreaPor && (
          <div>
            <span className="text-gray-500">Entregado por:</span>{' '}
            <span className="font-medium">{rec.entregadoAlAreaPor}</span>
          </div>
        )}
        {rec.observaciones && (
          <div className="col-span-3">
            <span className="text-gray-500">Observaciones:</span>{' '}
            <span className="font-medium">{rec.observaciones}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-700">Ítems recepcionados</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Descripción</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Esperado</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Recibido</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Unidad</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Conforme</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Observación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rec.items.map(item => (
              <tr key={item.id} className={!item.conforme ? 'bg-red-50' : ''}>
                <td className="px-4 py-2">{item.descripcion}</td>
                <td className="px-4 py-2 text-right font-mono">{item.cantidadEsperada}</td>
                <td className="px-4 py-2 text-right font-mono">{item.cantidadRecibida}</td>
                <td className="px-4 py-2 text-gray-600">{item.unidad}</td>
                <td className="px-4 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${item.conforme ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {item.conforme ? 'Sí' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-500">{item.observacion || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        {tieneNoConformes && rec.estado === 'NO_CONFORME' && (
          <Link href={`/operaciones/devoluciones/nueva?rec=${rec.id}`}>
            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
              <RotateCcw className="w-4 h-4 mr-2" />Registrar devolución
            </Button>
          </Link>
        )}
      </div>

      {/* Entrega al área */}
      {rec.estado === 'CONFORME' && !rec.entregadoAlAreaFecha && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Registrar entrega al área</h2>
          <form action={entregarArea} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entregado por</label>
                <input name="entregadoAlAreaPor" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input type="checkbox" id="conformeArea" name="conformeArea" value="true" className="rounded" defaultChecked />
                <label htmlFor="conformeArea" className="text-sm text-gray-700">El área está conforme</label>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones del área</label>
                <textarea name="observacionesArea" rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
              </div>
            </div>
            <Button type="submit" className="bg-[#13602C] hover:bg-[#0e4a21] text-white">Registrar entrega</Button>
          </form>
        </div>
      )}

      {/* Devoluciones */}
      {rec.devoluciones.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-700">Devoluciones</div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Número</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Tipo</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Motivo</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Estado</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rec.devoluciones.map(dev => (
                <tr key={dev.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link href={`/operaciones/devoluciones/${dev.id}`} className="font-mono text-[#13602C] hover:underline">
                      DEV-{String(dev.numero).padStart(4, '0')}-{dev.anio}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{dev.tipo}</td>
                  <td className="px-4 py-2 text-gray-600">{dev.motivo}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${dev.estado === 'PROCESADA' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {dev.estado}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-500">{formatFecha(dev.fechaDevolucion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
