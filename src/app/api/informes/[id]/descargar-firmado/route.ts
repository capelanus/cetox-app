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

  // ── Sello QR en el espacio blanco del footer ──────────────────────────────
  // Layout:
  //   [espacio blanco del footer derecho]
  //   ┌────────────────────┐
  //   │ FIRMADO DIGITALMENTE│  ← barra verde
  //   │                    │
  //   │    [QR IMAGE]      │  ← solo imagen, sin texto dentro
  //   │                    │
  //   └────────────────────┘
  //   Dra. Rosalía Anaya · Gerente Técnico  CETOX LAB — LE-044  Cód: …  ← línea única encima de la barra verde
  //   ════════════════════════════════════════════════════════ ← barra verde oscura del footer

  // Estimación del tope de la barra verde oscura del footer (≈ 40pt desde abajo del page)
  const GREEN_BAR_TOP = 40

  // ── 1. Línea de texto justo encima de la barra verde ─────────────────────
  const infoLine = `Dra. Rosalía Anaya · Gerente Técnico   CETOX LAB — LE-044   Cód: ${cert.codigo}  ·  Clave: ${cert.clave}`
  lastPage.drawText(infoLine, {
    x:    10,                   // más a la izquierda
    y:    48,                   // por encima del footer verde
    size: 7.5,
    font: fontBold,
    color: GREEN,
  })

  // ── 2. Sello QR (recuadro con barra de título + imagen QR) ───────────────
  const QR_SIZE  = 85   // más grande ahora que hay espacio
  const PAD      = 4
  const TITLE_H  = 11
  const STAMP_W  = QR_SIZE + PAD * 2      // 93pt
  const STAMP_H  = TITLE_H + QR_SIZE + PAD * 2  // ~103pt

  const MARGIN_R = 22
  // Ancla la BASE del sello en la esquina derecha con espacios simétricos
  const BASE_Y   = 10
  const STAMP_X  = width - STAMP_W - MARGIN_R

  // Fondo blanco (cubre fondo del footer)
  lastPage.drawRectangle({
    x: STAMP_X - 1, y: BASE_Y - 1,
    width: STAMP_W + 2, height: STAMP_H + 2,
    color: WHITE,
  })
  // Borde verde
  lastPage.drawRectangle({
    x: STAMP_X, y: BASE_Y,
    width: STAMP_W, height: STAMP_H,
    color: WHITE,
    borderColor: rgb(0.18, 0.55, 0.28),
    borderWidth: 0.7,
  })
  // Barra de título
  lastPage.drawRectangle({
    x: STAMP_X, y: BASE_Y + STAMP_H - TITLE_H,
    width: STAMP_W, height: TITLE_H,
    color: GREEN,
  })
  lastPage.drawText('FIRMADO DIGITALMENTE', {
    x: STAMP_X + PAD, y: BASE_Y + STAMP_H - 7.5,
    size: 5, font: fontBold, color: WHITE,
  })
  // QR image
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
