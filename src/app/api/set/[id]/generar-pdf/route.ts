import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { formatFecha, formatMoneda, formatNumSET } from '@/lib/format'

const AREA_LABELS: Record<string, string> = { Q: 'Química', B: 'Biología', M: 'Microbiología' }

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const set = await prisma.sET.findUnique({
    where: { id },
    include: {
      cliente: true,
      cotizacion: true,
      creadoPor: true,
      odas: {
        include: { items: { include: { ensayo: true } } },
        orderBy: { numero: 'asc' },
      },
    },
  })
  if (!set) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const moneda = (set.cotizacion?.moneda ?? 'USD') as 'USD' | 'PEN'
  const odas = set.odas

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const blue = rgb(0.122, 0.306, 0.475)
  const black = rgb(0, 0, 0)
  const gray = rgb(0.4, 0.4, 0.4)
  const lightGray = rgb(0.95, 0.95, 0.95)
  const white = rgb(1, 1, 1)

  let page = pdfDoc.addPage([595, 842])
  const { width, height } = page.getSize()
  let y = height

  const numSET = formatNumSET(set.numero, set.anio)

  const ensurePage = (yPos: number, minSpace = 50): [typeof page, number] => {
    if (yPos > minSpace) return [page, yPos]
    page = pdfDoc.addPage([595, 842])
    page.drawRectangle({ x: 0, y: height - 28, width, height: 28, color: blue })
    page.drawText(`CETOX LAB — ${numSET} (cont.)`, { x: 40, y: height - 18, size: 9, font: fontBold, color: white })
    return [page, height - 44]
  }

  // ── Header ────────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 75, width, height: 75, color: blue })
  page.drawText('CETOX LAB', { x: 40, y: height - 38, size: 22, font: fontBold, color: white })
  page.drawText('Centro Toxicológico S.A.C. — LE-044', { x: 40, y: height - 54, size: 9, font, color: rgb(0.8, 0.9, 1) })
  page.drawText('SOLICITUD DE ENSAYO TOXICOLÓGICO', { x: width - 230, y: height - 32, size: 10, font: fontBold, color: white })
  page.drawText(numSET, { x: width - 230, y: height - 48, size: 14, font: fontBold, color: rgb(0.8, 0.9, 1) })
  y = height - 75

  // ── Sección: cliente ──────────────────────────────────────────────────────
  y -= 18
  page.drawText('DATOS DEL CLIENTE', { x: 40, y, size: 8, font: fontBold, color: blue })
  y -= 13
  const clienteRows: [string, string][] = [
    ['Razón social', set.cliente.razonSocial],
    ['RUC', set.cliente.ruc],
    ...(set.cliente.direccion ? [['Dirección', set.cliente.direccion] as [string, string]] : []),
    ...(set.cotizacion?.contactoNombre ? [['Contacto', set.cotizacion.contactoNombre] as [string, string]] : []),
    ...(set.cotizacion?.contactoEmail ? [['Email', set.cotizacion.contactoEmail] as [string, string]] : []),
    ...(set.cotizacion?.contactoTelefono ? [['Teléfono', set.cotizacion.contactoTelefono] as [string, string]] : []),
  ]
  for (const [label, value] of clienteRows) {
    page.drawText(`${label}:`, { x: 40, y, size: 8.5, font: fontBold, color: gray })
    page.drawText(value, { x: 130, y, size: 8.5, font, color: black })
    y -= 12
  }

  // Datos SET derecha
  let ry = height - 93
  const rightX = 360
  page.drawText('DATOS DEL SET', { x: rightX, y: ry, size: 8, font: fontBold, color: blue })
  ry -= 13
  const setRows: [string, string][] = [
    ['Código muestra', set.codigoMuestra],
    ['Fecha ingreso', formatFecha(set.fechaIngreso)],
    ['Creado por', set.creadoPor.nombre],
  ]
  for (const [label, value] of setRows) {
    page.drawText(`${label}:`, { x: rightX, y: ry, size: 8.5, font: fontBold, color: gray })
    page.drawText(value, { x: rightX + 85, y: ry, size: 8.5, font, color: black })
    ry -= 12
  }

  y = Math.min(y, ry) - 14
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
  y -= 14

  // ── Sección: muestra ──────────────────────────────────────────────────────
  page.drawText('DATOS DE LA MUESTRA', { x: 40, y, size: 8, font: fontBold, color: blue })
  y -= 13
  const muestraRows: [string, string | null | undefined][] = [
    ['Nombre comercial', set.nombreComercial],
    ['Tipo de muestra', set.tipoMuestra],
    ['Ingrediente activo', set.ingredienteActivo],
    ['Formulación', set.formulacion],
    ['N° de lote', set.numeroLote],
    ['Peso / Volumen', set.pesoVolumen],
    ['Fecha fabricación', set.fechaFabricacion ? formatFecha(set.fechaFabricacion) : null],
    ['Fecha vencimiento', set.fechaVencimiento ? formatFecha(set.fechaVencimiento) : null],
    ['Ingreso de muestra', set.ingresoMuestra === 'Otro' ? `Otro: ${set.ingresoMuestraOtro ?? ''}` : set.ingresoMuestra],
    ['N° de muestras', set.numeroMuestras],
    ['Devolución sobrante', set.devolucionMuestra],
    ['Cond. ambientales', set.condicionesAmbientales],
  ]
  let col = 0
  for (const [label, value] of muestraRows) {
    if (!value) continue
    ;[page, y] = ensurePage(y)
    const x = col === 0 ? 40 : 310
    page.drawText(`${label}:`, { x, y, size: 8.5, font: fontBold, color: gray })
    page.drawText(String(value).substring(0, 38), { x: x + 85, y, size: 8.5, font, color: black })
    col = col === 0 ? 1 : 0
    if (col === 0) y -= 12
  }
  if (col === 1) y -= 12

  if (set.procedenciaDescripcion) {
    ;[page, y] = ensurePage(y)
    page.drawText('Procedencia:', { x: 40, y, size: 8.5, font: fontBold, color: gray })
    y -= 12
    for (const line of set.procedenciaDescripcion.split(/\r?\n/).slice(0, 3)) {
      page.drawText(line.substring(0, 90), { x: 40, y, size: 8, font, color: black })
      y -= 11
    }
  }

  y -= 8
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
  y -= 14

  // ── Sección: ensayos revisados con ODA ───────────────────────────────────
  ;[page, y] = ensurePage(y, 80)
  page.drawText(`ENSAYOS (${odas.length})`, { x: 40, y, size: 8, font: fontBold, color: blue })
  y -= 13

  if (odas.length === 0) {
    page.drawText('No hay ensayos asociados a este SET.', { x: 40, y, size: 9, font, color: gray })
    y -= 14
  } else {
    // Table header
    page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: 16, color: blue })
    page.drawText('ODA', { x: 44, y, size: 8, font: fontBold, color: white })
    page.drawText('Ensayo', { x: 95, y, size: 8, font: fontBold, color: white })
    page.drawText('Área', { x: 310, y, size: 8, font: fontBold, color: white })
    page.drawText('Fecha entrega', { x: 375, y, size: 8, font: fontBold, color: white })
    page.drawText('Costo', { x: width - 85, y, size: 8, font: fontBold, color: white })
    y -= 16

    let subtotal = 0
    odas.forEach((oda, idx) => {
      const ensayoNombre = oda.items.map((i) => i.ensayo.nombre).join(', ')
      const area = oda.area
      const fecha = formatFecha(oda.fechaEntregaCompromiso)
      const costo = oda.items.reduce((s, i) => s + i.costo, 0)
      subtotal += costo

      ;[page, y] = ensurePage(y)
      if (idx % 2 === 1) page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: 14, color: lightGray })

      page.drawText(String(oda.numero).padStart(5, '0'), { x: 44, y, size: 8, font: fontBold, color: black })
      page.drawText(ensayoNombre.substring(0, 48), { x: 95, y, size: 8, font, color: black })
      page.drawText(area, { x: 318, y, size: 8, font: fontBold, color: gray })
      page.drawText(fecha, { x: 375, y, size: 8, font, color: black })
      page.drawText(formatMoneda(costo, moneda), { x: width - 85, y, size: 8, font, color: black })
      y -= 14
    })

    // Totales
    y -= 4
    ;[page, y] = ensurePage(y, 50)
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
    y -= 13
    const igv = subtotal * 0.18
    const total = subtotal + igv
    for (const [label, val] of [['Subtotal', subtotal], ['IGV (18%)', igv]] as [string, number][]) {
      page.drawText(label, { x: width - 160, y, size: 9, font, color: gray })
      page.drawText(formatMoneda(val, moneda), { x: width - 80, y, size: 9, font, color: black })
      y -= 13
    }
    page.drawText('TOTAL', { x: width - 160, y, size: 10, font: fontBold, color: blue })
    page.drawText(formatMoneda(total, moneda), { x: width - 80, y, size: 10, font: fontBold, color: blue })
    y -= 16
  }

  // ── Condiciones de entrega ────────────────────────────────────────────────
  y -= 10
  ;[page, y] = ensurePage(y, 160)
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
  y -= 14

  page.drawText('ENTREGA DE INFORMES EN OFICINA CETOX', { x: 40, y, size: 8, font: fontBold, color: blue })
  y -= 12
  page.drawText('Hora de entrega: A partir de las 3:00 pm del día indicado.', { x: 40, y, size: 8, font, color: black })
  y -= 11
  const condLines = [
    'Lima/Callao, se recogerá en la oficina de CETOX.',
    'Provincia/Exterior, se podrá entregar por courier vía collect o previa cancelación por el envío por parte del cliente.',
  ]
  for (const line of condLines) {
    page.drawText(line.substring(0, 100), { x: 40, y, size: 8, font, color: black })
    y -= 11
  }
  y -= 6

  const importanteLines = [
    'IMPORTANTE: Por favor corroborar todos los datos. Firmando el presente documento da conformidad de TODOS los datos de la empresa',
    'y muestra indicados en el SET, asimismo tiene conocimiento de las condiciones contractuales.',
  ]
  for (const line of importanteLines) {
    page.drawText(line.substring(0, 100), { x: 40, y, size: 8, font: fontBold, color: black })
    y -= 11
  }

  // ── Firmas ────────────────────────────────────────────────────────────────
  y -= 24
  ;[page, y] = ensurePage(y, 70)
  const sigY = y
  const sig1X = 60
  const sig2X = 340

  // Líneas de firma
  page.drawLine({ start: { x: sig1X, y: sigY }, end: { x: sig1X + 160, y: sigY }, thickness: 0.75, color: black })
  page.drawLine({ start: { x: sig2X, y: sigY }, end: { x: sig2X + 180, y: sigY }, thickness: 0.75, color: black })

  // Etiquetas
  page.drawText('Cliente', { x: sig1X + 55, y: sigY - 12, size: 8, font: fontBold, color: gray })
  page.drawText('Centro Toxicológico S.A.C. "CETOX"', { x: sig2X + 10, y: sigY - 12, size: 8, font: fontBold, color: gray })
  y = sigY - 28

  // ── Footer ────────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width, height: 36, color: blue })
  page.drawText('CETOX LAB — Centro Toxicológico S.A.C. — LE-044', { x: 40, y: 22, size: 8, font, color: white })
  page.drawText(`Documento generado: ${formatFecha(new Date())}`, { x: 40, y: 10, size: 7, font, color: rgb(0.7, 0.8, 0.9) })
  page.drawText(numSET, { x: width - 100, y: 22, size: 8, font: fontBold, color: white })

  const pdfBytes = await pdfDoc.save()
  const filename = `SET-${numSET}.pdf`

  return new NextResponse(pdfBytes as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
