'use server'
/**
 * GET /api/informes/[id]/descargar-firmado
 *
 * Toma el PDF subido por la Dra. Anaya (archivoPdf) y le estampa el QR
 * de firma digital en la esquina inferior derecha de la ÚLTIMA página.
 * Devuelve ese PDF modificado — es exactamente el documento original + sello QR.
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
  const qrBuffer  = await QRCode.toBuffer(cert.qrUrl, { width: 220, margin: 1, errorCorrectionLevel: 'H' })
  const qrImage   = await pdfDoc.embedPng(qrBuffer)

  // ── 3. Estampar en la ÚLTIMA página ──────────────────────────────────────
  const lastPage  = pdfDoc.getPage(pdfDoc.getPageCount() - 1)
  const { width, height } = lastPage.getSize()

  const QR_SIZE   = 110
  const QR_MARGIN = 14
  const QR_X      = width  - QR_SIZE - QR_MARGIN   // esquina derecha
  const QR_BASE_Y = 82                               // sobre el footer del template
  const QR_TOP    = QR_BASE_Y + QR_SIZE

  // Fondo blanco limpio detrás del sello
  lastPage.drawRectangle({
    x:           QR_X - 6,
    y:           QR_BASE_Y - 22,
    width:       QR_SIZE + 12,
    height:      QR_SIZE + 42,
    color:       WHITE,
    borderColor: rgb(0.82, 0.91, 0.84),
    borderWidth: 0.6,
  })

  // Título del sello
  lastPage.drawText('FIRMADO DIGITALMENTE', {
    x: QR_X, y: QR_TOP + 16,
    size: 5.5, font: fontBold, color: GREEN,
  })
  lastPage.drawText('Dra. Rosalía Anaya · Gerente Técnico', {
    x: QR_X, y: QR_TOP + 8,
    size: 5, font, color: GRAY,
  })
  lastPage.drawText('CETOX LAB — LE-044', {
    x: QR_X, y: QR_TOP + 1,
    size: 4.5, font, color: GRAY,
  })

  // Imagen QR
  lastPage.drawImage(qrImage, { x: QR_X, y: QR_BASE_Y, width: QR_SIZE, height: QR_SIZE })

  // Código + instrucción bajo el QR
  lastPage.drawText(`Cód: ${cert.codigo}  ·  Clave: ${cert.clave}`, {
    x: QR_X, y: QR_BASE_Y - 10,
    size: 4.5, font: fontBold, color: GREEN,
  })
  lastPage.drawText('Escanear para verificar autenticidad', {
    x: QR_X, y: QR_BASE_Y - 18,
    size: 4, font, color: GRAY,
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
