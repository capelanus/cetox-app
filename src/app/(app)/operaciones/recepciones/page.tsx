import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { formatNumRecepcion, formatFecha } from '@/lib/format'
import { ESTADO_RECEPCION_LABELS } from '@/lib/constants'
import Link from 'next/link'

export default async function RecepcionesPage() {
  await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  const recepciones = await prisma.recepcion.findMany({
    orderBy: { fechaRecepcion: 'desc' },
    include: {
      ordenCompra: { include: { proveedor: true } },
      recibidoPor: true,
    },
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>Recepciones</h1>
          <p className="text-gray-500 text-sm">{recepciones.length} recepción(es)</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Número</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Orden de Compra</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Proveedor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Recibido por</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recepciones.map(rec => (
              <tr key={rec.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/operaciones/recepciones/${rec.id}`} className="font-mono text-[#13602C] font-medium hover:underline">
                    {formatNumRecepcion(rec.numero, rec.anio)}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/operaciones/ordenes-compra/${rec.ordenCompraId}`} className="text-[#13602C] hover:underline text-xs">
                    OC-{String(rec.ordenCompra.numero).padStart(4, '0')}-{rec.ordenCompra.anio}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-700">{rec.ordenCompra.proveedor.razonSocial}</td>
                <td className="px-4 py-3 text-gray-600">{rec.recibidoPor.nombre}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    rec.estado === 'CONFORME' || rec.estado === 'ENTREGADO_AREA' ? 'bg-green-100 text-green-700' :
                    rec.estado === 'NO_CONFORME' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {ESTADO_RECEPCION_LABELS[rec.estado] || rec.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{formatFecha(rec.fechaRecepcion)}</td>
              </tr>
            ))}
            {recepciones.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">No hay recepciones registradas</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
