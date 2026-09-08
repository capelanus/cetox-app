import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { formatFecha, formatNumODA, formatNumSET } from '@/lib/format'
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib'

// El ODA es el formato oficial en papel de CETOX (FR Nº 002-CETOX-V.07):
// una tabla simple en blanco y negro, sin membrete de marketing. Se genera
// aparte (no usa pdf-membrete) para respetar ese formato tal cual.

const BLACK = rgb(0, 0, 0)
const PAGE_W = 595, PAGE_H = 842
const ML = 42, MR = 42
const CW = PAGE_W - ML - MR
const FOOTER_H = 36

const FR_CODIGO = 'FR Nº 002-CETOX-V.07'
const FOOTNOTES = [
  '1.- Biológicas (sangre, orina, suero, etc); Agua (pozo, residual, potable, etc); Productos químicos (Plaguicida, desinfectante, solvente, etc); Otros (si es posible especificar)',
  '2.- Indicar el tipo de formulación: polvo mojable, suspensión concentrada, granulado, etc.',
  '3.- Refrigerado (en cadena de frío), Temperatura ambiente, etc',
  '4.- Para muestras biológicas y agua (si aplicara); para muestras de productos químicos (desinfectantes, plaguicidas u otros) indicar el peso o volumen aprox. recibido.',
  '5.- Para muestras biológicas (expuesto, no expuesto, se desconoce); para productos químicos (agrícola o no agrícola), otras indicaciones.',
]

async function loadLogo(pdfDoc: PDFDocument) {
  try {
    const { readFile } = await import('node:fs/promises')
    const path = await import('node:path')
    const file = path.join(process.cwd(), 'public', 'templates', 'cetox-logo.png')
    return await pdfDoc.embedPng(await readFile(file))
  } catch { /* intenta fetch */ }
  try {
    const base = process.env.NEXTAUTH_URL ?? 'https://cetoxlab.tech'
    const res = await fetch(`${base}/templates/cetox-logo.png`, { cache: 'no-store' })
    if (!res.ok) return null
    return await pdfDoc.embedPng(await res.arrayBuffer())
  } catch {
    return null
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const oda = await prisma.oDA.findUnique({
    where: { id },
    include: {
      items: { include: { ensayo: true } },
      set: true,
    },
  })
  if (!oda) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  const set = oda.set
  const numODA = formatNumODA(oda.numero, oda.anio)
  const numSET = formatNumSET(set.numero, set.anio)

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const logo = await loadLogo(pdfDoc)

  let page!: PDFPage
  let y = 0
  let pageNum = 0

  const wrapText = (text: string, maxW: number, size: number, f: PDFFont = font): string[] => {
    const out: string[] = []
    for (const para of text.split(/\r?\n/)) {
      const words = para.split(/\s+/).filter(Boolean)
      let cur = ''
      for (const wd of words) {
        const test = cur ? `${cur} ${wd}` : wd
        if (f.widthOfTextAtSize(test, size) > maxW && cur) { out.push(cur); cur = wd }
        else cur = test
      }
      out.push(cur || '')
    }
    return out
  }
  const centerAt = (text: string, x0: number, w: number, yy: number, size: number, f: PDFFont) => {
    const tw = f.widthOfTextAtSize(text, size)
    page.drawText(text, { x: x0 + (w - tw) / 2, y: yy, size, font: f, color: BLACK })
  }
  const hr = (yy: number, x0 = ML, x1 = PAGE_W - MR) =>
    page.drawLine({ start: { x: x0, y: yy }, end: { x: x1, y: yy }, thickness: 0.7, color: BLACK })
  const vseg = (x: number, y0: number, y1: number) =>
    page.drawLine({ start: { x, y: y0 }, end: { x, y: y1 }, thickness: 0.7, color: BLACK })

  function newPage() {
    pageNum++
    page = pdfDoc.addPage([PAGE_W, PAGE_H])
    y = PAGE_H - 40
    if (pageNum === 1) {
      const logoSize = 62
      if (logo) page.drawImage(logo, { x: ML, y: PAGE_H - 40 - logoSize, width: logoSize, height: logoSize })
      const headerTextX = ML + logoSize + 14
      const headerTextW = PAGE_W - MR - headerTextX
      centerAt('CENTRO TOXICOLÓGICO S.A.C.', headerTextX, headerTextW, PAGE_H - 48, 15, fontBold)
      centerAt('CETOX', headerTextX, headerTextW, PAGE_H - 65, 12, fontBold)
      y = PAGE_H - 40 - logoSize - 22

      const title = 'ORDEN DE ANÁLISIS (ODA)'
      const titleSize = 13
      const titleW = fontBold.widthOfTextAtSize(title, titleSize)
      const titleX = ML + (CW - titleW) / 2
      page.drawText(title, { x: titleX, y, size: titleSize, font: fontBold, color: BLACK })
      hr(y - 2, titleX, titleX + titleW)
      y -= 30
    } else {
      centerAt(`${numODA} — continuación`, ML, CW, y, 9, fontBold)
      y -= 20
    }
  }
  function ensureSpace(needed: number) {
    if (y < FOOTER_H + needed) newPage()
  }
  newPage()

  // ── SET Nº (recuadro destacado) ───────────────────────────────────────────────
  const setLabel = 'Solicitud de Ensayo Toxicológico (SET) Nº'
  const setLabelSize = 9
  const setLabelW = fontBold.widthOfTextAtSize(setLabel, setLabelSize)
  const setBoxW = 100, setBoxH = 18
  const setBoxX = PAGE_W - MR - setBoxW
  page.drawText(setLabel, { x: setBoxX - 8 - setLabelW, y: y - 12, size: setLabelSize, font: fontBold, color: BLACK })
  page.drawRectangle({ x: setBoxX, y: y - 18, width: setBoxW, height: setBoxH, borderColor: BLACK, borderWidth: 0.8 })
  centerAt(numSET, setBoxX, setBoxW, y - 14, 11, fontBold)
  y -= 34

  // ── Área de laboratorio / Fecha de recepción ──────────────────────────────────
  const infoBoxW = 230, infoBoxH = 32
  const infoBoxX = PAGE_W - MR - infoBoxW, infoColW = infoBoxW / 2
  page.drawRectangle({ x: infoBoxX, y: y - infoBoxH, width: infoBoxW, height: infoBoxH, borderColor: BLACK, borderWidth: 0.8 })
  vseg(infoBoxX + infoColW, y, y - infoBoxH)
  hr(y - infoBoxH / 2, infoBoxX, infoBoxX + infoBoxW)
  centerAt('Área de Laboratorio:', infoBoxX, infoColW, y - 11, 8, fontBold)
  centerAt('Fecha de recepción:', infoBoxX + infoColW, infoColW, y - 11, 8, fontBold)
  const fechaRecepcionTxt = oda.fechaRecepcion ? formatFecha(oda.fechaRecepcion) : formatFecha(set.fechaIngreso)
  centerAt(oda.area.toUpperCase(), infoBoxX, infoColW, y - infoBoxH + 6, 12, fontBold)
  centerAt(fechaRecepcionTxt, infoBoxX + infoColW, infoColW, y - infoBoxH + 6, 9.5, fontBold)
  y -= infoBoxH + 16

  // ── Datos de la muestra (tabla de campos, siempre visibles) ───────────────────
  const otraIndicacion = ({ Q: set.otraIndicacionQ, B: set.otraIndicacionB, M: set.otraIndicacionM } as Record<string, string | null>)[oda.area] ?? set.otraIndicacion

  const filas: { label: string; sup?: string; value: string | null }[] = [
    { label: 'Tipo de muestra', sup: '1', value: set.tipoMuestra },
    { label: 'Ingrediente activo', value: set.ingredienteActivo },
    { label: 'Formulación', sup: '2', value: set.formulacion },
    { label: 'Edad del paciente', value: oda.edadPaciente },
    { label: 'Condiciones ambientales', sup: '3', value: set.condicionesAmbientales },
    { label: 'Número de muestras', value: set.numeroMuestras },
    { label: 'Peso o volumen de muestra', sup: '4', value: set.pesoVolumen },
    { label: 'Código de la muestra', value: set.codigoMuestra },
    { label: 'Otra indicación', sup: '5', value: otraIndicacion },
  ]
  const fieldLabelW = 190
  const fieldValW = CW - fieldLabelW - 8
  const filasCalc = filas.map((r) => {
    const val = r.value && r.value.trim() ? r.value : '--'
    const lines = wrapText(val, fieldValW - 4, 8.5)
    return { ...r, lines, h: Math.max(15, lines.length * 10 + 5) }
  })
  const tableH = filasCalc.reduce((a, r) => a + r.h, 0)
  ensureSpace(tableH + 70)

  const tTop = y
  let ty = y
  filasCalc.forEach((r) => {
    page.drawText(r.label, { x: ML + 4, y: ty - 10, size: 8.5, font, color: BLACK })
    if (r.sup) {
      const lw = font.widthOfTextAtSize(r.label, 8.5)
      page.drawText(r.sup, { x: ML + 4 + lw + 1, y: ty - 6.5, size: 5.5, font, color: BLACK })
    }
    r.lines.forEach((ln, i) => page.drawText(ln, { x: ML + fieldLabelW + 4, y: ty - 10 - i * 10, size: 8.5, font, color: BLACK }))
    ty -= r.h
    hr(ty)
  })
  vseg(ML, tTop, ty)
  vseg(ML + fieldLabelW, tTop, ty)
  vseg(PAGE_W - MR, tTop, ty)
  hr(tTop)
  y = ty - 10

  // ── Notas a pie de tabla ───────────────────────────────────────────────────────
  for (const fn of FOOTNOTES) {
    const lines = wrapText(fn, CW, 6.6)
    for (const ln of lines) {
      ensureSpace(9)
      page.drawText(ln, { x: ML, y, size: 6.6, font, color: BLACK })
      y -= 8
    }
  }
  y -= 10

  // ── Ensayos solicitados ────────────────────────────────────────────────────────
  ensureSpace(40)
  const esLabel = 'Ensayos solicitados:'
  page.drawText(esLabel, { x: ML, y, size: 9.5, font: fontBold, color: BLACK })
  hr(y - 2, ML, ML + fontBold.widthOfTextAtSize(esLabel, 9.5))
  y -= 20

  const colEnsayoW = CW * 0.55, colFechaW = CW * 0.25, colOdaW = CW - colEnsayoW - colFechaW
  const xEnsayo = ML, xFecha = ML + colEnsayoW, xOda = ML + colEnsayoW + colFechaW

  ensureSpace(24)
  const eHeadTop = y
  centerAt('Tipo de ensayo', xEnsayo, colEnsayoW, y - 13, 8.5, fontBold)
  centerAt('Fecha de Entrega al cliente', xFecha, colFechaW, y - 13, 7.3, fontBold)
  centerAt('ODA Nº', xOda, colOdaW, y - 13, 8.5, fontBold)
  y -= 20
  hr(y); hr(eHeadTop)
  vseg(ML, eHeadTop, y); vseg(xFecha, eHeadTop, y); vseg(xOda, eHeadTop, y); vseg(PAGE_W - MR, eHeadTop, y)

  for (const it of oda.items) {
    const rowH = 18
    ensureSpace(rowH)
    const rTop = y
    page.drawText(it.ensayo.nombre.substring(0, 70), { x: xEnsayo + 4, y: y - 13, size: 8, font, color: BLACK })
    centerAt(formatFecha(it.fechaEntregaCompromiso), xFecha, colFechaW, y - 13, 8, font)
    centerAt(numODA, xOda, colOdaW, y - 13, 8, font)
    y -= rowH
    hr(y)
    vseg(ML, rTop, y); vseg(xFecha, rTop, y); vseg(xOda, rTop, y); vseg(PAGE_W - MR, rTop, y)
  }
  y -= 14

  // ── Observaciones ──────────────────────────────────────────────────────────────
  ensureSpace(56)
  const obsLabel = 'Observaciones:'
  page.drawText(obsLabel, { x: ML, y, size: 9.5, font: fontBold, color: BLACK })
  hr(y - 2, ML, ML + fontBold.widthOfTextAtSize(obsLabel, 9.5))
  y -= 14
  const obsBoxH = 42
  page.drawRectangle({ x: ML, y: y - obsBoxH, width: CW, height: obsBoxH, borderColor: BLACK, borderWidth: 0.8 })
  if (set.observaciones) {
    const lines = wrapText(set.observaciones, CW - 8, 8)
    lines.forEach((ln, i) => page.drawText(ln, { x: ML + 4, y: y - 11 - i * 10, size: 8, font, color: BLACK }))
  }
  hr(y - 14, ML, PAGE_W - MR)
  hr(y - 28, ML, PAGE_W - MR)
  y -= obsBoxH + 16

  // ── Conformidad de la recepción de la muestra ─────────────────────────────────
  ensureSpace(20)
  page.drawText('Conformidad de la recepción de la muestra:', { x: ML, y, size: 8.5, font: fontBold, color: BLACK })
  const confLabelW = fontBold.widthOfTextAtSize('Conformidad de la recepción de la muestra:', 8.5)
  page.drawLine({ start: { x: ML + confLabelW + 8, y: y - 2 }, end: { x: PAGE_W - MR - 110, y: y - 2 }, thickness: 0.6, color: BLACK })
  page.drawText('Fecha:', { x: PAGE_W - MR - 95, y, size: 8.5, font: fontBold, color: BLACK })
  const fechaLabelW = fontBold.widthOfTextAtSize('Fecha:', 8.5)
  page.drawLine({ start: { x: PAGE_W - MR - 95 + fechaLabelW + 4, y: y - 2 }, end: { x: PAGE_W - MR, y: y - 2 }, thickness: 0.6, color: BLACK })

  // ── Pie de página: código de formato + N° de página (todas las páginas) ──────
  const pages = pdfDoc.getPages()
  pages.forEach((p, i) => {
    p.drawText(FR_CODIGO, { x: ML, y: 24, size: 7.5, font, color: BLACK })
    const numTxt = String(i + 1)
    const numW = font.widthOfTextAtSize(numTxt, 7.5)
    p.drawText(numTxt, { x: PAGE_W - MR - numW, y: 24, size: 7.5, font, color: BLACK })
  })

  const bytes = await pdfDoc.save()
  return new NextResponse(bytes as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ODA-${numODA}.pdf"`,
    },
  })
}
