'use server'

import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'
import { siguienteCorrelativo } from '@/lib/correlativo'
import { ESTADO_OC_LABELS } from '@/lib/constants'
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
  const tipo               = (formData.get('tipo') as string) || 'PRODUCTO'
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
      tipo,
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

  await prisma.ordenCompraHistorial.create({
    data: {
      ordenCompraId: oc.id,
      usuarioId: session.user.id,
      descripcion: `Orden emitida por ${session.user.name ?? session.user.email}`,
    },
  })

  revalidatePath('/operaciones/ordenes-compra')
  revalidatePath('/operaciones/seguimiento')
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

  // Los ítems se emparejan por posición con recepciones.ts (no hay FK a RecepcionItem),
  // así que hay que preservar lo ya recibido por índice antes de borrar y recrear —
  // de lo contrario cualquier edición (incluso un simple typo) resetea a 0 la entrega ya registrada.
  const itemsPrevios = await prisma.ordenCompraItem.findMany({ where: { ordenCompraId: id }, orderBy: { orden: 'asc' } })

  const itemsWithSubtotal = items.map((item, i) => ({
    descripcion: item.descripcion,
    cantidad: item.cantidad,
    cantidadRecibida: itemsPrevios[i]?.cantidadRecibida ?? 0,
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
  revalidatePath('/operaciones/seguimiento')
  redirect(`/operaciones/ordenes-compra/${id}`)
}

export async function adjuntarFacturaOC(ocId: string, facturaUrl: string) {
  const session = await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  await prisma.ordenCompra.update({ where: { id: ocId }, data: { facturaOcUrl: facturaUrl } })
  await prisma.ordenCompraHistorial.create({
    data: {
      ordenCompraId: ocId,
      usuarioId: session.user.id,
      descripcion: `Factura de la OC adjuntada por ${session.user.name ?? session.user.email}`,
    },
  })
  revalidatePath(`/operaciones/ordenes-compra/${ocId}`)
  revalidatePath('/operaciones/seguimiento')
}

export async function enviarOCaCalidad(ocId: string) {
  const session = await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  const oc = await prisma.ordenCompra.findUnique({
    where: { id: ocId },
    select: { facturaOcUrl: true, total: true, moneda: true, numero: true, anio: true, proveedor: { select: { razonSocial: true } } },
  })
  if (!oc?.facturaOcUrl) throw new Error('Adjunta la factura del proveedor antes de enviar a calidad.')
  await prisma.ordenCompra.update({ where: { id: ocId }, data: { estado: 'PENDIENTE_PAGO' } })
  await prisma.ordenCompraHistorial.create({
    data: {
      ordenCompraId: ocId,
      usuarioId: session.user.id,
      descripcion: `Enviada a Calidad para pago por ${session.user.name ?? session.user.email}`,
    },
  })
  const directores = await prisma.usuario.findMany({
    where: { rol: 'DIRECTOR_CALIDAD', activo: true },
    select: { id: true },
  })
  if (directores.length > 0) {
    const totalFmt = new Intl.NumberFormat('es-PE', { style: 'currency', currency: oc.moneda, minimumFractionDigits: 2 }).format(oc.total)
    await prisma.notificacion.createMany({
      data: directores.map(u => ({
        usuarioId: u.id,
        tipo:      'OC_PENDIENTE_PAGO',
        titulo:    'Orden de compra pendiente de pago',
        mensaje:   `Logística adjuntó la factura de "${oc.proveedor.razonSocial}" por ${totalFmt}. Pendiente de pago.`,
        enlace:    `/operaciones/ordenes-compra/${ocId}`,
      })),
    })
  }
  revalidatePath('/operaciones/ordenes-compra')
  revalidatePath(`/operaciones/ordenes-compra/${ocId}`)
  revalidatePath('/operaciones/seguimiento')
}

export async function subirComprobantePago(ocId: string, comprobanteUrl: string) {
  const session = await requireRol(['DIRECTOR_CALIDAD'])
  await prisma.ordenCompra.update({ where: { id: ocId }, data: { comprobantePagoUrl: comprobanteUrl } })
  await prisma.ordenCompraHistorial.create({
    data: {
      ordenCompraId: ocId,
      usuarioId: session.user.id,
      descripcion: `Comprobante de pago adjuntado por ${session.user.name ?? session.user.email}`,
    },
  })
  revalidatePath(`/operaciones/ordenes-compra/${ocId}`)
  revalidatePath('/operaciones/seguimiento')
}

export async function adjuntarFacturaItem(itemId: string, facturaUrl: string) {
  await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  const item = await prisma.ordenCompraItem.update({
    where: { id: itemId },
    data: { facturaUrl },
    select: { ordenCompraId: true },
  })
  revalidatePath(`/operaciones/ordenes-compra/${item.ordenCompraId}`)
}

export async function actualizarEstadoOC(id: string, estado: string) {
  const session = await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  const data: Record<string, unknown> = { estado }
  if (estado === 'CONFIRMADA_PROVEEDOR') data.fechaConfirmacionProveedor = new Date()
  if (estado === 'EN_TRANSITO') {
    const oc = await prisma.ordenCompra.findUnique({ where: { id } })
    if (oc) await prisma.requerimiento.update({ where: { id: oc.requerimientoId }, data: { estado: 'EN_TRANSITO' } })
  }
  await prisma.ordenCompra.update({ where: { id }, data })
  await prisma.ordenCompraHistorial.create({
    data: {
      ordenCompraId: id,
      usuarioId: session.user.id,
      descripcion: `Estado actualizado a "${ESTADO_OC_LABELS[estado] ?? estado}" por ${session.user.name ?? session.user.email}`,
    },
  })
  revalidatePath('/operaciones/ordenes-compra')
  revalidatePath(`/operaciones/ordenes-compra/${id}`)
  revalidatePath('/operaciones/seguimiento')
}

const ROLES_RESPONSABLE_OC = ['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA', 'DIRECTOR_CALIDAD', 'COORDINADOR_CALIDAD']

export async function asignarResponsableOC(id: string, formData: FormData) {
  const session = await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA', 'DIRECTOR_CALIDAD', 'COORDINADOR_CALIDAD'])
  const responsableActualId = (formData.get('responsableActualId') as string) || null

  const responsable = responsableActualId
    ? await prisma.usuario.findUnique({ where: { id: responsableActualId }, select: { nombre: true, rol: true, activo: true } })
    : null

  if (responsableActualId && (!responsable || !responsable.activo || !ROLES_RESPONSABLE_OC.includes(responsable.rol))) {
    throw new Error('El responsable seleccionado no es válido.')
  }

  await prisma.ordenCompra.update({ where: { id }, data: { responsableActualId } })
  await prisma.ordenCompraHistorial.create({
    data: {
      ordenCompraId: id,
      usuarioId: session.user.id,
      descripcion: responsable
        ? `Responsable asignado: ${responsable.nombre} (por ${session.user.name ?? session.user.email})`
        : `Responsable removido por ${session.user.name ?? session.user.email}`,
    },
  })
  revalidatePath('/operaciones/seguimiento')
  revalidatePath(`/operaciones/ordenes-compra/${id}`)
}
