import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { formatNumCotizacion, formatFecha, formatMoneda } from '@/lib/format'

export default async function NuevoSETConCostoPage() {
  await requireRol(['ADMINISTRACION'])

  // Solo cotizaciones ABIERTAS aceptadas — son las únicas disponibles para SETs con costo
  const cotizaciones = await prisma.cotizacion.findMany({
    where: { tipo: 'ABIERTA', estado: 'ACEPTADA', deletedAt: null },
    include: {
      cliente: true,
      muestras: {
        include: { sets: { select: { id: true } } },
        orderBy: { orden: 'asc' },
      },
      sets: { select: { id: true } },
    },
    orderBy: [{ anio: 'desc' }, { numero: 'desc' }],
  })

  // Filtrar las que aún no tienen todos sus SETs creados
  const disponibles = cotizaciones.filter((c) => {
    if (c.muestras.length > 0) {
      // Con muestras: al menos una muestra sin SET
      return c.muestras.some((m) => m.sets.length === 0)
    }
    // Sin muestras (cotización plana): sin ningún SET
    return c.sets.length === 0
  })

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/set">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            SETs
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo SET con costo</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Selecciona la cotización abierta para la que deseas generar el SET
          </p>
        </div>
      </div>

      {disponibles.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm p-10 text-center">
          <p className="text-slate-400 text-sm">
            No hay cotizaciones abiertas disponibles.
          </p>
          <Link href="/cotizaciones/nueva-abierta" className="mt-3 inline-block text-blue-600 text-sm hover:underline">
            Crear cotización abierta
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Cotización</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Cliente</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Fecha</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Total</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Muestras</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {disponibles.map((c) => {
                const muestrasPendientes = c.muestras.length > 0
                  ? c.muestras.filter((m) => m.sets.length === 0).length
                  : null

                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium">
                      {formatNumCotizacion(c.numero, c.anio, c.sufijo)}
                    </td>
                    <td className="px-4 py-3 font-medium">{c.cliente.razonSocial}</td>
                    <td className="px-4 py-3 text-slate-600">{formatFecha(c.fechaEmision)}</td>
                    <td className="px-4 py-3 font-medium">
                      {formatMoneda(c.total, c.moneda as 'USD' | 'PEN')}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {muestrasPendientes !== null
                        ? `${muestrasPendientes} de ${c.muestras.length} pendiente${muestrasPendientes !== 1 ? 's' : ''}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/set/nuevo?cotizacionId=${c.id}`}>
                        <Button size="sm" style={{ backgroundColor: '#13602C' }}>
                          Seleccionar
                          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                        </Button>
                      </Link>
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
