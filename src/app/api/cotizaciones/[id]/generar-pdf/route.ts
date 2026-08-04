import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { formatFecha, formatMoneda, formatNumCotizacion } from '@/lib/format'
import {
  crearMembrete, GREEN, BLACK, GRAY, LIGHT_GRAY, WHITE, ML, MR, CW, PAGE_W,
} from '@/lib/pdf-membrete'

const AREA_LABELS: Record<string, string> = { Q: 'Química', B: 'Biología', M: 'Microbiología' }

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const cot = await prisma.cotizacion.findUnique({
    where: { id },
    include: {
      cliente: true,
      creadoPor: true,
      items: { include: { ensayo: true } },
      muestras: { include: { items: { include: { ensayo: true } } }, orderBy: { orden: 'asc' } },
    },
  })
  if (!cot) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  const moneda = cot.moneda as 'USD' | 'PEN'
  const hasMuestras = cot.muestras.length > 0
  const numCot = formatNumCotizacion(cot.numero, cot.anio, cot.sufijo)

  const doc = await crearMembrete('COTIZACIÓN DE SERVICIOS', numCot, { plantilla: 'letterhead-cotizacion.pdf' })
  const { font, fontBold } = doc

  // ── Datos ──────────────────────────────────────────────────────────────────
  await doc.section('DATOS DEL CLIENTE')
  doc.field('Razón social', cot.cliente.razonSocial)
  doc.field('RUC', cot.cliente.ruc)
  doc.field('Dirección', cot.cliente.direccion)
  doc.field('Contacto', cot.contactoNombre)
  doc.field('Email', cot.contactoEmail)
  doc.field('Teléfono', cot.contactoTelefono)
  doc.y -= 4

  await doc.section('DATOS DE LA COTIZACIÓN')
  doc.field('Fecha de emisión', formatFecha(cot.fechaEmision))
  doc.field('Vigencia hasta', formatFecha(cot.vigenciaHasta))
  doc.field('Moneda', moneda === 'USD' ? 'Dólares americanos (USD)' : 'Soles peruanos (PEN)')
  doc.field('Preparado por', cot.creadoPor.nombre)
  doc.y -= 4

  // ── Tabla de ensayos ─────────────────────────────────────────────────────────
  const COL_AREA = 300, COL_PLAZO = 372, COL_COSTO = PAGE_W - MR - 62

  async function tableHeader() {
    await doc.ensureSpace(24)
    doc.page.drawRectangle({ x: ML, y: doc.y - 4, width: CW, height: 16, color: GREEN })
    doc.page.drawText('Ensayo', { x: ML + 4, y: doc.y, size: 8, font: fontBold, color: WHITE })
    doc.page.drawText('Área', { x: COL_AREA, y: doc.y, size: 8, font: fontBold, color: WHITE })
    doc.page.drawText('Plazo', { x: COL_PLAZO, y: doc.y, size: 8, font: fontBold, color: WHITE })
    doc.page.drawText('Costo', { x: COL_COSTO, y: doc.y, size: 8, font: fontBold, color: WHITE })
    doc.y -= 16
  }

  async function row(ensayo: { nombre: string; area: string }, costo: number, dias: number, shade: boolean) {
    await doc.ensureSpace(16)
    if (shade) doc.page.drawRectangle({ x: ML, y: doc.y - 4, width: CW, height: 14, color: LIGHT_GRAY })
    doc.page.drawText(ensayo.nombre.substring(0, 55), { x: ML + 4, y: doc.y, size: 8, font, color: BLACK })
    doc.page.drawText(AREA_LABELS[ensayo.area] ?? ensayo.area, { x: COL_AREA, y: doc.y, size: 8, font, color: GRAY })
    doc.page.drawText(`${dias} días`, { x: COL_PLAZO, y: doc.y, size: 8, font, color: BLACK })
    doc.page.drawText(formatMoneda(costo, moneda), { x: COL_COSTO, y: doc.y, size: 8, font, color: BLACK })
    doc.y -= 14
  }

  await doc.section(`ENSAYOS COTIZADOS`)
  if (hasMuestras) {
    for (const muestra of cot.muestras) {
      await doc.ensureSpace(40)
      doc.page.drawRectangle({ x: ML, y: doc.y - 4, width: CW, height: 15, color: LIGHT_GRAY })
      doc.page.drawText(`Muestra: ${muestra.nombre || '(sin nombre)'}`, { x: ML + 4, y: doc.y, size: 8.5, font: fontBold, color: GREEN })
      doc.y -= 16
      await tableHeader()
      let i = 0
      for (const it of muestra.items) { await row(it.ensayo, it.costo, it.tiempoEntregaDias, i % 2 === 1); i++ }
      doc.y -= 6
    }
  } else {
    await tableHeader()
    let i = 0
    for (const it of cot.items) { await row(it.ensayo, it.costo, it.tiempoEntregaDias, i % 2 === 1); i++ }
  }

  // ── Totales ────────────────────────────────────────────────────────────────
  await doc.ensureSpace(60)
  doc.hr()
  const totLabelX = PAGE_W - MR - 150, totValX = COL_COSTO
  for (const [label, val] of [['Subtotal', cot.subtotal], ['IGV (18%)', cot.igv]] as [string, number][]) {
    doc.page.drawText(label, { x: totLabelX, y: doc.y, size: 9, font, color: GRAY })
    doc.page.drawText(formatMoneda(val, moneda), { x: totValX, y: doc.y, size: 9, font, color: BLACK })
    doc.y -= 13
  }
  doc.page.drawText('TOTAL', { x: totLabelX, y: doc.y, size: 10, font: fontBold, color: GREEN })
  doc.page.drawText(formatMoneda(cot.total, moneda), { x: totValX, y: doc.y, size: 10, font: fontBold, color: GREEN })
  doc.y -= 18

  // ── Observaciones ────────────────────────────────────────────────────────────
  if (cot.observaciones) {
    await doc.section('OBSERVACIONES')
    for (const line of cot.observaciones.split('\n').slice(0, 12)) {
      await doc.ensureSpace(14)
      doc.page.drawText(line.substring(0, 95), { x: ML, y: doc.y, size: 8, font, color: BLACK })
      doc.y -= 12
    }
  }

  return doc.finish(`Cotizacion-${numCot}.pdf`, 'attachment') as unknown as NextResponse
}
