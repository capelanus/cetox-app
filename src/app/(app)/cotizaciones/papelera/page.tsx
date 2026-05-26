import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { formatFecha, formatMoneda, formatNumCotizacion } from '@/lib/format'
import { PapeleraActions } from '@/components/papelera-actions'

const ESTADO_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador',
  EN_REVISION: 'En revisión',
  ENVIADA: 'Enviada',
  ACEPTADA: 'Aceptada',
  RECHAZADA: 'Rechazada',
}

export default async function PapeleraPage() {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_CALIDAD'])

  const eliminadas = await prisma.cotizacion.findMany({
    where: { deletedAt: { not: null } },
    include: { cliente: true, creadoPor: true, deletedBy: true },
    orderBy: { deletedAt: 'desc' },
  })

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/cotizaciones">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />Cotizaciones
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-slate-400" />
            Papelera
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Las cotizaciones aquí se eliminan definitivamente después de 30 días.
          </p>
        </div>
      </div>

      {eliminadas.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm p-16 text-center">
          <Trash2 className="h-10 w-10 mx-auto mb-3 text-slate-200" />
          <p className="text-slate-400 font-medium">La papelera está vacía</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Nro.</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Cliente</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Total</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Eliminada por</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {eliminadas.map((c) => {
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-slate-500">
                      {formatNumCotizacion(c.numero, c.anio, c.sufijo)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.cliente.razonSocial}</p>
                      <p className="text-xs text-slate-400">{c.cliente.ruc}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="opacity-60">
                        {ESTADO_LABELS[c.estado] ?? c.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatMoneda(c.total, c.moneda as 'USD' | 'PEN')}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {c.deletedBy?.nombre ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {c.deletedAt ? formatFecha(c.deletedAt) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <PapeleraActions id={c.id} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
