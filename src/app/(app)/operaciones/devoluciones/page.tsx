import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { formatFecha } from '@/lib/format'
import Link from 'next/link'

export default async function DevolucionesPage() {
  await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  const devoluciones = await prisma.devolucion.findMany({
    orderBy: { fechaDevolucion: 'desc' },
    include: {
      recepcion: { include: { ordenCompra: { include: { proveedor: true } } } },
      gestionadoPor: true,
    },
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>Devoluciones</h1>
        <p className="text-gray-500 text-sm">{devoluciones.length} devolución(es)</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Número</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Proveedor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Motivo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {devoluciones.map(dev => (
              <tr key={dev.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/operaciones/devoluciones/${dev.id}`} className="font-mono text-[#13602C] font-medium hover:underline">
                    DEV-{String(dev.numero).padStart(4, '0')}-{dev.anio}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-700">{dev.recepcion.ordenCompra.proveedor.razonSocial}</td>
                <td className="px-4 py-3 text-gray-600">{dev.tipo}</td>
                <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{dev.motivo}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${dev.estado === 'PROCESADA' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {dev.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{formatFecha(dev.fechaDevolucion)}</td>
              </tr>
            ))}
            {devoluciones.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">No hay devoluciones registradas</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
