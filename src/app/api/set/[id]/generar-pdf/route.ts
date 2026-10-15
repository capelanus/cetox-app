import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { formatFecha, formatMoneda, formatNumCotizacion, formatNumSET } from '@/lib/format'
import {
  crearMembrete, crearGrid, wrapText, type CeldaGrid,
  GREEN, BLACK, GRAY, LIGHT_GRAY, WHITE, SHADE, ML, MR, CW, PAGE_W,
} from '@/lib/pdf-membrete'

const NUM_FORMATO = 'SIG-FR-ADM-002'
const VERSION_FORMATO = 'Versión: 01'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
      odas: { include: { items: { include: { ensayo: true } } }, orderBy: { numero: 'asc' } },
    },
  })
  if (!set) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const moneda = (set.cotizacion?.moneda ?? 'USD') as 'USD' | 'PEN'
  const odas = set.odas
  const numSET = formatNumSET(set.numero, set.anio)
  const cot = set.cotizacion

  // Mismo membrete y misma estructura que el PDF de cotización: cabecera con
  // título/número, bloques numerados y cuadros de celdas compactos.
  const doc = await crearMembrete('SOLICITUD DE ENSAYO TOXICOLÓGICO', numSET, {
    plantilla: 'letterhead-set.pdf', gapExtra: 0, sinTitulo: true, footerH: 40,
  })
  const { font, fontBold } = doc
  const { badge, cuadro, bx0, bx1 } = crearGrid(doc, 3)

  // ── Encabezado ───────────────────────────────────────────────────────────────
  doc.page.drawText('SOLICITUD DE ENSAYO TOXICOLÓGICO', { x: ML, y: doc.y, size: 15, font: fontBold, color: GREEN })
  const nw = fontBold.widthOfTextAtSize(numSET, 14)
  doc.page.drawText(numSET, { x: PAGE_W - MR - nw, y: doc.y, size: 14, font: fontBold, color: BLACK })
  doc.y -= 12
  doc.page.drawText('Registro de ingreso de muestra (SET)', { x: ML, y: doc.y, size: 8, font, color: GRAY })
  const emi = `Ingreso: ${formatFecha(set.fechaIngreso)}    |    Emisión: ${formatFecha(new Date())}`
  const ew = font.widthOfTextAtSize(emi, 7.5)
  doc.page.drawText(emi, { x: PAGE_W - MR - ew, y: doc.y, size: 7.5, font, color: GRAY })
  doc.y -= 8
  doc.page.drawLine({ start: { x: ML, y: doc.y }, end: { x: PAGE_W - MR, y: doc.y }, thickness: 0.8, color: GREEN })
  doc.y -= 15

  // ── 1. DATOS DEL CLIENTE ─────────────────────────────────────────────────────
  badge('1', 'DATOS DEL CLIENTE')
  {
    const contactos = [cot?.contactoNombre, cot?.contactoNombre2, cot?.contactoNombre3]
    const telefonos = [cot?.contactoTelefono, cot?.contactoTelefono2, cot?.contactoTelefono3]
    const emails = [cot?.contactoEmail, cot?.contactoEmail2, cot?.contactoEmail3]
    await cuadro([
      [
        { label: 'SOLICITANTE', values: set.cliente.razonSocial, span: 2 },
        { label: 'R.U.C.', values: set.cliente.ruc },
      ],
      [{ label: 'DIRECCIÓN', values: set.cliente.direccion, span: 3 }],
      [
        { label: 'CONTACTO', values: contactos },
        { label: 'TELÉFONO', values: telefonos },
        { label: 'EMAIL', values: emails, size: 7 },
      ],
      [
        { label: 'COTIZACIÓN', values: cot ? formatNumCotizacion(cot.numero, cot.anio, cot.sufijo) : null },
        { label: 'CÓDIGO DE MUESTRA', values: set.codigoMuestra },
        { label: 'REGISTRADO POR', values: set.creadoPor.nombre },
      ],
    ])
  }

  // ── 2. DATOS DE LA MUESTRA ───────────────────────────────────────────────────
  badge('2', 'DATOS DE LA MUESTRA')
  {
    const ingreso = set.ingresoMuestra === 'Otro' ? `Otro: ${set.ingresoMuestraOtro ?? ''}` : set.ingresoMuestra
    const filas: CeldaGrid[][] = [
      [
        { label: 'NOMBRE COMERCIAL', values: set.nombreComercial, span: 2 },
        { label: 'TIPO DE MUESTRA', values: set.tipoMuestra },
      ],
      [
        { label: 'INGREDIENTE ACTIVO', values: set.ingredienteActivo },
        { label: 'FORMULACIÓN', values: set.formulacion },
        { label: 'N° DE LOTE', values: set.numeroLote },
      ],
      [
        { label: 'FECHA DE FABRICACIÓN', values: set.fechaFabricacion ? formatFecha(set.fechaFabricacion) : null },
        { label: 'FECHA DE VENCIMIENTO', values: set.fechaVencimiento ? formatFecha(set.fechaVencimiento) : null },
        { label: 'PESO / VOLUMEN', values: set.pesoVolumen },
      ],
      [
        { label: 'N° DE MUESTRAS', values: set.numeroMuestras },
        { label: 'INGRESO DE MUESTRA', values: ingreso },
        { label: 'DEVOLUCIÓN DE SOBRANTE', values: set.devolucionMuestra },
      ],
      [
        { label: 'CONDICIONES AMBIENTALES', values: set.condicionesAmbientales },
        { label: 'PROCEDENCIA', values: set.procedenciaDescripcion, span: 2 },
      ],
    ]
    // Filas que solo aparecen cuando hay algo que decir, para no gastar hoja.
    if (set.nombrePaciente || set.edadPaciente) {
      filas.push([
        { label: 'PACIENTE', values: set.nombrePaciente, span: 2 },
        { label: 'EDAD', values: set.edadPaciente },
      ])
    }
    if (set.tipoEnvase || set.materialEnvase || set.etiquetaEnvase || set.seguridadEnvase) {
      filas.push([
        { label: 'ENVASE', values: [set.tipoEnvase, set.materialEnvase].filter(Boolean).join(' · ') || null },
        { label: 'ETIQUETA', values: set.etiquetaEnvase },
        { label: 'SEGURIDAD', values: set.seguridadEnvase },
      ])
    }
    const indicaciones = [
      set.otraIndicacionQ && `Química: ${set.otraIndicacionQ}`,
      set.otraIndicacionB && `Biología: ${set.otraIndicacionB}`,
      set.otraIndicacionM && `Microbiología: ${set.otraIndicacionM}`,
      !set.otraIndicacionQ && !set.otraIndicacionB && !set.otraIndicacionM ? set.otraIndicacion : null,
    ].filter(Boolean) as string[]
    if (indicaciones.length) filas.push([{ label: 'INDICACIONES', values: indicaciones, span: 3 }])
    if (set.observaciones) filas.push([{ label: 'OBSERVACIONES', values: set.observaciones, span: 3 }])
    await cuadro(filas)
  }

  // ── 3. ENSAYOS SOLICITADOS ───────────────────────────────────────────────────
  const COL_AREA = PAGE_W - MR - 178, COL_FECHA = PAGE_W - MR - 138, COL_COSTO = PAGE_W - MR - 52
  const monedaCorta = moneda === 'USD' ? 'USD' : 'S/.'
  const formatNum = (v: number) => new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
  const drawRight = (text: string, x: number, y: number, size: number, f: typeof font, color: typeof BLACK) =>
    doc.page.drawText(text, { x: x - f.widthOfTextAtSize(text, size), y, size, font: f, color })

  await doc.ensureSpace(60)
  badge('3', `ENSAYOS SOLICITADOS (${odas.length})`)

  if (odas.length === 0) {
    doc.page.drawText('No hay ensayos asociados a este SET.', { x: ML, y: doc.y, size: 9, font, color: GRAY })
    doc.y -= 14
  } else {
    const tableHeader = async () => {
      await doc.ensureSpace(24)
      doc.page.drawRectangle({ x: ML, y: doc.y - 4, width: CW, height: 16, color: GREEN })
      doc.page.drawText('ODA', { x: ML + 4, y: doc.y, size: 8, font: fontBold, color: WHITE })
      doc.page.drawText('Ensayos - Método', { x: ML + 50, y: doc.y, size: 8, font: fontBold, color: WHITE })
      doc.page.drawText('Dpto.', { x: COL_AREA, y: doc.y, size: 8, font: fontBold, color: WHITE })
      doc.page.drawText('Entrega', { x: COL_FECHA, y: doc.y, size: 8, font: fontBold, color: WHITE })
      doc.page.drawText(`Costo (${monedaCorta})`, { x: COL_COSTO, y: doc.y, size: 8, font: fontBold, color: WHITE })
      doc.y -= 16
    }
    await tableHeader()

    let subtotal = 0
    let idx = 0
    for (const oda of odas) {
      const costo = oda.items.reduce((s, i) => s + i.costo, 0)
      subtotal += costo
      // Un ensayo por línea dentro de la fila de la ODA, envuelto al ancho de la columna.
      const lineas = oda.items.flatMap(i => wrapText(font, i.ensayo.nombre, COL_AREA - ML - 56, 8))
      const h = Math.max(12.5, lineas.length * 10 + 2.5)
      await doc.ensureSpace(h + 2)
      if (idx % 2 === 1) doc.page.drawRectangle({ x: ML, y: doc.y - h + 10, width: CW, height: h, color: LIGHT_GRAY })
      doc.page.drawText(String(oda.numero).padStart(5, '0'), { x: ML + 4, y: doc.y, size: 8, font: fontBold, color: BLACK })
      lineas.forEach((ln, i) => doc.page.drawText(ln, { x: ML + 50, y: doc.y - i * 10, size: 8, font, color: BLACK }))
      doc.page.drawText(oda.area, { x: COL_AREA, y: doc.y, size: 8, font: fontBold, color: GRAY })
      doc.page.drawText(formatFecha(oda.fechaEntregaCompromiso), { x: COL_FECHA, y: doc.y, size: 8, font, color: BLACK })
      doc.page.drawText(formatNum(costo), { x: COL_COSTO, y: doc.y, size: 8, font, color: BLACK })
      doc.y -= h
      idx++
    }

    // Totales en caja a la derecha, como en la cotización.
    await doc.ensureSpace(56)
    doc.hr(5)
    const igv = subtotal * 0.18, total = subtotal + igv
    const totLabelX = PAGE_W - MR - 150, totBoxX0 = totLabelX - 8, totBoxW = bx1 - totBoxX0, totRowH = 13
    const totBoxTop = doc.y + 4
    let rowTop = totBoxTop
    ;([['Sub-total', subtotal], ['I.G.V (18%)', igv]] as [string, number][]).forEach(([label, val], i) => {
      const rowBot = rowTop - totRowH
      if (i % 2 === 0) doc.page.drawRectangle({ x: totBoxX0, y: rowBot, width: totBoxW, height: totRowH, color: SHADE })
      doc.page.drawText(label, { x: totLabelX, y: rowTop - 11, size: 8.5, font, color: BLACK })
      drawRight(formatMoneda(val, moneda), bx1 - 6, rowTop - 11, 8.5, font, BLACK)
      rowTop = rowBot
    })
    const totalRowBot = rowTop - totRowH
    doc.page.drawRectangle({ x: totBoxX0, y: totalRowBot, width: totBoxW, height: totRowH, color: GREEN })
    doc.page.drawText(`TOTAL (${monedaCorta})`, { x: totLabelX, y: rowTop - 11, size: 9.5, font: fontBold, color: WHITE })
    drawRight(formatMoneda(total, moneda), bx1 - 6, rowTop - 11, 9.5, fontBold, WHITE)
    doc.page.drawRectangle({ x: totBoxX0, y: totalRowBot, width: totBoxW, height: totBoxTop - totalRowBot, borderColor: GREEN, borderWidth: 0.7 })
    doc.y = totalRowBot - 12
  }

  // ── 4. ENTREGA DE INFORMES ───────────────────────────────────────────────────
  const condiciones = [
    'Hora de entrega: a partir de las 3:00 pm del día indicado.',
    'Lima/Callao: se recoge en la oficina de CETOX.',
    'Provincia/Exterior: envío por courier vía collect o previa cancelación del envío por el cliente.',
  ]
  const importante = 'IMPORTANTE: Corrobore todos los datos. Al firmar este documento da conformidad de TODOS los datos de la empresa y de la muestra indicados en el SET, y declara conocer las condiciones contractuales.'
  const impLineas = wrapText(fontBold, importante, bx1 - bx0 - 12, 8)
  const boxH = 6 + condiciones.length * 11 + 6 + impLineas.length * 10 + 6
  const BANC_H = 24

  // Título, cuadro y firmas se reservan juntos para que no se partan de página.
  await doc.ensureSpace(15 + boxH + BANC_H + 36)
  badge('4', 'ENTREGA DE INFORMES EN OFICINA CETOX')
  const boxTop = doc.y + 4
  let cy = boxTop - 12
  for (const line of condiciones) {
    doc.page.drawText(line, { x: bx0 + 6, y: cy, size: 8, font, color: BLACK })
    cy -= 11
  }
  cy -= 4
  const impTop = cy + 9
  doc.page.drawRectangle({ x: bx0, y: impTop - impLineas.length * 10 - 4, width: bx1 - bx0, height: impLineas.length * 10 + 6, color: SHADE })
  for (const line of impLineas) {
    doc.page.drawText(line, { x: bx0 + 6, y: cy, size: 8, font: fontBold, color: BLACK })
    cy -= 10
  }
  const boxBot = boxTop - boxH
  doc.page.drawRectangle({ x: bx0, y: boxBot, width: bx1 - bx0, height: boxTop - boxBot, borderColor: GREEN, borderWidth: 0.7 })

  // ── Cuenta corriente: franja pegada al recuadro, una línea por moneda ─────
  const bancY = boxBot, bancH = 24
  doc.page.drawRectangle({ x: bx0, y: bancY - bancH, width: bx1 - bx0, height: bancH, color: SHADE, borderColor: GREEN, borderWidth: 0.7 })
  doc.page.drawRectangle({ x: bx0, y: bancY - bancH, width: 92, height: bancH, color: GREEN })
  doc.page.drawText('CUENTA CORRIENTE', { x: bx0 + 6, y: bancY - 10, size: 6.5, font: fontBold, color: WHITE })
  doc.page.drawText('BCP', { x: bx0 + 6, y: bancY - 19, size: 7.5, font: fontBold, color: WHITE })
  const cuentas: [string, string, string][] = [
    ['Dólares', '194-1427241-1-85', '00219400142724118592'],
    ['Soles', '194-1778268-0-01', '00219400177826800195'],
  ]
  const xCta = bx0 + 100, xNum = xCta + 54, xCciL = xNum + 80, xCci = xCciL + 20
  cuentas.forEach(([mon, cta, cci], i) => {
    const y = bancY - 10 - i * 9.5
    doc.page.drawText(`Cta. ${mon}`, { x: xCta, y, size: 7.5, font: fontBold, color: GREEN })
    doc.page.drawText(cta, { x: xNum, y, size: 7.5, font: fontBold, color: BLACK })
    doc.page.drawText('CCI', { x: xCciL, y, size: 7, font: fontBold, color: GRAY })
    doc.page.drawText(cci, { x: xCci, y, size: 7.5, font, color: BLACK })
  })
  doc.y = bancY - bancH - 24

  // ── Firmas ───────────────────────────────────────────────────────────────────
  const sigY = doc.y, sig1X = ML + 18, sig2X = PAGE_W - MR - 195
  doc.page.drawLine({ start: { x: sig1X, y: sigY }, end: { x: sig1X + 160, y: sigY }, thickness: 0.75, color: BLACK })
  doc.page.drawLine({ start: { x: sig2X, y: sigY }, end: { x: sig2X + 180, y: sigY }, thickness: 0.75, color: BLACK })
  doc.page.drawText('Cliente', { x: sig1X + 60, y: sigY - 13, size: 8, font: fontBold, color: GRAY })
  doc.page.drawText('Centro Toxicológico S.A.C. "CETOX"', { x: sig2X + 12, y: sigY - 13, size: 8, font: fontBold, color: GRAY })

  // ── Pie de página: código de formato (todas las páginas) ─────────────────────
  for (const p of doc.pdfDoc.getPages()) {
    const fw1 = fontBold.widthOfTextAtSize(NUM_FORMATO, 7)
    p.drawText(NUM_FORMATO, { x: PAGE_W - MR - fw1, y: 24, size: 7, font: fontBold, color: GREEN })
    const fw2 = font.widthOfTextAtSize(VERSION_FORMATO, 7)
    p.drawText(VERSION_FORMATO, { x: PAGE_W - MR - fw2, y: 14, size: 7, font, color: GREEN })
  }

  return doc.finish(`SET-${numSET}.pdf`, 'attachment') as unknown as NextResponse
}
