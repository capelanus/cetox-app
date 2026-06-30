import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { formatFecha, formatNumSET, formatNumInforme } from '@/lib/format'

const GREEN  = rgb(0.075, 0.376, 0.173)  // #13602C
const BLACK  = rgb(0, 0, 0)
const GRAY   = rgb(0.4, 0.4, 0.4)
const LGRAY  = rgb(0.93, 0.93, 0.93)
const WHITE  = rgb(1, 1, 1)

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ setId: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { setId } = await params
  const set = await prisma.sET.findUnique({
    where: { id: setId },
    include: {
      cliente:      true,
      cargoEntrega: true,
      odas: {
        include: {
          items:   { include: { ensayo: true } },
          informe: true,
        },
        orderBy: { numero: 'asc' },
      },
    },
  })
  if (!set) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const cargo = set.cargoEntrega
  const numSET = formatNumSET(set.numero, set.anio)
  const numCE  = cargo
    ? `CE-${String(cargo.numero).padStart(4, '0')}-${cargo.anio}`
    : `CE-${numSET}`

  // ── Build PDF ─────────────────────────────────────────────────────────────
  const pdfDoc  = await PDFDocument.create()
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const page = pdfDoc.addPage([595, 842])
  const { width, height } = page.getSize()

  // ── Header ─────────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: GREEN })
  page.drawText('CETOX LAB', { x: 40, y: height - 38, size: 22, font: fontBold, color: WHITE })
  page.drawText('Centro Toxicológico S.A.C. — LE-044', { x: 40, y: height - 56, size: 8.5, font, color: rgb(0.75, 0.92, 0.8) })
  page.drawText('CARGO DE ENTREGA DE INFORMES', { x: width - 250, y: height - 34, size: 10, font: fontBold, color: WHITE })
  page.drawText(numCE, { x: width - 250, y: height - 52, size: 14, font: fontBold, color: rgb(0.75, 0.92, 0.8) })

  let y = height - 80

  // ── Helper: section title ──────────────────────────────────────────────────
  function sectionTitle(title: string) {
    y -= 18
    page.drawRectangle({ x: 40, y: y - 3, width: width - 80, height: 18, color: LGRAY })
    page.drawText(title, { x: 46, y: y + 2, size: 8, font: fontBold, color: GREEN })
    y -= 8
  }

  // ── Helper: data row ───────────────────────────────────────────────────────
  function row(label: string, value: string, xLabel = 40, xValue = 160) {
    y -= 16
    page.drawText(`${label}:`, { x: xLabel, y, size: 8.5, font: fontBold, color: GRAY })
    page.drawText(value || '—', { x: xValue, y, size: 8.5, font, color: BLACK })
  }

  // ── Cliente ────────────────────────────────────────────────────────────────
  sectionTitle('DATOS DEL CLIENTE')
  row('Razón social', set.cliente.razonSocial)
  row('RUC', set.cliente.ruc)
  if (set.cliente.direccion) row('Dirección', set.cliente.direccion)

  // ── Muestra ────────────────────────────────────────────────────────────────
  sectionTitle('DATOS DE LA MUESTRA')
  row('SET / Solicitud', numSET)
  row('Código de muestra', set.codigoMuestra ?? '—')
  row('Nombre comercial', set.nombreComercial ?? '—')

  // ── Informes entregados ────────────────────────────────────────────────────
  const odasConInforme = set.odas.filter(o => o.informe)
  if (odasConInforme.length > 0) {
    sectionTitle('INFORMES ENTREGADOS')
    y -= 4
    // Table header
    page.drawRectangle({ x: 40, y: y - 3, width: width - 80, height: 16, color: rgb(0.22, 0.55, 0.33) })
    page.drawText('Informe', { x: 46, y: y + 1, size: 8, font: fontBold, color: WHITE })
    page.drawText('Área', { x: 170, y: y + 1, size: 8, font: fontBold, color: WHITE })
    page.drawText('Ensayos', { x: 240, y: y + 1, size: 8, font: fontBold, color: WHITE })
    y -= 16

    for (const oda of odasConInforme) {
      const inf = oda.informe!
      const numInf = formatNumInforme(inf.prefijo, inf.numero, inf.anio)
      const ensayos = oda.items.map(i => i.ensayo.nombre).join(', ')
      const bg = odasConInforme.indexOf(oda) % 2 === 0 ? WHITE : rgb(0.97, 0.97, 0.97)
      page.drawRectangle({ x: 40, y: y - 3, width: width - 80, height: 15, color: bg })
      page.drawText(numInf, { x: 46, y, size: 8, font: fontBold, color: BLACK })
      page.drawText(oda.area ?? '—', { x: 170, y, size: 8, font, color: BLACK })
      // Wrap ensayos if too long
      const ensayosTrunc = ensayos.length > 70 ? ensayos.substring(0, 68) + '…' : ensayos
      page.drawText(ensayosTrunc, { x: 240, y, size: 8, font, color: BLACK })
      y -= 15
    }
  }

  // ── Receptor ────────────────────────────────────────────────────────────────
  sectionTitle('DATOS DEL RECEPTOR')
  row('Recibido por', cargo?.recibidoPor ?? '—')
  row('DNI', cargo?.dniRecibe ?? '—')
  row('Fecha de recepción', cargo?.fechaRecepcion ? formatFecha(cargo.fechaRecepcion) : '—')

  // ── Firma ───────────────────────────────────────────────────────────────────
  y -= 40

  // Two columns: left = firma receptor, right = entregado por CETOX
  const colW = (width - 80) / 2

  // Firma receptor
  page.drawLine({ start: { x: 50, y }, end: { x: 50 + colW - 20, y }, thickness: 0.8, color: BLACK })
  y -= 14
  page.drawText('Firma y sello del receptor', { x: 50, y, size: 8, font, color: GRAY })
  y += 14

  // Entregado por
  const x2 = 50 + colW + 20
  page.drawLine({ start: { x: x2, y }, end: { x: x2 + colW - 20, y }, thickness: 0.8, color: BLACK })
  y -= 14
  page.drawText('Entregado por — CETOX LAB', { x: x2, y, size: 8, font, color: GRAY })

  // ── Footer ─────────────────────────────────────────────────────────────────
  page.drawLine({ start: { x: 40, y: 36 }, end: { x: width - 40, y: 36 }, thickness: 0.5, color: LGRAY })
  page.drawText('CETOX LAB — Centro Toxicológico S.A.C. — LE-044', { x: 40, y: 24, size: 7.5, font, color: GRAY })
  const genDate = `Generado: ${formatFecha(new Date())}`
  page.drawText(genDate, { x: width - 40 - fontBold.widthOfTextAtSize(genDate, 7.5), y: 24, size: 7.5, font, color: GRAY })

  const pdfBytes = await pdfDoc.save()

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="CargoEntrega-${numCE}.pdf"`,
    },
  })
}
