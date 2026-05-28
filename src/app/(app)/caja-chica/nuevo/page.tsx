import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { GastoForm } from './gasto-form'

export default async function NuevoGastoPage() {
  await requireRol(['DIRECTOR_CALIDAD'])

  const proveedores = await prisma.proveedor.findMany({
    where: { activo: true },
    select: { id: true, razonSocial: true, ruc: true },
    orderBy: { razonSocial: 'asc' },
  })

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/caja-chica">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Caja Chica
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Registrar gasto</h1>
      </div>

      <GastoForm proveedores={proveedores} today={today} />
    </div>
  )
}
