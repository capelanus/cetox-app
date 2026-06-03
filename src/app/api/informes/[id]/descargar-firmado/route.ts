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

  // Dimensiones del sello
  const QR_SIZE   = 108   // imagen QR en puntos
  const LABEL_H   = 52    // altura reservada para las 5 líneas de texto sobre el QR
  const SIDE_PAD  = 6     // padding horizontal interior
  const STAMP_W   = QR_SIZE + SIDE_PAD * 2  // ancho total del sello
  const STAMP_H   = QR_SIZE + LABEL_H + 8   // alto total del sello

  // Posición: esquina inferior derecha, clears template footer (≈88pt)
  const MARGIN_R  = 16                       // margen desde borde derecho
  const BASE_Y    = 96                       // y inferior del sello (sobre el footer)
  const STAMP_X   = width - STAMP_W - MARGIN_R

  // Fondo blanco + borde verde claro
  lastPage.drawRectangle({
    x:           STAMP_X,
    y:           BASE_Y,
    width:       STAMP_W,
    height:      STAMP_H,
    color:       WHITE,
    borderColor: rgb(0.18, 0.55, 0.28),
    borderWidth: 0.8,
  })

  // Barra de título verde en la parte superior del sello
  lastPage.drawRectangle({
    x:      STAMP_X,
    y:      BASE_Y + STAMP_H - 14,
    width:  STAMP_W,
    height: 14,
    color:  GREEN,
  })
  lastPage.drawText('FIRMADO DIGITALMENTE', {
    x:    STAMP_X + SIDE_PAD,
    y:    BASE_Y + STAMP_H - 10,
    size: 5.5, font: fontBold, color: WHITE,
  })

  // Líneas de texto intermedias (de arriba hacia abajo, dentro del fondo blanco)
  const TEXT_START_Y = BASE_Y + STAMP_H - 20  // primera línea bajo la barra
  lastPage.drawText('Dra. Rosalía Anaya · Gerente Técnico', {
    x: STAMP_X + SIDE_PAD, y: TEXT_START_Y,
    size: 5, font, color: GRAY,
  })
  lastPage.drawText('CETOX LAB — LE-044', {
    x: STAMP_X + SIDE_PAD, y: TEXT_START_Y - 9,
    size: 4.5, font, color: GRAY,
  })
  lastPage.drawText(`Cód: ${cert.codigo}  ·  Clave: ${cert.clave}`, {
    x: STAMP_X + SIDE_PAD, y: TEXT_START_Y - 19,
    size: 4.5, font: fontBold, color: GREEN,
  })
  lastPage.drawText('Escanear para verificar autenticidad', {
    x: STAMP_X + SIDE_PAD, y: TEXT_START_Y - 29,
    size: 4, font, color: GRAY,
  })

  // Imagen QR centrada en la parte inferior del sello
  const qrX = STAMP_X + SIDE_PAD
  const qrY = BASE_Y + 4
  lastPage.drawImage(qrImage, {
    x: qrX, y: qrY,
    width:  QR_SIZE,
    height: QR_SIZE,
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
