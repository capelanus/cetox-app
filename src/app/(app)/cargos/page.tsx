import { requireNotAnalista, hasRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatFecha, formatNumSET } from '@/lib/format'

export default async function CargosPage() {
  const session = await requireNotAnalista()
  const sets = await prisma.sET.findMany({
    where: {
      AND: [
        { estado: { not: 'ANULADO' } },
        {
          OR: [
            { estado: { in: ['INFORME_EMITIDO', 'FINALIZADA', 'ENTREGADA'] } },
            { odas: { some: { informe: { is: { estado: 'FIRMADO' } } } } },
          ],
        },
      ],
    },
    include: { cliente: true, cargoEntrega: true },
    orderBy: [{ anio: 'desc' }, { numero: 'desc' }],
  })

  const canGenerate = hasRol(session.user.rol, 'ADMINISTRACION')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Cargos de Entrega (FR N° 124)</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">SET</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Cliente</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Muestra</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Recibido por</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Fecha recepción</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sets.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs">{formatNumSET(s.numero, s.anio)}</td>
                <td className="px-4 py-3">{s.cliente.razonSocial}</td>
                <td className="px-4 py-3 font-medium">{s.nombreComercial}</td>
                <td className="px-4 py-3">{s.cargoEntrega?.recibidoPor ?? '—'}</td>
                <td className="px-4 py-3">{s.cargoEntrega?.fechaRecepcion ? formatFecha(s.cargoEntrega.fechaRecepcion) : '—'}</td>
                <td className="px-4 py-3">
                  {s.cargoEntrega?.fechaRecepcion ? (
                    <Badge className="bg-green-100 text-green-700">Entregado</Badge>
                  ) : (
                    <Badge className="bg-blue-100 text-blue-700">Listo para entregar</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/cargos/${s.id}`} className="text-blue-600 hover:underline text-sm">
                    {canGenerate && !s.cargoEntrega?.recibidoPor ? 'Completar' : 'Ver'}
                  </Link>
                </td>
              </tr>
            ))}
            {sets.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No hay SETs finalizados pendientes de entrega
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
