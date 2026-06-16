import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  const { id } = await params

  const oc = await prisma.ordenCompra.findUnique({
    where: { id },
    select: {
      id: true,
      condicionesPago: true,
      lugarEntrega: true,
      fechaEntregaEstimada: true,
      observaciones: true,
      moneda: true,
      items: {
        orderBy: { orden: 'asc' },
        select: { descripcion: true, cantidad: true, unidad: true, precioUnitario: true },
      },
      cotizacionesProveedor: {
        select: {
          cotizacionProveedor: {
            select: { id: true, numero: true, anio: true, total: true, moneda: true },
          },
        },
      },
    },
  })

  if (!oc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(oc)
}
