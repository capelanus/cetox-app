import { requireNotAnalista } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { ResumenTable } from '@/components/resumen-table'

export default async function ResumenPage() {
  await requireNotAnalista()
  const cotizaciones = await prisma.cotizacion.findMany({
    where: { deletedAt: null },
    include: {
      cliente: true,
      creadoPor: true,
      items: { include: { ensayo: true } },
      muestras: { select: { nombre: true }, orderBy: { orden: 'asc' } },
    },
    orderBy: [{ anio: 'desc' }, { fechaEmision: 'desc' }],
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Resumen de Cotizaciones</h1>
        <p className="text-slate-500 text-sm mt-1">Vista consolidada de todas las cotizaciones</p>
      </div>
      <ResumenTable cotizaciones={cotizaciones} />
    </div>
  )
}
