import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { formatFecha, formatMoneda, formatNumCotizacion } from '@/lib/format'

// En el documento para el cliente se usan las abreviaciones oficiales del laboratorio
const AREA_LABELS: Record<string, string> = { Q: 'Q', B: 'B', M: 'P' }

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
      muestras: {
        include: { items: { include: { ensayo: true } } },
        orderBy: { orden: 'asc' },
      },
    },
  })
  if (!cot) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  const moneda = cot.moneda as 'USD' | 'PEN'
  const hasMuestras = cot.muestras.length > 0

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const blue = rgb(0.122, 0.306, 0.475) // #13602C
  const black = rgb(0, 0, 0)
  const gray = rgb(0.4, 0.4, 0.4)
  const lightGray = rgb(0.95, 0.95, 0.95)
  const white = rgb(1, 1, 1)

  let page = pdfDoc.addPage([595, 842])
  const { width, height } = page.getSize()
  let y = height

  // ── Header ──────────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 75, width, height: 75, color: blue })
  page.drawText('CETOX LAB', { x: 40, y: height - 38, size: 22, font: fontBold, color: white })
  page.drawText('Centro Toxicológico S.A.C. — LE-044', { x: 40, y: height - 55, size: 9, font, color: rgb(0.8, 0.9, 1) })

  // Número cotización en header derecha
  const numCot = formatNumCotizacion(cot.numero, cot.anio, cot.sufijo)
  page.drawText('COTIZACIÓN', { x: width - 180, y: height - 32, size: 11, font: fontBold, color: white })
  page.drawText(numCot, { x: width - 180, y: height - 48, size: 14, font: fontBold, color: rgb(0.8, 0.9, 1) })

  y = height - 75

  // ── Datos cliente + cotización ───────────────────────────────────────────────
  y -= 20

  // Bloque izquierdo: cliente
  page.drawText('DATOS DEL CLIENTE', { x: 40, y, size: 8, font: fontBold, color: blue })
  y -= 14
  const clienteLines = [
    ['Razón social', cot.cliente.razonSocial],
    ['RUC', cot.cliente.ruc],
    ['Dirección', cot.cliente.direccion ?? ''],
    ...(cot.contactoNombre ? [['Contacto', cot.contactoNombre]] : []),
    ...(cot.contactoEmail ? [['Email', cot.contactoEmail]] : []),
    ...(cot.contactoTelefono ? [['Teléfono', cot.contactoTelefono]] : []),
  ] as [string, string][]

  for (const [label, value] of clienteLines) {
    page.drawText(`${label}:`, { x: 40, y, size: 8.5, font: fontBold, color: gray })
    page.drawText(value, { x: 130, y, size: 8.5, font, color: black })
    y -= 13
  }

  // Bloque derecho: datos cotización
  const rightX = 360
  let ry = height - 95
  const cotLines = [
    ['Fecha emisión', formatFecha(cot.fechaEmision)],
    ['Vigencia', formatFecha(cot.vigenciaHasta)],
    ['Moneda', moneda === 'USD' ? 'Dólares americanos (USD)' : 'Soles peruanos (PEN)'],
    ['Preparado por', cot.creadoPor.nombre],
  ] as [string, string][]

  page.drawText('DATOS DE LA COTIZACIÓN', { x: rightX, y: ry, size: 8, font: fontBold, color: blue })
  ry -= 14
  for (const [label, value] of cotLines) {
    page.drawText(`${label}:`, { x: rightX, y: ry, size: 8.5, font: fontBold, color: gray })
    page.drawText(value, { x: rightX + 80, y: ry, size: 8.5, font, color: black })
    ry -= 13
  }

  y = Math.min(y, ry) - 16

  // ── Separador ────────────────────────────────────────────────────────────────
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
  y -= 14

  // ── Ensayos ───────────────────────────────────────────────────────────────────
  const drawTableHeader = (yPos: number) => {
    page.drawRectangle({ x: 40, y: yPos - 4, width: width - 80, height: 16, color: blue })
    page.drawText('Ensayo', { x: 44, y: yPos, size: 8, font: fontBold, color: white })
    page.drawText('Área', { x: 260, y: yPos, size: 8, font: fontBold, color: white })
    page.drawText('Plazo', { x: 330, y: yPos, size: 8, font: fontBold, color: white })
    page.drawText('Costo', { x: width - 100, y: yPos, size: 8, font: fontBold, color: white })
    return yPos - 16
  }

  const drawRow = (yPos: number, ensayo: { nombre: string; area: string }, costo: number, dias: number, shade: boolean) => {
    if (shade) page.drawRectangle({ x: 40, y: yPos - 4, width: width - 80, height: 14, color: lightGray })
    page.drawText(ensayo.nombre.substring(0, 52), { x: 44, y: yPos, size: 8, font, color: black })
    page.drawText(AREA_LABELS[ensayo.area] ?? ensayo.area, { x: 260, y: yPos, size: 8, font, color: gray })
    page.drawText(`${dias} días`, { x: 330, y: yPos, size: 8, font, color: black })
    page.drawText(formatMoneda(costo, moneda), { x: width - 100, y: yPos, size: 8, font, color: black })
    return yPos - 14
  }

  const ensurePage = (yPos: number, minSpace = 60): [typeof page, number] => {
    if (yPos > minSpace) return [page, yPos]
    page = pdfDoc.addPage([595, 842])
    // Minimal header on continuation pages
    page.drawRectangle({ x: 0, y: height - 30, width, height: 30, color: blue })
    page.drawText(`CETOX LAB — ${numCot} (cont.)`, { x: 40, y: height - 20, size: 9, font: fontBold, color: white })
    return [page, height - 50]
  }

  if (hasMuestras) {
    for (const muestra of cot.muestras) {
      ;[page, y] = ensurePage(y, 80)
      // Muestra header
      page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: 15, color: rgb(0.9, 0.93, 0.97) })
      page.drawText(`Muestra: ${muestra.nombre || '(sin nombre)'}`, { x: 44, y, size: 8.5, font: fontBold, color: blue })
      y -= 16
      y = drawTableHeader(y)
      muestra.items.forEach((it, idx) => {
        ;[page, y] = ensurePage(y)
        y = drawRow(y, it.ensayo, it.costo, it.tiempoEntregaDias, idx % 2 === 1)
      })
      y -= 6
    }
  } else {
    y = drawTableHeader(y)
    cot.items.forEach((it, idx) => {
      ;[page, y] = ensurePage(y)
      y = drawRow(y, it.ensayo, it.costo, it.tiempoEntregaDias, idx % 2 === 1)
    })
  }

  // ── Totales ────────────────────────────────────────────────────────────────
  y -= 8
  ;[page, y] = ensurePage(y, 70)
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
  y -= 13

  const totals: [string, number][] = [
    ['Subtotal', cot.subtotal],
    ['IGV (18%)', cot.igv],
  ]
  for (const [label, val] of totals) {
    page.drawText(label, { x: width - 180, y, size: 9, font, color: gray })
    page.drawText(formatMoneda(val, moneda), { x: width - 80, y, size: 9, font, color: black })
    y -= 13
  }
  page.drawText('TOTAL', { x: width - 180, y, size: 10, font: fontBold, color: blue })
  page.drawText(formatMoneda(cot.total, moneda), { x: width - 80, y, size: 10, font: fontBold, color: blue })
  y -= 18

  // ── Observaciones ────────────────────────────────────────────────────────────
  if (cot.observaciones) {
    ;[page, y] = ensurePage(y, 60)
    y -= 4
    page.drawText('Observaciones:', { x: 40, y, size: 8.5, font: fontBold, color: gray })
    y -= 13
    const obsLines = cot.observaciones.split('\n').slice(0, 8)
    for (const line of obsLines) {
      page.drawText(line.substring(0, 90), { x: 40, y, size: 8, font, color: black })
      y -= 12
    }
  }

  // ── Footer ────────────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width, height: 36, color: blue })
  page.drawText('CETOX LAB — Centro Toxicológico S.A.C. — LE-044', { x: 40, y: 22, size: 8, font, color: white })
  page.drawText(`Documento generado: ${formatFecha(new Date())}`, { x: 40, y: 10, size: 7, font, color: rgb(0.7, 0.8, 0.9) })
  page.drawText(numCot, { x: width - 100, y: 22, size: 8, font: fontBold, color: white })

  const pdfBytes = await pdfDoc.save()
  const filename = `Cotizacion-${numCot}.pdf`

  return new NextResponse(pdfBytes as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
