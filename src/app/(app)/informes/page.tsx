import { requireNotAnalista } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { InformesTable } from '@/components/informes-table'

export default async function InformesPage() {
  await requireNotAnalista()

  const informes = await prisma.informe.findMany({
    include: {
      oda: { include: { items: { include: { ensayo: true } }, set: { include: { cliente: true } } } },
      analista: true,
    },
    orderBy: [{ anio: 'desc' }, { numero: 'desc' }],
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Informes</h1>
      </div>
      <InformesTable informes={informes} />
    </div>
  )
}
