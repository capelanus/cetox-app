import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
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
          sets: { select: { id: true } },
        },
        orderBy: { orden: 'asc' },
      },
    },
  })
  if (!cot || cot.estado !== 'ACEPTADA') notFound()

  const numCotizacion = formatNumCotizacion(cot.numero, cot.anio, cot.sufijo)
  const muestrasPendientes = cot.muestras.filter((m) => m.sets.length === 0)
  const tieneMuestras = cot.muestras.length > 0

  // Si la cotización tiene muestras y todas ya tienen SET creado → no hay nada que generar
  if (tieneMuestras && muestrasPendientes.length === 0) {
    redirect(`/cotizaciones/${cotizacionId}`)
  }

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
            {tieneMuestras
              ? `Generar SET${muestrasPendientes.length !== 1 ? 's' : ''}`
              : 'Nuevo SET'}
          </h1>
          {tieneMuestras && (
            <p className="text-sm text-slate-500 mt-0.5">
              {muestrasPendientes.length < cot.muestras.length
                ? `${muestrasPendientes.length} de ${cot.muestras.length} muestra${cot.muestras.length !== 1 ? 's' : ''} pendiente${muestrasPendientes.length !== 1 ? 's' : ''} — marca las que vas a generar ahora`
                : `La cotización tiene ${cot.muestras.length} muestras — puedes generar todas o solo algunas`}
            </p>
          )}
        </div>
      </div>

      {tieneMuestras ? (
        <SetMultiForm
          cotizacionId={cotizacionId}
          muestras={muestrasPendientes}
          numCotizacion={numCotizacion}
          moneda={cot.moneda}
          observacionesCotizacion={cot.observaciones}
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
          observacionesCotizacion={cot.observaciones}
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
