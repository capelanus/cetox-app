'use server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { formatFecha, formatMoneda } from '@/lib/format'

const GREEN      = rgb(0.075, 0.376, 0.173)  // #13602C
const TEAL       = rgb(0.290, 0.765, 0.698)  // #4AC3B2
const BLACK      = rgb(0,     0,     0)
const GRAY       = rgb(0.45,  0.45,  0.45)
const LIGHT_GRAY = rgb(0.96,  0.96,  0.96)
const WHITE      = rgb(1,     1,     1)

const PAGE_W = 595
const PAGE_H = 842
const ML = 42
const MR = 42
const CW = PAGE_W - ML - MR

function numFactura(serie: string, numero: number, anio: number) {
  return `${serie}-${String(numero).padStart(5, '0')} / ${anio}`
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  const factura = await prisma.facturaCliente.findUnique({
    where: { id },
    include: {
      cliente:    true,
      cotizacion: {
        include: {
          items:   { include: { ensayo: true } },
          muestras: { include: { items: { include: { ensayo: true } } }, orderBy: { orden: 'asc' } },
        },
      },
      creadoPor:  true,
    },
  })
  if (!factura) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  // ── Build PDF ──────────────────────────────────────────────────────────────
  const pdfDoc   = await PDFDocument.create()
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const page = pdfDoc.addPage([PAGE_W, PAGE_H])
  let y = PAGE_H - 50

  // ── Header bar ──────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: PAGE_H - 80, width: PAGE_W, height: 80, color: GREEN })
  page.drawText('CETOX LAB', { x: ML, y: PAGE_H - 35, size: 20, font: fontBold, color: WHITE })
  page.drawText('LABORATORIO DE ENSAYO ACREDITADO — INACAL-DA — Registro Nº LE-044', {
    x: ML, y: PAGE_H - 49, size: 7.5, font, color: rgb(0.75, 0.93, 0.82),
  })
  page.drawText('CENTRO TOXICOLÓGICO S.A.C. — CETOX LAB', {
    x: ML, y: PAGE_H - 62, size: 8.5, font: fontBold, color: TEAL,
  })

  // Document type box (top right)
  page.drawRectangle({ x: PAGE_W - 165, y: PAGE_H - 76, width: 123, height: 52, color: WHITE })
  page.drawText('FACTURA', { x: PAGE_W - 153, y: PAGE_H - 42, size: 11, font: fontBold, color: GREEN })
  page.drawText(numFactura(factura.serie, factura.numero, factura.anio), {
    x: PAGE_W - 153, y: PAGE_H - 57, size: 8.5, font: fontBold, color: BLACK,
  })

  y = PAGE_H - 100

  // ── Datos de emisión ────────────────────────────────────────────────────────
  const col2X = PAGE_W / 2 + 10
  page.drawText('Fecha de emisión:', { x: col2X, y, size: 8, font: fontBold, color: GRAY })
  page.drawText(formatFecha(factura.fechaEmision), { x: col2X + 120, y, size: 8, font, color: BLACK })
  y -= 13
  if (factura.fechaVencimiento) {
    page.drawText('Fecha de vencimiento:', { x: col2X, y, size: 8, font: fontBold, color: GRAY })
    page.drawText(formatFecha(factura.fechaVencimiento), { x: col2X + 120, y, size: 8, font, color: BLACK })
    y -= 13
  }
  page.drawText('Estado:', { x: col2X, y, size: 8, font: fontBold, color: GRAY })
  const estadoColor = factura.estado === 'PAGADA' ? rgb(0.075, 0.376, 0.173) : factura.estado === 'ANULADA' ? rgb(0.8, 0.1, 0.1) : GRAY
  page.drawText(factura.estado, { x: col2X + 120, y, size: 8, font: fontBold, color: estadoColor })

  // ── Cliente box ─────────────────────────────────────────────────────────────
  const clienteY = PAGE_H - 100
  page.drawRectangle({ x: ML, y: clienteY - 52, width: CW / 2 - 10, height: 58, color: LIGHT_GRAY })
  page.drawText('DATOS DEL CLIENTE', { x: ML + 8, y: clienteY - 6, size: 7.5, font: fontBold, color: GREEN })
  page.drawText(factura.cliente.razonSocial, { x: ML + 8, y: clienteY - 18, size: 8.5, font: fontBold, color: BLACK })
  page.drawText(`RUC: ${factura.cliente.ruc}`, { x: ML + 8, y: clienteY - 29, size: 7.5, font, color: GRAY })
  if (factura.cliente.direccion) {
    page.drawText(factura.cliente.direccion.substring(0, 55), { x: ML + 8, y: clienteY - 40, size: 7, font, color: GRAY })
  }

  y = clienteY - 68

  // ── Cotización referencia ───────────────────────────────────────────────────
  page.drawText(`Ref. Cotización:`, { x: ML, y, size: 8, font: fontBold, color: GRAY })
  const cot = factura.cotizacion
  const numCot = `COT-${String(cot.numero).padStart(3, '0')}-${cot.anio}`
  page.drawText(numCot, { x: ML + 110, y, size: 8, font, color: BLACK })
  y -= 16

  // ── Separator ───────────────────────────────────────────────────────────────
  page.drawLine({ start: { x: ML, y }, end: { x: PAGE_W - MR, y }, thickness: 0.8, color: GREEN })
  y -= 4

  // ── Items table header ──────────────────────────────────────────────────────
  page.drawRectangle({ x: ML, y: y - 4, width: CW, height: 18, color: GREEN })
  page.drawText('N°', { x: ML + 5, y: y + 2, size: 8, font: fontBold, color: WHITE })
  page.drawText('Descripción del Servicio', { x: ML + 30, y: y + 2, size: 8, font: fontBold, color: WHITE })
  page.drawText('Monto', { x: PAGE_W - MR - 55, y: y + 2, size: 8, font: fontBold, color: WHITE })
  y -= 22

  // ── Items ───────────────────────────────────────────────────────────────────
  // Collect items from cotizacion
  const allItems = cot.muestras.length > 0
    ? cot.muestras.flatMap(m =>
        m.items.map(it => ({ nombre: `${it.ensayo.nombre} — ${m.nombre}`, costo: it.costo }))
      )
    : cot.items.map(it => ({ nombre: it.ensayo.nombre, costo: it.costo }))

  allItems.forEach((item, idx) => {
    const rowBg = idx % 2 === 1 ? LIGHT_GRAY : WHITE
    page.drawRectangle({ x: ML, y: y - 4, width: CW, height: 16, color: rowBg })
    page.drawText(String(idx + 1), { x: ML + 5, y: y + 0, size: 7.5, font, color: GRAY })
    page.drawText(item.nombre.substring(0, 72), { x: ML + 30, y: y + 0, size: 7.5, font, color: BLACK })
    page.drawText(formatMoneda(item.costo, cot.moneda as 'USD' | 'PEN'), { x: PAGE_W - MR - 60, y: y + 0, size: 7.5, font, color: BLACK })
    y -= 16
  })

  y -= 8

  // ── Totals ──────────────────────────────────────────────────────────────────
  const totX = PAGE_W - MR - 160
  page.drawLine({ start: { x: totX, y }, end: { x: PAGE_W - MR, y }, thickness: 0.5, color: GRAY })
  y -= 14

  function totalRow(label: string, value: string, bold = false) {
    page.drawText(label, { x: totX, y, size: 8.5, font: bold ? fontBold : font, color: GRAY })
    page.drawText(value, { x: PAGE_W - MR - 80, y, size: 8.5, font: bold ? fontBold : font, color: bold ? BLACK : GRAY })
    y -= 14
  }

  totalRow('Subtotal:', formatMoneda(factura.subtotal, factura.moneda as 'USD' | 'PEN'))
  totalRow('IGV (18%):', formatMoneda(factura.igv, factura.moneda as 'USD' | 'PEN'))

  // Total box
  page.drawRectangle({ x: totX - 4, y: y - 5, width: PAGE_W - MR - totX + 4, height: 22, color: GREEN })
  page.drawText('TOTAL:', { x: totX, y: y + 3, size: 9.5, font: fontBold, color: WHITE })
  page.drawText(formatMoneda(factura.total, factura.moneda as 'USD' | 'PEN'), { x: PAGE_W - MR - 80, y: y + 3, size: 9.5, font: fontBold, color: WHITE })
  y -= 30

  // ── Notas ───────────────────────────────────────────────────────────────────
  if (factura.notas) {
    y -= 8
    page.drawText('Notas:', { x: ML, y, size: 8, font: fontBold, color: GREEN })
    y -= 13
    page.drawText(factura.notas.substring(0, 120), { x: ML, y, size: 8, font, color: GRAY })
    y -= 13
  }

  // ── Footer ──────────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 48, color: GREEN })
  page.drawText('Av. Angamos Este N° 2668–2670, Urb. La Calera – Surquillo', {
    x: ML, y: 32, size: 6.5, font, color: rgb(0.75, 0.93, 0.82),
  })
  page.drawText('servicios@cetox.com.pe  ·  (511) 920 008 680  ·  www.cetox.com.pe', {
    x: ML, y: 20, size: 6.5, font, color: rgb(0.75, 0.93, 0.82),
  })
  page.drawText('Documento generado electrónicamente por CETOX LAB ERP', {
    x: ML, y: 8, size: 5.5, font, color: rgb(0.55, 0.75, 0.65),
  })
  page.drawText('LE-044', { x: PAGE_W - 60, y: 20, size: 9, font: fontBold, color: TEAL })

  // ── Return PDF ──────────────────────────────────────────────────────────────
  const pdfBytes = await pdfDoc.save()
  const filename  = `Factura-${factura.serie}-${String(factura.numero).padStart(5, '0')}.pdf`

  return new NextResponse(pdfBytes as unknown as BodyInit, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
