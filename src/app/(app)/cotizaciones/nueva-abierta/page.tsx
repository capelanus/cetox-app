import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { NuevaCotizacionForm } from '@/components/forms/cotizacion-form'

export default async function NuevaCotizacionAbiertaPage() {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_CALIDAD'])

  const [clientes, ensayos] = await Promise.all([
    prisma.cliente.findMany({ where: { activo: true }, orderBy: { razonSocial: 'asc' } }),
    prisma.ensayo.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } }),
  ])

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/cotizaciones">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Cotizaciones</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nueva cotización abierta</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Se crea en estado Aceptada y estará disponible para generar SETs con costo
          </p>
        </div>
      </div>
      <NuevaCotizacionForm clientes={clientes} ensayos={ensayos} tipo="ABIERTA" />
    </div>
  )
}
