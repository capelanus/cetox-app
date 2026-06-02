'use server'

import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'
import { siguienteCorrelativo } from '@/lib/correlativo'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ── Generar factura desde cotización ─────────────────────────────────────────

export async function generarFacturaCliente(cotizacionId: string) {
  const session = await requireRol(['ADMINISTRACION', 'DIRECTOR_CALIDAD', 'GERENTE_TECNICO', 'COORDINADOR_CALIDAD'])

  const cot = await prisma.cotizacion.findUniqueOrThrow({
    where: { id: cotizacionId },
    include: { cliente: true },
  })

  // Solo ACEPTADA puede facturarse
  if (cot.estado !== 'ACEPTADA') {
    throw new Error('Solo se puede facturar una cotización en estado ACEPTADA')
  }

  // Evitar duplicar factura
  const existente = await prisma.facturaCliente.findFirst({
    where: { cotizacionId, estado: { not: 'ANULADA' } },
  })
  if (existente) {
    redirect(`/facturacion/${existente.id}`)
  }

  const anio   = new Date().getFullYear()
  const numero = await siguienteCorrelativo('factura_cliente', anio)

  const factura = await prisma.facturaCliente.create({
    data: {
      numero,
      anio,
      serie:       'F001',
      cotizacionId: cot.id,
      clienteId:    cot.clienteId,
      moneda:       cot.moneda,
      subtotal:     cot.subtotal,
      igv:          cot.igv,
      total:        cot.total,
      creadoPorId:  session.user.id,
    },
  })

  revalidatePath('/facturacion')
  revalidatePath(`/cotizaciones/${cotizacionId}`)
  redirect(`/facturacion/${factura.id}`)
}

// ── Marcar como pagada ────────────────────────────────────────────────────────

export async function marcarFacturaPagada(facturaId: string) {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_CALIDAD', 'GERENTE_TECNICO'])
  await prisma.facturaCliente.update({
    where: { id: facturaId },
    data:  { estado: 'PAGADA' },
  })
  revalidatePath('/facturacion')
  revalidatePath(`/facturacion/${facturaId}`)
}

// ── Anular factura ────────────────────────────────────────────────────────────

export async function anularFacturaCliente(facturaId: string) {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_CALIDAD', 'GERENTE_TECNICO'])
  await prisma.facturaCliente.update({
    where: { id: facturaId },
    data:  { estado: 'ANULADA' },
  })
  revalidatePath('/facturacion')
  revalidatePath(`/facturacion/${facturaId}`)
}

// ── Actualizar notas y fecha de vencimiento ───────────────────────────────────

export async function actualizarFacturaCliente(
  facturaId: string,
  formData: FormData,
) {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_CALIDAD', 'GERENTE_TECNICO'])

  const notas            = (formData.get('notas')            as string) || null
  const fechaVencimiento = (formData.get('fechaVencimiento') as string) || null

  await prisma.facturaCliente.update({
    where: { id: facturaId },
    data: {
      notas,
      fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
    },
  })
  revalidatePath('/facturacion')
  revalidatePath(`/facturacion/${facturaId}`)
}
