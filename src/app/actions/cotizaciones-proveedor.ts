'use server'

import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'
import { siguienteCorrelativo } from '@/lib/correlativo'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function crearCotizacionProveedor(formData: FormData) {
  const session = await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  const anio = new Date().getFullYear()
  const numero = await siguienteCorrelativo('cotizacion_proveedor', anio)

  const requerimientoId = formData.get('requerimientoId') as string
  const proveedorId = formData.get('proveedorId') as string
  const moneda = (formData.get('moneda') as string) || 'PEN'
  const plazoEntregaDias = formData.get('plazoEntregaDias') as string
  const condicionesPago = formData.get('condicionesPago') as string
  const validezDias = formData.get('validezDias') as string
  const observaciones = formData.get('observaciones') as string
  const itemsJson = formData.get('items') as string
  const items: { descripcion: string; cantidad: number; unidad: string; precioUnitario: number }[] = JSON.parse(itemsJson || '[]')

  const itemsWithSubtotal = items.map((item, i) => ({
    descripcion: item.descripcion,
    cantidad: item.cantidad,
    unidad: item.unidad,
    precioUnitario: item.precioUnitario,
    subtotal: item.cantidad * item.precioUnitario,
    orden: i,
  }))

  const subtotal = itemsWithSubtotal.reduce((sum, item) => sum + item.subtotal, 0)
  const igv = subtotal * 0.18
  const total = subtotal + igv

  const cot = await prisma.cotizacionProveedor.create({
    data: {
      numero,
      anio,
      requerimientoId,
      proveedorId,
      moneda,
      subtotal,
      igv,
      total,
      plazoEntregaDias: plazoEntregaDias ? parseInt(plazoEntregaDias) : null,
      condicionesPago: condicionesPago || null,
      validezDias: validezDias ? parseInt(validezDias) : null,
      observaciones: observaciones || null,
      estado: 'BORRADOR',
      creadoPorId: session.user.id,
      items: { create: itemsWithSubtotal },
    },
  })

  // Update requerimiento estado
  await prisma.requerimiento.update({ where: { id: requerimientoId }, data: { estado: 'EN_COTIZACION' } })

  revalidatePath('/operaciones/cotizaciones-proveedor')
  revalidatePath(`/operaciones/requerimientos/${requerimientoId}`)
  redirect(`/operaciones/cotizaciones-proveedor/${cot.id}`)
}

export async function enviarCotizacionACalidad(id: string) {
  await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  await prisma.cotizacionProveedor.update({ where: { id }, data: { estado: 'ENVIADA_CALIDAD' } })
  revalidatePath('/operaciones/cotizaciones-proveedor')
  revalidatePath(`/operaciones/cotizaciones-proveedor/${id}`)
}

export async function aprobarCotizacionProveedor(id: string, formData: FormData) {
  const session = await requireRol(['DIRECTOR_CALIDAD'])
  const cot = await prisma.cotizacionProveedor.update({
    where: { id },
    data: {
      estado: 'APROBADA',
      aprobadoPorId: session.user.id,
      fechaAprobacion: new Date(),
    },
  })
  // Update requerimiento
  await prisma.requerimiento.update({ where: { id: cot.requerimientoId }, data: { estado: 'COTIZACION_APROBADA' } })
  revalidatePath('/operaciones/cotizaciones-proveedor')
  revalidatePath(`/operaciones/cotizaciones-proveedor/${id}`)
}

export async function rechazarCotizacionProveedor(id: string, formData: FormData) {
  const session = await requireRol(['DIRECTOR_CALIDAD'])
  const motivo = formData.get('motivo') as string
  const cot = await prisma.cotizacionProveedor.update({
    where: { id },
    data: {
      estado: 'RECHAZADA',
      motivoRechazo: motivo || null,
      aprobadoPorId: session.user.id,
      fechaAprobacion: new Date(),
    },
  })
  await prisma.requerimiento.update({ where: { id: cot.requerimientoId }, data: { estado: 'EN_COTIZACION' } })
  revalidatePath('/operaciones/cotizaciones-proveedor')
  revalidatePath(`/operaciones/cotizaciones-proveedor/${id}`)
}
