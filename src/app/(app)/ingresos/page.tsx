import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { IngresosView } from '@/components/ingresos-view'

export default async function IngresosPage() {
  // Lista explícita en vez de requireNotAnalista(): Administración no debe ver
  // los ingresos, y ese helper lo comparten otras páginas que sí se los muestran.
  await requireRol(['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION', 'COORDINADOR_CALIDAD'])
  const sets = await prisma.sET.findMany({
    where: { estado: { not: 'ANULADO' } },
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
