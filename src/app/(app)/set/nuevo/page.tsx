import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { SetForm } from '@/components/forms/set-form'
import { formatNumCotizacion } from '@/lib/format'

export default async function NuevoSETPage({
  searchParams,
}: {
  searchParams: Promise<{ cotizacionId?: string }>
}) {
  await requireRol(['ADMINISTRACION'])
  const { cotizacionId } = await searchParams

  if (!cotizacionId) notFound()

  const cot = await prisma.cotizacion.findUnique({
    where: { id: cotizacionId },
    include: { cliente: true },
  })
  if (!cot || cot.estado !== 'ACEPTADA') notFound()

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/cotizaciones/${cotizacionId}`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Cotización</Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Nuevo SET</h1>
      </div>

      <SetForm
        cotizacionId={cotizacionId}
        numCotizacion={formatNumCotizacion(cot.numero, cot.anio, cot.sufijo)}
        cliente={{
          razonSocial: cot.cliente.razonSocial,
          ruc: cot.cliente.ruc,
          direccion: cot.cliente.direccion,
        }}
        contacto={{
          contactoNombre: cot.contactoNombre,
          contactoEmail: cot.contactoEmail,
          contactoTelefono: cot.contactoTelefono,
        }}
      />
    </div>
  )
}
