import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { formatFecha } from '@/lib/format'
import { procesarDevolucion } from '@/app/actions/devoluciones'

export default async function DevolucionDetallePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  const { id } = await params

  const dev = await prisma.devolucion.findUnique({
    where: { id },
    include: {
      recepcion: { include: { ordenCompra: { include: { proveedor: true } } } },
      gestionadoPor: true,
      items: true,
    },
  })
  if (!dev) notFound()

  const procesar = procesarDevolucion.bind(null, id)

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/operaciones/devoluciones">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Volver</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
            DEV-{String(dev.numero).padStart(4, '0')}-{dev.anio}
          </h1>
          <p className="text-sm text-gray-500">{dev.recepcion.ordenCompra.proveedor.razonSocial}</p>
        </div>
        <div className="ml-auto">
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${dev.estado === 'PROCESADA' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {dev.estado}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Recepción:</span>{' '}
          <Link href={`/operaciones/recepciones/${dev.recepcionId}`} className="font-medium text-[#13602C] hover:underline">
            REC-{String(dev.recepcion.numero).padStart(4, '0')}-{dev.recepcion.anio}
          </Link>
        </div>
        <div>
          <span className="text-gray-500">Tipo:</span>{' '}
          <span className="font-medium">{dev.tipo}</span>
        </div>
        <div>
          <span className="text-gray-500">Gestionado por:</span>{' '}
          <span className="font-medium">{dev.gestionadoPor.nombre}</span>
        </div>
        <div>
          <span className="text-gray-500">Fecha:</span>{' '}
          <span className="font-medium">{formatFecha(dev.fechaDevolucion)}</span>
        </div>
        <div className="col-span-2">
          <span className="text-gray-500">Motivo:</span>{' '}
          <span className="font-medium">{dev.motivo}</span>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-700">Ítems devueltos</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Descripción</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Cantidad</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Unidad</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Motivo específico</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dev.items.map(item => (
              <tr key={item.id}>
                <td className="px-4 py-2">{item.descripcion}</td>
                <td className="px-4 py-2 text-right font-mono">{item.cantidad}</td>
                <td className="px-4 py-2 text-gray-600">{item.unidad}</td>
                <td className="px-4 py-2 text-gray-500">{item.motivo || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      {dev.estado === 'PENDIENTE' && (
        <form action={procesar}>
          <Button type="submit" className="bg-[#13602C] hover:bg-[#0e4a21] text-white">
            Marcar como procesada
          </Button>
        </form>
      )}
    </div>
  )
}
