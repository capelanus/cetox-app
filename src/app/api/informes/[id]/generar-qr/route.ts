import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import QRCode from 'qrcode'
import { formatFecha, formatNumInforme } from '@/lib/format'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const informe = await prisma.informe.findUnique({
    where: { id },
    include: {
      certificadoQR: true,
      analista: true,
      oda: {
        include: {
          items: { include: { ensayo: true } },
          set: { include: { cliente: true } },
        },
      },
    },
  })

  if (!informe || !informe.certificadoQR) {
    return NextResponse.json({ error: 'Certificado no encontrado' }, { status: 404 })
  }

  const cert = informe.certificadoQR
  const set = informe.oda.set
  const cliente = set.cliente
  const ensayosNombres = informe.oda.items.map((i) => i.ensayo.nombre).join(', ')

  // Generate QR code as PNG buffer
  const qrBuffer = await QRCode.toBuffer(cert.qrUrl, { width: 200, margin: 2 })

  // Build PDF with pdf-lib
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const page = pdfDoc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()

  const blue = rgb(0.122, 0.306, 0.475) // #1F4E79
  const black = rgb(0, 0, 0)
  const gray = rgb(0.4, 0.4, 0.4)

  // Header
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: blue })
  page.drawText('CETOX LAB', { x: 40, y: height - 45, size: 24, font: fontBold, color: rgb(1, 1, 1) })
  page.drawText('Centro Toxicológico S.A.C. — LE-044', {
    x: 40, y: height - 62, size: 10, font, color: rgb(0.8, 0.9, 1),
  })

  // Title
  page.drawText('CERTIFICADO DE ANÁLISIS', {
    x: 40, y: height - 120, size: 18, font: fontBold, color: blue,
  })
  page.drawText(formatNumInforme(informe.prefijo, informe.numero, informe.anio), {
    x: 40, y: height - 145, size: 13, font: fontBold, color: black,
  })

  // Info fields
  let y = height - 190
  const fields = [
    ['Cliente', cliente.razonSocial],
    ['RUC', cliente.ruc],
    ['Muestra', set.nombreComercial ?? '—'],
    ['Lote', set.numeroLote ?? '—'],
    ['Ensayos', ensayosNombres],
    ['Analista', informe.analista.nombre],
    ['Revisión calidad', informe.firmaCalidad ? formatFecha(informe.firmaCalidad) : '—'],
    ['Firma gerencia', informe.firmaGerencia ? formatFecha(informe.firmaGerencia) : '—'],
  ]

  for (const [label, value] of fields) {
    page.drawText(`${label}:`, { x: 40, y, size: 10, font: fontBold, color: gray })
    page.drawText(value, { x: 200, y, size: 10, font, color: black })
    y -= 22
  }

  // Resultado
  y -= 10
  page.drawText('Resultado:', { x: 40, y, size: 10, font: fontBold, color: gray })
  y -= 18
  const resultado = informe.resultadoTexto ?? 'Véase el informe completo'
  const lines = resultado.split('\n').slice(0, 5)
  for (const line of lines) {
    page.drawText(line.substring(0, 90), { x: 40, y, size: 9, font, color: black })
    y -= 15
  }

  // QR Code
  const qrImage = await pdfDoc.embedPng(qrBuffer)
  const qrSize = 140
  page.drawImage(qrImage, {
    x: width - qrSize - 40,
    y: height - 350,
    width: qrSize,
    height: qrSize,
  })
  page.drawText('Escanee para verificar', {
    x: width - qrSize - 40,
    y: height - 365,
    size: 8,
    font,
    color: gray,
  })

  // Certification box — pie del documento con código, clave y URL de verificación
  page.drawRectangle({
    x: 40, y: 55, width: width - 80, height: 80,
    borderColor: blue, borderWidth: 1,
  })
  page.drawText('Este documento ha sido emitido por CETOX LAB (LE-044) y puede ser verificado en:', {
    x: 50, y: 118, size: 8, font, color: gray,
  })
  page.drawText(cert.qrUrl, {
    x: 50, y: 106, size: 8, font, color: gray,
  })
  page.drawText(`Código: ${cert.codigo}`, {
    x: 50, y: 90, size: 8, font: fontBold, color: blue,
  })
  page.drawText(`Clave de validación: ${cert.clave}`, {
    x: 50, y: 78, size: 8, font: fontBold, color: blue,
  })
  page.drawText(`Emitido: ${formatFecha(cert.fechaEmision)}`, {
    x: 50, y: 64, size: 8, font, color: gray,
  })

  const pdfBytes = await pdfDoc.save()
  const filename = `${informe.prefijo}-${informe.numero}-${informe.anio}-cert.pdf`

  return new NextResponse(pdfBytes as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
