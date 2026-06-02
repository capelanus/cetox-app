'use server'

import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'
import { siguienteCorrelativo } from '@/lib/correlativo'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface ItemFacturable {
  itemId:  string
  nombre:  string
  muestra: string | null
  costo:   number
  moneda:  'USD' | 'PEN'
}

// ── Generar factura con ítems seleccionados ───────────────────────────────────

export async function generarFacturaClienteConItems(
  cotizacionId: string,
  itemsSeleccionados: ItemFacturable[],
): Promise<{ id: string } | { error: string }> {
  const session = await requireRol([
    'ADMINISTRACION', 'DIRECTOR_CALIDAD', 'GERENTE_TECNICO', 'COORDINADOR_CALIDAD',
  ])

  if (!itemsSeleccionados || itemsSeleccionados.length === 0) {
    return { error: 'Debes seleccionar al menos un ensayo.' }
  }

  const cot = await prisma.cotizacion.findUniqueOrThrow({
    where: { id: cotizacionId },
    include: { cliente: true },
  })

  if (cot.estado !== 'ACEPTADA') {
    return { error: 'Solo se puede facturar una cotización en estado ACEPTADA.' }
  }

  // Calcular totales solo con los ítems seleccionados
  const subtotal = itemsSeleccionados.reduce((s, i) => s + i.costo, 0)
  const igv      = Math.round(subtotal * 0.18 * 100) / 100
  const total    = Math.round((subtotal + igv) * 100) / 100

  const anio   = new Date().getFullYear()
  const numero = await siguienteCorrelativo('factura_cliente', anio)

  const factura = await prisma.facturaCliente.create({
    data: {
      numero,
      anio,
      serie:        'F001',
      cotizacionId: cot.id,
      clienteId:    cot.clienteId,
      moneda:       cot.moneda,
      subtotal,
      igv,
      total,
      itemsJson:    JSON.stringify(itemsSeleccionados),
      creadoPorId:  session.user.id,
    },
  })

  revalidatePath('/facturacion')
  revalidatePath(`/cotizaciones/${cotizacionId}`)

  return { id: factura.id }
}

// ── Generar factura completa (legacy — desde cotización detail sin selección) ──

export async function generarFacturaCliente(cotizacionId: string) {
  const session = await requireRol([
    'ADMINISTRACION', 'DIRECTOR_CALIDAD', 'GERENTE_TECNICO', 'COORDINADOR_CALIDAD',
  ])

  const cot = await prisma.cotizacion.findUniqueOrThrow({
    where: { id: cotizacionId },
    include: {
      cliente: true,
      items:   { include: { ensayo: true } },
      muestras: {
        include: { items: { include: { ensayo: true } } },
        orderBy: { orden: 'asc' },
      },
    },
  })

  if (cot.estado !== 'ACEPTADA') {
    throw new Error('Solo se puede facturar una cotización en estado ACEPTADA')
  }

  const existente = await prisma.facturaCliente.findFirst({
    where: { cotizacionId, estado: { not: 'ANULADA' } },
  })
  if (existente) {
    redirect(`/facturacion/${existente.id}`)
  }

  const moneda = cot.moneda as 'USD' | 'PEN'
  const items: ItemFacturable[] = cot.muestras.length > 0
    ? cot.muestras.flatMap(m =>
        m.items.map(it => ({ itemId: it.id, nombre: it.ensayo.nombre, muestra: m.nombre, costo: it.costo, moneda }))
      )
    : cot.items.map(it => ({ itemId: it.id, nombre: it.ensayo.nombre, muestra: null, costo: it.costo, moneda }))

  const anio   = new Date().getFullYear()
  const numero = await siguienteCorrelativo('factura_cliente', anio)

  const factura = await prisma.facturaCliente.create({
    data: {
      numero,
      anio,
      serie:        'F001',
      cotizacionId: cot.id,
      clienteId:    cot.clienteId,
      moneda:       cot.moneda,
      subtotal:     cot.subtotal,
      igv:          cot.igv,
      total:        cot.total,
      itemsJson:    JSON.stringify(items),
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
