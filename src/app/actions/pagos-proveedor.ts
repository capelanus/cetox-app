'use server'

import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'
import { siguienteCorrelativo } from '@/lib/correlativo'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function crearPago(provisionId: string, formData: FormData) {
  const session = await requireRol(['DIRECTOR_CALIDAD'])
  const anio = new Date().getFullYear()
  const numero = await siguienteCorrelativo('pago', anio)

  const medioPago = (formData.get('medioPago') as string) || 'TRANSFERENCIA'
  const fechaPago = formData.get('fechaPago') as string
  const referencia = formData.get('referencia') as string
  const provision = await prisma.provisionPago.findUnique({ where: { id: provisionId } })
  if (!provision) throw new Error('Provisión no encontrada')

  const pago = await prisma.pago.create({
    data: {
      numero,
      anio,
      provisionId,
      monto: provision.monto,
      moneda: 'PEN',
      medioPago,
      fechaPago: fechaPago ? new Date(fechaPago) : new Date(),
      referencia: referencia || null,
      estado: 'PAGADO',
      aprobadoPorId: session.user.id,
    },
  })

  await prisma.factura.update({ where: { id: provision.facturaId }, data: { estado: 'PAGADA' } })
  revalidatePath('/operaciones/pagos')
  redirect(`/operaciones/pagos/${pago.id}`)
}

export async function confirmarPagoAlProveedor(id: string, formData: FormData) {
  await requireRol(['DIRECTOR_CALIDAD'])
  const voucherUrl = formData.get('voucherUrl') as string
  await prisma.pago.update({
    where: { id },
    data: {
      confirmadoProveedor: true,
      fechaConfirmacion: new Date(),
      estado: 'CONFIRMADO_PROVEEDOR',
      voucherUrl: voucherUrl || null,
    },
  })
  revalidatePath('/operaciones/pagos')
  revalidatePath(`/operaciones/pagos/${id}`)
}
