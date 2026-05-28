import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { EditarGastoForm } from './editar-gasto-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarGastoPage({ params }: Props) {
  await requireRol(['DIRECTOR_CALIDAD'])
  const { id } = await params

  const [gasto, proveedores] = await Promise.all([
    prisma.cajaChicaGasto.findUnique({ where: { id } }),
    prisma.proveedor.findMany({
      where: { activo: true },
      select: { id: true, razonSocial: true, ruc: true },
      orderBy: { razonSocial: 'asc' },
    }),
  ])

  if (!gasto) notFound()

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/caja-chica">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Caja Chica
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Editar gasto</h1>
      </div>

      <EditarGastoForm
        gasto={{
          id:              gasto.id,
          fecha:           gasto.fecha.toISOString().split('T')[0],
          concepto:        gasto.concepto,
          monto:           gasto.monto,
          moneda:          gasto.moneda,
          categoria:       gasto.categoria ?? '',
          proveedorId:     gasto.proveedorId ?? '',
          proveedorNombre: gasto.proveedorNombre ?? '',
          proveedorRuc:    gasto.proveedorRuc ?? '',
          numeroFactura:   gasto.numeroFactura ?? '',
          notas:           gasto.notas ?? '',
          comprobante:     gasto.comprobante ?? '',
        }}
        proveedores={proveedores}
      />
    </div>
  )
}
