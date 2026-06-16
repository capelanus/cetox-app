'use server'

import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'
import { siguienteCorrelativo } from '@/lib/correlativo'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function crearOrdenCompra(formData: FormData) {
  const session = await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  const anio = new Date().getFullYear()
  const numero = await siguienteCorrelativo('orden_compra', anio)

  const requerimientoId    = formData.get('requerimientoId') as string
  const cotizacionIds      = formData.getAll('cotizacionProveedorId') as string[]
  const proveedorId        = formData.get('proveedorId') as string
  const moneda             = (formData.get('moneda') as string) || 'PEN'
  const condicionesPago    = formData.get('condicionesPago') as string
  const lugarEntrega       = formData.get('lugarEntrega') as string
  const fechaEntregaEstimada = formData.get('fechaEntregaEstimada') as string
  const observaciones      = formData.get('observaciones') as string
  const itemsJson          = formData.get('items') as string
  const items: { descripcion: string; cantidad: number; unidad: string; precioUnitario: number }[] = JSON.parse(itemsJson || '[]')

  const itemsWithSubtotal = items.map((item, i) => ({
    descripcion: item.descripcion,
    cantidad: item.cantidad,
    cantidadRecibida: 0,
    unidad: item.unidad,
    precioUnitario: item.precioUnitario,
    subtotal: item.cantidad * item.precioUnitario,
    orden: i,
  }))

  const subtotal = itemsWithSubtotal.reduce((sum, item) => sum + item.subtotal, 0)
  const igv = subtotal * 0.18
  const total = subtotal + igv

  const oc = await prisma.ordenCompra.create({
    data: {
      numero,
      anio,
      requerimientoId,
      proveedorId,
      moneda,
      subtotal,
      igv,
      total,
      condicionesPago: condicionesPago || null,
      lugarEntrega: lugarEntrega || null,
      fechaEntregaEstimada: fechaEntregaEstimada ? new Date(fechaEntregaEstimada) : null,
      observaciones: observaciones || null,
      estado: 'EMITIDA',
      emitidoPorId: session.user.id,
      items: { create: itemsWithSubtotal },
      cotizacionesProveedor: cotizacionIds.filter(Boolean).length > 0
        ? { create: cotizacionIds.filter(Boolean).map((cid) => ({ cotizacionProveedorId: cid })) }
        : undefined,
    },
  })

  await prisma.requerimiento.update({ where: { id: requerimientoId }, data: { estado: 'OC_EMITIDA' } })

  revalidatePath('/operaciones/ordenes-compra')
  redirect(`/operaciones/ordenes-compra/${oc.id}`)
}

export async function actualizarOC(id: string, formData: FormData) {
  const session = await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])

  const condicionesPago    = (formData.get('condicionesPago') as string) || null
  const lugarEntrega       = (formData.get('lugarEntrega') as string) || null
  const fechaEntregaRaw    = formData.get('fechaEntregaEstimada') as string
  const observaciones      = (formData.get('observaciones') as string) || null
  const cotizacionIds      = formData.getAll('cotizacionProveedorId') as string[]
  const itemsJson          = formData.get('items') as string
  const items: { descripcion: string; cantidad: number; unidad: string; precioUnitario: number }[] = JSON.parse(itemsJson || '[]')

  const itemsWithSubtotal = items.map((item, i) => ({
    descripcion: item.descripcion,
    cantidad: item.cantidad,
    cantidadRecibida: 0,
    unidad: item.unidad,
    precioUnitario: item.precioUnitario,
    subtotal: item.cantidad * item.precioUnitario,
    orden: i,
  }))
  const subtotal = itemsWithSubtotal.reduce((s, i) => s + i.subtotal, 0)
  const igv   = subtotal * 0.18
  const total = subtotal + igv

  // Borrar items y cotizaciones anteriores en una transacción
  await prisma.ordenCompraItem.deleteMany({ where: { ordenCompraId: id } })
  await prisma.ordenCompraCotizacion.deleteMany({ where: { ordenCompraId: id } })

  await prisma.ordenCompra.update({
    where: { id },
    data: {
      condicionesPago,
      lugarEntrega,
      fechaEntregaEstimada: fechaEntregaRaw ? new Date(fechaEntregaRaw) : null,
      observaciones,
      subtotal,
      igv,
      total,
      items: { create: itemsWithSubtotal },
      cotizacionesProveedor: cotizacionIds.filter(Boolean).length > 0
        ? { create: cotizacionIds.filter(Boolean).map((cid) => ({ cotizacionProveedorId: cid })) }
        : undefined,
    },
  })

  await prisma.ordenCompraHistorial.create({
    data: {
      ordenCompraId: id,
      usuarioId: session.user.id,
      descripcion: `Orden editada por ${session.user.name ?? session.user.email}`,
    },
  })

  revalidatePath('/operaciones/ordenes-compra')
  revalidatePath(`/operaciones/ordenes-compra/${id}`)
  redirect(`/operaciones/ordenes-compra/${id}`)
}

export async function actualizarEstadoOC(id: string, estado: string) {
  await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  const data: Record<string, unknown> = { estado }
  if (estado === 'CONFIRMADA_PROVEEDOR') data.fechaConfirmacionProveedor = new Date()
  if (estado === 'EN_TRANSITO') {
    const oc = await prisma.ordenCompra.findUnique({ where: { id } })
    if (oc) await prisma.requerimiento.update({ where: { id: oc.requerimientoId }, data: { estado: 'EN_TRANSITO' } })
  }
  await prisma.ordenCompra.update({ where: { id }, data })
  revalidatePath('/operaciones/ordenes-compra')
  revalidatePath(`/operaciones/ordenes-compra/${id}`)
}
