import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { SetForm } from '@/components/forms/set-form'
import { SetMultiForm } from '@/components/forms/set-multi-form'
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
    include: {
      cliente: true,
      items: { include: { ensayo: true } },
      muestras: {
        include: {
          items: { include: { ensayo: true } },
        },
        orderBy: { orden: 'asc' },
      },
    },
  })
  if (!cot || cot.estado !== 'ACEPTADA') notFound()

  const numCotizacion = formatNumCotizacion(cot.numero, cot.anio, cot.sufijo)
  const tieneMuestras = cot.muestras.length > 0

  // Áreas involucradas en la cotización (para cotizaciones sin muestras)
  const areasFlat = [...new Set(cot.items.map((i) => i.ensayo.area))].sort()

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/cotizaciones/${cotizacionId}`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Cotización</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {tieneMuestras ? `Generar ${cot.muestras.length} SET${cot.muestras.length !== 1 ? 's' : ''}` : 'Nuevo SET'}
          </h1>
          {tieneMuestras && (
            <p className="text-sm text-slate-500 mt-0.5">
              La cotización tiene {cot.muestras.length} muestras — se creará un SET por cada una
            </p>
          )}
        </div>
      </div>

      {tieneMuestras ? (
        <SetMultiForm
          cotizacionId={cotizacionId}
          muestras={cot.muestras}
          numCotizacion={numCotizacion}
          moneda={cot.moneda}
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
      ) : (
        <SetForm
          cotizacionId={cotizacionId}
          numCotizacion={numCotizacion}
          areas={areasFlat}
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
      )}
    </div>
  )
}
