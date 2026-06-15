import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ODATable } from '@/components/oda-table'
import { obtenerAlertasVencimiento } from '@/lib/alertas'
import { AlertasVencimientoBanner } from '@/components/alertas-vencimiento'

export default async function ODAPage() {
  const session = await auth()
  const userArea = session?.user.area
  const rol = session?.user.rol

  const baseWhere = rol === 'ANALISTA' && userArea ? { area: userArea } : {}
  // Excluir ODAs cuyos SETs estén anulados
  const where = { ...baseWhere, set: { estado: { not: 'ANULADO' } } }

  const [odas, alertas] = await Promise.all([
    prisma.oDA.findMany({
      where,
      include: {
        items: { include: { ensayo: true } },
        set: { include: { cliente: true } },
        informe: true,
      },
      orderBy: [{ anio: 'desc' }, { numero: 'desc' }],
    }),
    obtenerAlertasVencimiento(),
  ])

  return (
    <div>
      <AlertasVencimientoBanner alertas={alertas} tipo="ODA" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Órdenes de Análisis (ODA)</h1>
      </div>
      <ODATable odas={odas} userArea={userArea ?? null} isAnalista={rol === 'ANALISTA' || rol === 'SUPER_ADMIN'} />
    </div>
  )
}
