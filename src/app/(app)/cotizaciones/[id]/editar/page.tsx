import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { EditarCotizacionForm } from '@/components/forms/editar-cotizacion-form'

export default async function EditarCotizacionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_CALIDAD'])
  const { id } = await params

  const [cot, clientes, ensayos] = await Promise.all([
    prisma.cotizacion.findUnique({
      where: { id },
      include: {
        items: { include: { ensayo: true } },
        muestras: {
          include: { items: { include: { ensayo: true } } },
          orderBy: { orden: 'asc' },
        },
      },
    }),
    prisma.cliente.findMany({ where: { activo: true }, orderBy: { razonSocial: 'asc' } }),
    prisma.ensayo.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } }),
  ])
  if (!cot) notFound()

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/cotizaciones/${id}`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Cotización</Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Editar cotización</h1>
      </div>
      <EditarCotizacionForm cotizacion={cot} clientes={clientes} ensayos={ensayos} />
    </div>
  )
}
