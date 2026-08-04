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

  const doc = await crearMembrete('COTIZACIÓN DE SERVICIOS', numCot, { plantilla: 'letterhead-cotizacion.pdf', gapExtra: 28, numeroDerecha: true })
  const { font, fontBold } = doc

  // ── Datos del cliente (cuadro tipo formulario, formato tradicional) ──────────
  await doc.ensureSpace(140)
  const bx0 = ML, bx1 = PAGE_W - MR
  const yTop = doc.y
  const yBot = yTop - 106

  const hline = (y: number) => doc.page.drawLine({ start: { x: bx0, y }, end: { x: bx1, y }, thickness: 0.6, color: GREEN })
  const vline = (x: number, y1: number, y2: number) => doc.page.drawLine({ start: { x, y: y1 }, end: { x, y: y2 }, thickness: 0.6, color: GREEN })
  const cell = (x: number, yRowTop: number, label: string, value: string | null | undefined, max = 58) => {
    const ly = yRowTop - 12
    doc.page.drawText(label, { x: x + 4, y: ly, size: 8, font: fontBold, color: BLACK })
    const lw = fontBold.widthOfTextAtSize(label, 8)
    if (value) doc.page.drawText(String(value).substring(0, max), { x: x + 4 + lw + 3, y: ly, size: 8, font, color: BLACK })
  }

  // Bordes exteriores + horizontales de fila
  vline(bx0, yTop, yBot); vline(bx1, yTop, yBot)
  for (const y of [yTop, yTop - 18, yTop - 36, yTop - 54, yTop - 72, yBot]) hline(y)

  // Fila 1: Fecha de emisión | Ref
  const d1 = bx0 + 320
  vline(d1, yTop, yTop - 18)
  cell(bx0, yTop, 'Fecha de emisión :', formatFecha(cot.fechaEmision))
  cell(d1, yTop, 'Ref :', cot.sufijo || null)

  // Fila 2: Solicitante | R.U.C
  const d2 = bx0 + 372
  vline(d2, yTop - 18, yTop - 36)
  cell(bx0, yTop - 18, 'Solicitante :', cot.cliente.razonSocial, 62)
  cell(d2, yTop - 18, 'R.U.C :', cot.cliente.ruc)

  // Fila 3: Dirección
  cell(bx0, yTop - 36, 'Dirección :', cot.cliente.direccion, 100)

  // Fila 4: Teléfono 1 | Teléfono 2 | Email
  const e1 = bx0 + 165, e2 = bx0 + 335
  vline(e1, yTop - 54, yTop - 72); vline(e2, yTop - 54, yTop - 72)
  cell(bx0, yTop - 54, 'Teléfono 1 :', cot.contactoTelefono, 22)
  cell(e1, yTop - 54, 'Teléfono 2 :', null, 22)
  cell(e2, yTop - 54, 'Email :', cot.contactoEmail, 32)

  // Fila 5-6: Comunicación (checkboxes) + Fecha/Hora/Nombre
  const cy = yTop - 72
  doc.page.drawText('Comunicación :', { x: bx0 + 4, y: cy - 12, size: 8, font: fontBold, color: BLACK })
  const fc = (cot.formaContacto ?? '').toLowerCase()
  const marcado = (key: string) => {
    if (!fc) return false
    if (key === 'mail') return fc.includes('mail') || fc.includes('correo')
    if (key === 'whats') return fc.includes('whats')
    if (key === 'tel') return fc.includes('telef') || fc.includes('llamad')
    if (key === 'personal') return fc.includes('personal') || fc.includes('presencial')
    if (key === 'otros') return !['mail', 'correo', 'whats', 'telef', 'llamad', 'personal', 'presencial'].some(k => fc.includes(k))
    return false
  }
  let cbx = bx0 + 92
  for (const [label, key] of [['E-mail', 'mail'], ['whatsapp', 'whats'], ['Telefónica', 'tel'], ['Personal', 'personal'], ['Otros', 'otros']] as const) {
    doc.page.drawText(label, { x: cbx, y: cy - 12, size: 8, font, color: BLACK })
    const lw = font.widthOfTextAtSize(label, 8)
    const boxX = cbx + lw + 3
    doc.page.drawRectangle({ x: boxX, y: cy - 13.5, width: 8, height: 8, borderColor: GREEN, borderWidth: 0.6, color: WHITE })
    if (marcado(key)) doc.page.drawText('X', { x: boxX + 1.3, y: cy - 12.3, size: 7, font: fontBold, color: BLACK })
    cbx = boxX + 8 + 14
  }
  const tf = (x: number, label: string, value: string | null | undefined) => {
    doc.page.drawText(label, { x, y: cy - 29, size: 8, font: fontBold, color: BLACK })
    const lw = fontBold.widthOfTextAtSize(label, 8)
    if (value) doc.page.drawText(String(value).substring(0, 26), { x: x + lw + 3, y: cy - 29, size: 8, font, color: BLACK })
  }
  tf(bx0 + 92, 'Fecha :', cot.fechaContacto)
  tf(bx0 + 230, 'Hora :', cot.horaContacto)
  tf(bx0 + 355, 'Nombre :', cot.contactoNombre)

  // Línea compacta con datos de la cotización
  doc.y = yBot - 14
  doc.page.drawText(
    `Vigencia: ${formatFecha(cot.vigenciaHasta)}     ·     Moneda: ${moneda === 'USD' ? 'Dólares (USD)' : 'Soles (PEN)'}     ·     Preparado por: ${cot.creadoPor.nombre}`,
    { x: ML, y: doc.y, size: 8.5, font, color: GRAY },
  )
  doc.y -= 16

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
