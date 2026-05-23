import { requireNotAnalista } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { IngresosView } from '@/components/ingresos-view'

export default async function IngresosPage() {
  await requireNotAnalista()
  const sets = await prisma.sET.findMany({
    include: {
      cliente: true,
      cotizacion: {
        include: { items: { include: { ensayo: true } } },
      },
    },
    orderBy: [{ anio: 'desc' }, { fechaIngreso: 'desc' }],
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Ingresos</h1>
        <p className="text-slate-500 text-sm mt-1">SETs ingresados por período y área</p>
      </div>
      <IngresosView sets={sets} />
    </div>
  )
}
