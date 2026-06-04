import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { InformesTable } from '@/components/informes-table'
import { redirect } from 'next/navigation'

export default async function InformesPage() {
  const session = await auth()
  if (!session) redirect('/login')
  const rol = session.user.rol
  const esAnalista = rol === 'ANALISTA'

  // Analistas solo ven sus propios informes. Siempre excluir informes de SETs anulados.
  const informes = await prisma.informe.findMany({
    where: {
      ...(esAnalista ? { analistaId: session.user.id } : {}),
      oda: { set: { estado: { not: 'ANULADO' } } },
    },
    include: {
      oda: { include: { items: { include: { ensayo: true } }, set: { include: { cliente: true } } } },
      analista: true,
    },
    orderBy: [{ anio: 'desc' }, { numero: 'desc' }],
  })

  // Serializar fechas para el cliente
  const informesSerialized = informes.map((inf) => ({
    ...inf,
    createdAt: inf.createdAt.toISOString(),
    fechaEnvioResultados: inf.fechaEnvioResultados?.toISOString() ?? null,
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Informes</h1>
      </div>
      <InformesTable informes={informesSerialized} />
    </div>
  )
}
