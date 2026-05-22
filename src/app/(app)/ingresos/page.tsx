import { requireNotAnalista } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { IngresosView } from '@/components/ingresos-view'

export default async function IngresosPage() {
  await requireNotAnalista()
  const cotizaciones = await prisma.cotizacion.findMany({
    where: { estado: 'ACEPTADA' },
    include: {
      cliente: true,
      items: { include: { ensayo: true } },
    },
    orderBy: [{ anio: 'desc' }, { fechaEmision: 'desc' }],
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Ingresos</h1>
        <p className="text-slate-500 text-sm mt-1">Cotizaciones aceptadas por período y departamento</p>
      </div>
      <IngresosView cotizaciones={cotizaciones} />
    </div>
  )
}
