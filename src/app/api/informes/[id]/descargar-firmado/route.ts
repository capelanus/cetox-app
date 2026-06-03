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

  // Dimensiones del sello — compacto, esquina inferior derecha
  const QR_SIZE  = 68    // imagen QR (pequeña pero escaneable)
  const PAD      = 4     // padding interior
  const STAMP_W  = QR_SIZE + PAD * 2   // 76pt
  const TITLE_H  = 11   // barra de título
  const LINES_H  = 34   // 4 líneas de texto bajo el título
  const STAMP_H  = TITLE_H + LINES_H + QR_SIZE + PAD * 2  // ≈ 121pt

  const MARGIN_R = 10
  const BASE_Y   = 92   // sobre el footer del template (≈88pt)
  const STAMP_X  = width - STAMP_W - MARGIN_R

  // Fondo blanco + borde verde
  lastPage.drawRectangle({
    x: STAMP_X, y: BASE_Y,
    width: STAMP_W, height: STAMP_H,
    color: WHITE,
    borderColor: rgb(0.18, 0.55, 0.28),
    borderWidth: 0.7,
  })

  // Barra de título verde
  lastPage.drawRectangle({
    x: STAMP_X, y: BASE_Y + STAMP_H - TITLE_H,
    width: STAMP_W, height: TITLE_H,
    color: GREEN,
  })
  lastPage.drawText('FIRMADO DIGITALMENTE', {
    x: STAMP_X + PAD, y: BASE_Y + STAMP_H - 7.5,
    size: 4.8, font: fontBold, color: WHITE,
  })

  // Líneas de texto (debajo del título, sobre el QR)
  const TY = BASE_Y + STAMP_H - TITLE_H - 7  // primera línea
  lastPage.drawText('Dra. Rosalía Anaya · Gerente Técnico', {
    x: STAMP_X + PAD, y: TY,
    size: 4, font, color: GRAY,
  })
  lastPage.drawText('CETOX LAB — LE-044', {
    x: STAMP_X + PAD, y: TY - 8,
    size: 4, font, color: GRAY,
  })
  lastPage.drawText(`Cód: ${cert.codigo}  ·  Clave: ${cert.clave}`, {
    x: STAMP_X + PAD, y: TY - 17,
    size: 4, font: fontBold, color: GREEN,
  })
  lastPage.drawText('Escanear para verificar', {
    x: STAMP_X + PAD, y: TY - 26,
    size: 3.8, font, color: GRAY,
  })

  // Imagen QR en la parte inferior del sello
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
