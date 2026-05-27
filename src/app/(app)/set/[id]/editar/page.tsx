import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { formatNumSET } from '@/lib/format'
import { SetEditarForm } from './set-editar-form'
import { OdaEditarForm } from './oda-editar-form'

export default async function EditarSETPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol(['ADMINISTRACION'])
  const { id } = await params

  const set = await prisma.sET.findUnique({
    where: { id },
    include: {
      odas: {
        include: {
          items: {
            include: { ensayo: true },
            orderBy: { fechaEntregaCompromiso: 'asc' },
          },
        },
        orderBy: { numero: 'asc' },
      },
    },
  })
  if (!set) notFound()

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/set/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Editar {formatNumSET(set.numero, set.anio)}
          </h1>
          <p className="text-sm text-slate-500">Modifica los datos de la muestra, el envase y las ODAs</p>
        </div>
      </div>

      {/* Formulario SET (muestra + envase) */}
      <SetEditarForm set={set} />

      {/* ODAs */}
      {set.odas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 pt-2">
            <h2 className="font-semibold text-slate-700">Órdenes de Análisis (ODAs)</h2>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{set.odas.length}</span>
          </div>
          {set.odas.map((oda) => (
            <OdaEditarForm key={oda.id} oda={oda} />
          ))}
        </div>
      )}
    </div>
  )
}
