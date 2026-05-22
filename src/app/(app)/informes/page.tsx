import { requireNotAnalista } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatFecha, formatNumInforme } from '@/lib/format'

const ESTADO_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador',
  EN_REVISION_CALIDAD: 'En revisión',
  EN_FIRMA_GERENCIA: 'En firma',
  FIRMADO: 'Firmado',
  ENTREGADO: 'Entregado',
}

export default async function InformesPage() {
  await requireNotAnalista()

  const informes = await prisma.informe.findMany({
    include: {
      oda: { include: { items: { include: { ensayo: true } }, set: { include: { cliente: true } } } },
      analista: true,
      certificadoQR: true,
    },
    orderBy: [{ anio: 'desc' }, { numero: 'desc' }],
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Informes</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Número</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Ensayo</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Cliente</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Analista</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Fecha</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {informes.map((inf) => (
              <tr key={inf.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs font-medium">
                  {formatNumInforme(inf.prefijo, inf.numero, inf.anio)}
                </td>
                <td className="px-4 py-3">{inf.oda.items.map((i) => i.ensayo.nombre).join(', ')}</td>
                <td className="px-4 py-3">{inf.oda.set.cliente.razonSocial}</td>
                <td className="px-4 py-3 text-slate-600">{inf.analista.nombre}</td>
                <td className="px-4 py-3 text-slate-600">{formatFecha(inf.createdAt)}</td>
                <td className="px-4 py-3">
                  <Badge
                    className={
                      inf.estado === 'FIRMADO' ? 'bg-green-100 text-green-700' :
                      inf.estado === 'EN_REVISION_CALIDAD' ? 'bg-amber-100 text-amber-700' :
                      inf.estado === 'EN_FIRMA_GERENCIA' ? 'bg-blue-100 text-blue-700' : ''
                    }
                  >
                    {ESTADO_LABELS[inf.estado] ?? inf.estado}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/informes/${inf.id}`} className="text-blue-600 hover:underline text-sm">Ver</Link>
                </td>
              </tr>
            ))}
            {informes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">No hay informes</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
