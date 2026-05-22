import { requireNotAnalista } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CotizacionesTable } from '@/components/cotizaciones-table'

export default async function CotizacionesPage() {
  const session = await requireNotAnalista()
  const cotizaciones = await prisma.cotizacion.findMany({
    include: {
      cliente: true,
      creadoPor: true,
      items: { include: { ensayo: true } },
      muestras: {
        include: { items: { include: { ensayo: true } } },
        orderBy: { orden: 'asc' },
      },
    },
    orderBy: [{ fechaEmision: 'desc' }],
  })
  const ensayos = await prisma.ensayo.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } })
  const canCreate = session?.user.rol === 'ADMINISTRACION' || session?.user.rol === 'DIRECTOR_CALIDAD'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Cotizaciones</h1>
        {canCreate && (
          <Link href="/cotizaciones/nueva">
            <Button style={{ backgroundColor: '#1F4E79' }}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva cotización
            </Button>
          </Link>
        )}
      </div>
      <CotizacionesTable cotizaciones={cotizaciones} ensayos={ensayos} />
    </div>
  )
}
