import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { formatFecha, formatNumODA, formatNumSET } from '@/lib/format'
import { rgb } from 'pdf-lib'
import {
  crearMembrete, GREEN, BLACK, GRAY, LIGHT_GRAY, WHITE, ML, MR, CW, PAGE_W,
} from '@/lib/pdf-membrete'

// El ODA es un documento de trabajo para el laboratorio; no debe exponer el
// cliente, el nombre comercial de la muestra ni los costos de los ensayos.
// El contenido sigue el formato oficial en papel (FR Nº 002-CETOX-V.07);
// el estilo visual es el mismo que usan las cotizaciones (membrete, verde
// corporativo, cuadros con bordes).

const AREA_LABELS: Record<string, string> = { Q: 'Química', B: 'Biología', M: 'Microbiología' }
const AREA_COLOR: Record<string, ReturnType<typeof rgb>> = {
  Q: rgb(0.11, 0.35, 0.75),
  B: GREEN,
  M: rgb(0.62, 0.36, 0.06),
}
const FR_CODIGO = 'FR Nº 002-CETOX-V.07'
const FOOTNOTES = [
  '1.- Biológicas (sangre, orina, suero, etc); Agua (pozo, residual, potable, etc); Productos químicos (Plaguicida, desinfectante, solvente, etc); Otros (si es posible especificar)',
  '2.- Indicar el tipo de formulación: polvo mojable, suspensión concentrada, granulado, etc.',
  '3.- Refrigerado (en cadena de frío), Temperatura ambiente, etc',
  '4.- Para muestras biológicas y agua (si aplicara); para muestras de productos químicos (desinfectantes, plaguicidas u otros) indicar el peso o volumen aprox. recibido.',
  '5.- Para muestras biológicas (expuesto, no expuesto, se desconoce); para productos químicos (agrícola o no agrícola), otras indicaciones.',
]

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

  const doc = await crearMembrete('ORDEN DE ANÁLISIS (ODA)', numODA, {
    plantilla: 'letterhead-cotizacion.pdf', gapExtra: 14, sinTitulo: true,
  })
  const { font, fontBold } = doc

  const wrapText = (text: string, maxW: number, size: number): string[] => {
    const out: string[] = []
    for (const para of text.split(/\r?\n/)) {
      const words = para.split(/\s+/).filter(Boolean)
      let cur = ''
      for (const wd of words) {
        const test = cur ? `${cur} ${wd}` : wd
        if (font.widthOfTextAtSize(test, size) > maxW && cur) { out.push(cur); cur = wd }
        else cur = test
      }
      out.push(cur || '')
    }
    return out
  }

  const bx0 = ML, bx1 = PAGE_W - MR
  const hline = (y: number) => doc.page.drawLine({ start: { x: bx0, y }, end: { x: bx1, y }, thickness: 0.6, color: GREEN })
  const vseg = (x: number, y1: number, y2: number) => doc.page.drawLine({ start: { x, y: y1 }, end: { x, y: y2 }, thickness: 0.6, color: GREEN })
  const centerAt = (text: string, x0: number, w: number, y: number, size: number, f: typeof font, color: typeof BLACK) => {
    const tw = f.widthOfTextAtSize(text, size)
    doc.page.drawText(text, { x: x0 + (w - tw) / 2, y, size, font: f, color })
  }

  // ── Encabezado (mismo estilo que la cotización) ───────────────────────────────
  doc.page.drawText('ORDEN DE ANÁLISIS (ODA)', { x: ML, y: doc.y, size: 15, font: fontBold, color: GREEN })
  const nw = fontBold.widthOfTextAtSize(numODA, 14)
  doc.page.drawText(numODA, { x: PAGE_W - MR - nw, y: doc.y, size: 14, font: fontBold, color: BLACK })
  doc.y -= 12
  doc.page.drawText('Documento de trabajo de laboratorio', { x: ML, y: doc.y, size: 8, font, color: GRAY })
  const setTxt = `Solicitud de Ensayo Toxicológico (SET) N° ${numSET}`
  const setW = font.widthOfTextAtSize(setTxt, 7.5)
  doc.page.drawText(setTxt, { x: PAGE_W - MR - setW, y: doc.y, size: 7.5, font, color: GRAY })
  doc.y -= 8
  doc.page.drawLine({ start: { x: ML, y: doc.y }, end: { x: PAGE_W - MR, y: doc.y }, thickness: 0.8, color: GREEN })
  doc.y -= 18

  const badge = (n: string, titulo: string) => {
    doc.page.drawRectangle({ x: ML, y: doc.y - 3, width: 13, height: 13, color: GREEN })
    doc.page.drawText(n, { x: ML + 4, y: doc.y, size: 8.5, font: fontBold, color: WHITE })
    doc.page.drawText(titulo, { x: ML + 19, y: doc.y, size: 9.5, font: fontBold, color: GREEN })
    doc.y -= 16
  }

  // ── Área de laboratorio / Fecha de recepción (destacadas) ─────────────────────
  const areaColor = AREA_COLOR[oda.area] ?? GREEN
  const areaLabel = (AREA_LABELS[oda.area] ?? oda.area).toUpperCase()
  const fechaRecepcionTxt = oda.fechaRecepcion ? formatFecha(oda.fechaRecepcion) : formatFecha(set.fechaIngreso)
  await doc.ensureSpace(30)
  doc.page.drawRectangle({ x: ML, y: doc.y - 8, width: CW, height: 24, color: areaColor })
  doc.page.drawText(`ÁREA DE LABORATORIO: ${areaLabel}`, { x: ML + 8, y: doc.y - 1, size: 12, font: fontBold, color: WHITE })
  const fechaRecepcionLbl = `FECHA DE RECEPCIÓN: ${fechaRecepcionTxt}`
  const fechaRecepcionLblW = fontBold.widthOfTextAtSize(fechaRecepcionLbl, 10)
  doc.page.drawText(fechaRecepcionLbl, { x: bx1 - 8 - fechaRecepcionLblW, y: doc.y, size: 10, font: fontBold, color: WHITE })
  doc.y -= 32

  // ── 1. Datos de la muestra (mismos campos que el formato físico) ─────────────
  const otraIndicacion = ({ Q: set.otraIndicacionQ, B: set.otraIndicacionB, M: set.otraIndicacionM } as Record<string, string | null>)[oda.area] ?? set.otraIndicacion
  const codigoMuestraTxt = (set.codigoMuestra ?? '').replace(/^MU[-\s]*/i, '')

  const filas: { label: string; sup?: string; value: string | null }[] = [
    { label: 'Tipo de muestra', sup: '1', value: set.tipoMuestra },
    { label: 'Ingrediente activo', value: set.ingredienteActivo },
    { label: 'Formulación', sup: '2', value: set.formulacion },
    { label: 'Edad del paciente', value: oda.edadPaciente },
    { label: 'Condiciones ambientales', sup: '3', value: set.condicionesAmbientales },
    { label: 'Número de muestras', value: set.numeroMuestras },
    { label: 'Peso o volumen de muestra', sup: '4', value: set.pesoVolumen },
    { label: 'Código de la muestra', value: codigoMuestraTxt },
    { label: 'Otra indicación', sup: '5', value: otraIndicacion },
  ]
  const labelW = 170, valW = CW - labelW - 8
  const filasCalc = filas.map((r) => {
    const val = r.value && r.value.trim() ? r.value : '—'
    const lines = wrapText(val, valW - 4, 8)
    return { ...r, lines, h: Math.max(14, lines.length * 9.4 + 5) }
  })
  const tableH = filasCalc.reduce((a, r) => a + r.h, 0)

  badge('1', 'DATOS DE LA MUESTRA')
  await doc.ensureSpace(tableH + 20)
  const tTop = doc.y
  let ty = doc.y
  filasCalc.forEach((r) => {
    doc.page.drawText(r.label, { x: bx0 + 4, y: ty - 9, size: 8, font: fontBold, color: BLACK })
    if (r.sup) {
      const lw = fontBold.widthOfTextAtSize(r.label, 8)
      doc.page.drawText(r.sup, { x: bx0 + 4 + lw + 1, y: ty - 5.5, size: 5.5, font, color: BLACK })
    }
    r.lines.forEach((ln, i) => doc.page.drawText(ln, { x: bx0 + labelW + 4, y: ty - 9 - i * 9.4, size: 8, font, color: BLACK }))
    ty -= r.h
    hline(ty)
  })
  vseg(bx0, tTop, ty); vseg(bx0 + labelW, tTop, ty); vseg(bx1, tTop, ty)
  hline(tTop)
  doc.y = ty - 8

  // Notas al pie de la tabla (según el formato oficial)
  for (const fn of FOOTNOTES) {
    for (const ln of wrapText(fn, CW, 6.6)) {
      await doc.ensureSpace(9)
      doc.page.drawText(ln, { x: ML, y: doc.y, size: 6.6, font, color: GRAY })
      doc.y -= 8
    }
  }
  doc.y -= 10

  // ── 2. Ensayos solicitados ────────────────────────────────────────────────────
  badge('2', 'ENSAYOS SOLICITADOS')
  const colEnsayoW = CW * 0.55, colFechaW = CW * 0.25, colOdaW = CW - colEnsayoW - colFechaW
  const xEnsayo = bx0, xFecha = bx0 + colEnsayoW, xOda = bx0 + colEnsayoW + colFechaW

  await doc.ensureSpace(24)
  doc.page.drawRectangle({ x: bx0, y: doc.y - 4, width: CW, height: 16, color: GREEN })
  centerAt('Tipo de ensayo', xEnsayo, colEnsayoW, doc.y, 8, fontBold, WHITE)
  centerAt('Fecha de Entrega al cliente', xFecha, colFechaW, doc.y, 7.3, fontBold, WHITE)
  centerAt('ODA N°', xOda, colOdaW, doc.y, 8, fontBold, WHITE)
  doc.y -= 16

  let idx = 0
  for (const it of oda.items) {
    await doc.ensureSpace(16)
    if (idx % 2 === 1) doc.page.drawRectangle({ x: bx0, y: doc.y - 4, width: CW, height: 14, color: LIGHT_GRAY })
    doc.page.drawText(it.ensayo.nombre.substring(0, 70), { x: bx0 + 4, y: doc.y, size: 8, font, color: BLACK })
    centerAt(formatFecha(it.fechaEntregaCompromiso), xFecha, colFechaW, doc.y, 8, font, BLACK)
    centerAt(numODA, xOda, colOdaW, doc.y, 8, font, BLACK)
    doc.y -= 14
    idx++
  }
  doc.y -= 10

  // ── 3. Observaciones ───────────────────────────────────────────────────────────
  badge('3', 'OBSERVACIONES')
  const obsBoxH = 40
  await doc.ensureSpace(obsBoxH + 16)
  const obsTop = doc.y
  doc.page.drawRectangle({ x: bx0, y: obsTop - obsBoxH, width: CW, height: obsBoxH, borderColor: GREEN, borderWidth: 0.7 })
  if (set.observaciones) {
    const lines = wrapText(set.observaciones, CW - 8, 8)
    lines.forEach((ln, i) => doc.page.drawText(ln, { x: bx0 + 4, y: obsTop - 11 - i * 10, size: 8, font, color: BLACK }))
  } else {
    hline(obsTop - 14); hline(obsTop - 27)
  }
  doc.y = obsTop - obsBoxH - 14

  // ── Conformidad de la recepción de la muestra ─────────────────────────────────
  await doc.ensureSpace(20)
  doc.page.drawText('Conformidad de la recepción de la muestra:', { x: ML, y: doc.y, size: 8.5, font: fontBold, color: GRAY })
  const confLabelW = fontBold.widthOfTextAtSize('Conformidad de la recepción de la muestra:', 8.5)
  doc.page.drawLine({ start: { x: ML + confLabelW + 8, y: doc.y - 2 }, end: { x: PAGE_W - MR - 110, y: doc.y - 2 }, thickness: 0.6, color: BLACK })
  doc.page.drawText('Fecha:', { x: PAGE_W - MR - 95, y: doc.y, size: 8.5, font: fontBold, color: GRAY })
  const fechaLabelW = fontBold.widthOfTextAtSize('Fecha:', 8.5)
  doc.page.drawLine({ start: { x: PAGE_W - MR - 95 + fechaLabelW + 4, y: doc.y - 2 }, end: { x: PAGE_W - MR, y: doc.y - 2 }, thickness: 0.6, color: BLACK })
  doc.y -= 16

  // ── Pie de página: código de formato + N° de página (todas las páginas) ──────
  const pages = doc.pdfDoc.getPages()
  pages.forEach((p, i) => {
    p.drawText(FR_CODIGO, { x: ML, y: 24, size: 7.5, font: fontBold, color: GREEN })
    const numTxt = String(i + 1)
    const numW = font.widthOfTextAtSize(numTxt, 7.5)
    p.drawText(numTxt, { x: PAGE_W - MR - numW, y: 24, size: 7.5, font: fontBold, color: GREEN })
  })

  return doc.finish(`ODA-${numODA}.pdf`, 'attachment') as unknown as NextResponse
}
