'use server'

import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function registrarFactura(formData: FormData) {
  const session = await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])

  const ordenCompraId = formData.get('ordenCompraId') as string
  const serie = formData.get('serie') as string
  const numero = formData.get('numero') as string
  const moneda = (formData.get('moneda') as string) || 'PEN'
  const subtotalStr = formData.get('subtotal') as string
  const igvStr = formData.get('igv') as string
  const fechaEmision = formData.get('fechaEmision') as string
  const fechaVencimiento = formData.get('fechaVencimiento') as string
  const archivoUrl = formData.get('archivoUrl') as string

  const subtotal = parseFloat(subtotalStr) || 0
  const igv = parseFloat(igvStr) || 0
  const total = subtotal + igv

  const factura = await prisma.factura.create({
    data: {
      serie: serie || null,
      numero,
      ordenCompraId,
      moneda,
      subtotal,
      igv,
      total,
      fechaEmision: new Date(fechaEmision),
      fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
      archivoUrl: archivoUrl || null,
      estado: 'REGISTRADA',
      registradoPorId: session.user.id,
    },
  })

  // Update Requerimiento
  const oc = await prisma.ordenCompra.findUnique({ where: { id: ordenCompraId } })
  if (oc) {
    await prisma.requerimiento.update({ where: { id: oc.requerimientoId }, data: { estado: 'CERRADO' } })
  }

  await prisma.ordenCompraHistorial.create({
    data: {
      ordenCompraId,
      usuarioId: session.user.id,
      descripcion: `Factura ${serie ? serie + '-' : ''}${numero} registrada por ${session.user.name ?? session.user.email}`,
    },
  })

  revalidatePath('/operaciones/facturas')
  revalidatePath('/operaciones/ordenes-compra')
  revalidatePath(`/operaciones/ordenes-compra/${ordenCompraId}`)
  revalidatePath('/operaciones/seguimiento')
  redirect(`/operaciones/facturas/${factura.id}`)
}

export async function crearProvisionPago(facturaId: string, formData: FormData) {
  const session = await requireRol(['DIRECTOR_CALIDAD'])
  const concepto = formData.get('concepto') as string
  const condicionPago = (formData.get('condicionPago') as string) || 'CREDITO_30'
  const observaciones = formData.get('observaciones') as string
  const factura = await prisma.factura.findUnique({ where: { id: facturaId } })
  if (!factura) throw new Error('Factura no encontrada')

  await prisma.provisionPago.create({
    data: {
      facturaId,
      monto: factura.total,
      concepto: concepto || null,
      condicionPago,
      aprobadoPorId: session.user.id,
      observaciones: observaciones || null,
    },
  })

  await prisma.factura.update({ where: { id: facturaId }, data: { estado: 'EN_PROVISION' } })
  await prisma.ordenCompraHistorial.create({
    data: {
      ordenCompraId: factura.ordenCompraId,
      usuarioId: session.user.id,
      descripcion: `Provisión de pago aprobada por ${session.user.name ?? session.user.email}`,
    },
  })
  revalidatePath('/operaciones/facturas')
  revalidatePath(`/operaciones/facturas/${facturaId}`)
  revalidatePath('/operaciones/ordenes-compra')
  revalidatePath('/operaciones/seguimiento')
}
