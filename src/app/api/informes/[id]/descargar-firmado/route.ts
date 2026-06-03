'use server'
/**
 * GET /api/informes/[id]/descargar-firmado
 *
 * Toma el PDF subido por la Dra. Anaya (archivoPdf) y le estampa el QR
 * de firma digital en la esquina inferior derecha de la ÚLTIMA página.
 * Devuelve ese PDF modificado — es exactamente el documento original + sello QR.
 *
 * El sello va SIEMPRE sobre el footer del template (QR_BASE_Y ≥ 96):
 *   ┌─────────────────────────┐
 *   │ FIRMADO DIGITALMENTE    │  ← texto verde bold
 *   │ Dra. Rosalía Anaya …   │  ← gris
 *   │ CETOX LAB — LE-044     │  ← gris
 *   │ Cód: … · Clave: …      │  ← verde bold
 *   │ Escanear para verificar │  ← gris
 *   │ ┌──────────────────┐    │
 *   │ │   imagen QR      │    │
 *   │ └──────────────────┘    │
 *   └─────────────────────────┘  y=96 (clears template footer at y≈88)
 */
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import QRCode from 'qrcode'
import { formatNumInforme } from '@/lib/format'

const GREEN = rgb(0.075, 0.376, 0.173)  // #13602C
const GRAY  = rgb(0.45,  0.45,  0.45)
const WHITE = rgb(1, 1, 1)

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  const informe = await prisma.informe.findUnique({
    where:   { id },
    include: { certificadoQR: true },
  })

  if (!informe) return NextResponse.json({ error: 'Informe no encontrado' }, { status: 404 })
  if (!informe.archivoPdf) return NextResponse.json({ error: 'No hay documento subido' }, { status: 404 })
  if (!informe.certificadoQR) return NextResponse.json({ error: 'El informe aún no está certificado' }, { status: 400 })

  // ── 1. Cargar el PDF subido por la Dra. Anaya ─────────────────────────────
  const pdfRes = await fetch(informe.archivoPdf)
  if (!pdfRes.ok) return NextResponse.json({ error: 'No se pudo obtener el documento' }, { status: 502 })

  const pdfBytes  = await pdfRes.arrayBuffer()
  const pdfDoc    = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  const font      = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold  = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // ── 2. Generar imagen del QR ──────────────────────────────────────────────
  const cert      = informe.certificadoQR
  const qrBuffer  = await QRCode.toBuffer(cert.qrUrl, { width: 260, margin: 1, errorCorrectionLevel: 'H' })
  const qrImage   = await pdfDoc.embedPng(qrBuffer)

  // ── 3. Estampar en la ÚLTIMA página ──────────────────────────────────────
  const lastPage           = pdfDoc.getPage(pdfDoc.getPageCount() - 1)
  const { width }          = lastPage.getSize()

  // ── Sello QR anclado al pie de página ────────────────────────────────────
  // El template tiene un espacio reservado a la derecha del disclaimer de pie de página.
  // El QR se posiciona con la base en el pie de página y el sello sube hacia el contenido.
  const QR_SIZE  = 62   // QR escaneable, compacto
  const PAD      = 3
  const STAMP_W  = QR_SIZE + PAD * 2    // 68pt
  const TITLE_H  = 10   // barra "FIRMADO DIGITALMENTE"
  const STAMP_H  = TITLE_H + 28 + QR_SIZE + PAD  // título + 3 líneas + QR

  const MARGIN_R = 8
  const BASE_Y   = 8    // ancla al pie de página (por encima del borde físico)
  const STAMP_X  = width - STAMP_W - MARGIN_R

  // Fondo blanco detrás del sello (cubre el color de fondo del footer del template)
  lastPage.drawRectangle({
    x: STAMP_X - 1, y: BASE_Y - 1,
    width: STAMP_W + 2, height: STAMP_H + 2,
    color: WHITE,
  })

  // Borde exterior
  lastPage.drawRectangle({
    x: STAMP_X, y: BASE_Y,
    width: STAMP_W, height: STAMP_H,
    color: WHITE,
    borderColor: rgb(0.18, 0.55, 0.28),
    borderWidth: 0.6,
  })

  // Barra de título verde (parte superior del sello)
  lastPage.drawRectangle({
    x: STAMP_X, y: BASE_Y + STAMP_H - TITLE_H,
    width: STAMP_W, height: TITLE_H,
    color: GREEN,
  })
  lastPage.drawText('FIRMADO DIGITALMENTE', {
    x: STAMP_X + PAD, y: BASE_Y + STAMP_H - 7,
    size: 4.5, font: fontBold, color: WHITE,
  })

  // Líneas de texto bajo el título
  const TY = BASE_Y + STAMP_H - TITLE_H - 6
  lastPage.drawText('Dra. Rosalía Anaya · Gerente Técnico', {
    x: STAMP_X + PAD, y: TY,
    size: 3.8, font, color: GRAY,
  })
  lastPage.drawText('CETOX LAB — LE-044', {
    x: STAMP_X + PAD, y: TY - 8,
    size: 3.8, font, color: GRAY,
  })
  lastPage.drawText(`Cód: ${cert.codigo}  ·  Clave: ${cert.clave}`, {
    x: STAMP_X + PAD, y: TY - 16,
    size: 3.8, font: fontBold, color: GREEN,
  })

  // Imagen QR (parte inferior del sello)
  lastPage.drawImage(qrImage, {
    x: STAMP_X + PAD, y: BASE_Y + PAD,
    width: QR_SIZE, height: QR_SIZE,
  })

  // ── 4. Devolver el PDF modificado ─────────────────────────────────────────
  const result   = await pdfDoc.save()
  const numStr   = formatNumInforme(informe.prefijo, informe.numero, informe.anio)
  const filename = `InformeFirmado-${numStr}.pdf`

  return new NextResponse(result as unknown as BodyInit, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
