import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import QRCode from 'qrcode'

const GREEN = rgb(0.075, 0.376, 0.173)  // #13602C

/**
 * Carga un PDF desde una URL y estampa el QR de firma digital + la
 * línea "Clave: <clave>" en todas las páginas. Devuelve los bytes
 * del PDF estampado listo para servir.
 */
export async function stampQrOnPdf(pdfUrl: string, qrUrl: string, clave: string): Promise<Uint8Array> {
  const pdfRes = await fetch(pdfUrl)
  if (!pdfRes.ok) throw new Error(`No se pudo descargar el PDF (${pdfRes.status})`)

  const pdfBytes = await pdfRes.arrayBuffer()
  const pdfDoc   = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const qrBuffer = await QRCode.toBuffer(qrUrl, { width: 260, margin: 1, errorCorrectionLevel: 'H' })
  const qrImage  = await pdfDoc.embedPng(qrBuffer)

  const QR_SIZE  = 85
  const MARGIN_R = 22
  const BASE_Y   = 10

  for (const page of pdfDoc.getPages()) {
    const { width } = page.getSize()
    const STAMP_X  = width - QR_SIZE - MARGIN_R

    page.drawText(`Clave: ${clave}`, {
      x:    10,
      y:    48,
      size: 7.5,
      font: fontBold,
      color: GREEN,
    })

    page.drawImage(qrImage, {
      x: STAMP_X, y: BASE_Y,
      width: QR_SIZE, height: QR_SIZE,
    })
  }

  return await pdfDoc.save()
}
