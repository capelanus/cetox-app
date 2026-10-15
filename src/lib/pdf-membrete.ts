import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib'
import { formatFecha } from '@/lib/format'

// ── Colores corporativos CETOX ────────────────────────────────────────────────
export const GREEN      = rgb(0.075, 0.376, 0.173)   // #13602C
export const TEAL       = rgb(0.290, 0.765, 0.698)   // #4AC3B2
export const BLACK      = rgb(0, 0, 0)
export const GRAY       = rgb(0.45, 0.45, 0.45)
export const LIGHT_GRAY = rgb(0.96, 0.96, 0.96)
export const WHITE      = rgb(1, 1, 1)

export const PAGE_W = 595   // A4
export const PAGE_H = 842
export const ML = 42
export const MR = 42
export const CW = PAGE_W - ML - MR

/** Carga un membrete oficial; si falla, retorna null (se usa header programático) */
async function loadTemplate(nombre = 'letterhead.pdf'): Promise<PDFDocument | null> {
  // 1) Leer del disco (next start sirve /public desde disco)
  try {
    const { readFile } = await import('node:fs/promises')
    const path = await import('node:path')
    const file = path.join(process.cwd(), 'public', 'templates', nombre)
    return await PDFDocument.load(await readFile(file))
  } catch { /* intenta fetch */ }
  // 2) Fallback: fetch (serverless donde /public no está en disco)
  try {
    const base = process.env.NEXTAUTH_URL ?? 'https://cetoxlab.tech'
    const res = await fetch(`${base}/templates/${nombre}`, { cache: 'no-store' })
    if (!res.ok) return null
    return await PDFDocument.load(await res.arrayBuffer())
  } catch {
    return null
  }
}

// ── Documento con membrete ─────────────────────────────────────────────────────
// Replica el patrón del generador de informes de ensayo: fondo del membrete por
// página, marca de agua, secciones y campos, con paginación automática.
export interface MembreteDoc {
  pdfDoc: PDFDocument
  font: PDFFont
  fontBold: PDFFont
  page: PDFPage
  y: number
  footerH: number
  numero: string
  newPage: () => Promise<void>
  ensureSpace: (needed: number) => Promise<void>
  section: (title: string) => Promise<void>
  field: (label: string, value: string | null | undefined) => void
  hr: (gap?: number) => void
  finish: (filename: string, disposition?: 'inline' | 'attachment') => Promise<Response>
}

/**
 * Crea un A4 con el membrete oficial de CETOX y el bloque de título estándar.
 * Devuelve helpers para agregar contenido debajo del título.
 */
export async function crearMembrete(
  titulo: string,
  numero: string,
  opts: { plantilla?: string; gapExtra?: number; numeroDerecha?: boolean; sinTitulo?: boolean; footerH?: number } = {},
): Promise<MembreteDoc> {
  const templateDoc = await loadTemplate(opts.plantilla)
  const HEADER_H = templateDoc ? 158 : 80
  // Los membretes nuevos (cotización, SET) no llevan franja inferior: el
  // llamador puede reservar menos pie y aprovechar la hoja.
  const FOOTER_H = opts.footerH ?? (templateDoc ? 88 : 50)
  // Espacio entre la cabecera y el contenido (gapExtra permite airearlo por doc)
  const TOP_Y = PAGE_H - HEADER_H - 12 - (opts.gapExtra ?? 0)

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let pageNum = 0

  function drawFallbackHeader(p: PDFPage) {
    p.drawRectangle({ x: 0, y: PAGE_H - 80, width: PAGE_W, height: 80, color: GREEN })
    p.drawText('CETOX LAB', { x: ML, y: PAGE_H - 38, size: 20, font: fontBold, color: WHITE })
    p.drawText('LABORATORIO DE ENSAYO ACREDITADO — INACAL-DA — Registro Nº LE-044', {
      x: ML, y: PAGE_H - 52, size: 7.5, font, color: rgb(0.75, 0.93, 0.82),
    })
    p.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 50, color: GREEN })
    p.drawText('Av. Angamos Este N° 2668–2670, Urb. La Calera – Surquillo', { x: ML, y: 33, size: 6.5, font, color: rgb(0.75, 0.93, 0.82) })
    p.drawText('servicios@cetox.com.pe  ·  (511) 920 008 680  ·  www.cetox.com.pe', { x: ML, y: 22, size: 6.5, font, color: rgb(0.75, 0.93, 0.82) })
    p.drawText('LE-044', { x: PAGE_W - 60, y: 20, size: 9, font: fontBold, color: TEAL })
  }

  const doc: MembreteDoc = {
    pdfDoc, font, fontBold, footerH: FOOTER_H, numero,
    page: null as unknown as PDFPage,
    y: TOP_Y,

    async newPage() {
      pageNum++
      if (templateDoc) {
        const [bg] = await pdfDoc.copyPages(templateDoc, [0])
        pdfDoc.addPage(bg)
      } else {
        pdfDoc.addPage([PAGE_W, PAGE_H])
      }
      const p = pdfDoc.getPage(pdfDoc.getPageCount() - 1)
      if (!templateDoc) drawFallbackHeader(p)
      else if (pageNum > 1) {
        p.drawRectangle({ x: 0, y: PAGE_H - 30, width: PAGE_W, height: 30, color: rgb(0, 0, 0), opacity: 0.25 })
        p.drawText(`${numero} — continuación`, { x: ML, y: PAGE_H - 20, size: 8, font: fontBold, color: WHITE })
      }
      doc.page = p
      doc.y = TOP_Y
    },

    async ensureSpace(needed: number) {
      if (doc.y < FOOTER_H + needed) await doc.newPage()
    },

    async section(title: string) {
      await doc.ensureSpace(28)
      doc.page.drawRectangle({ x: ML, y: doc.y - 3, width: CW, height: 17, color: LIGHT_GRAY })
      doc.page.drawText(title, { x: ML + 5, y: doc.y, size: 8.5, font: fontBold, color: GREEN })
      doc.y -= 21
    },

    field(label: string, value: string | null | undefined) {
      if (!value) return
      const valStr = String(value)
      const lines = Math.ceil(valStr.length / 82)
      doc.page.drawText(`${label}:`, { x: ML, y: doc.y, size: 8.5, font: fontBold, color: GRAY })
      doc.page.drawText(valStr.substring(0, 82), { x: ML + 132, y: doc.y, size: 8.5, font, color: BLACK })
      doc.y -= 13
      for (let i = 1; i < lines; i++) {
        doc.page.drawText(valStr.substring(i * 82, (i + 1) * 82), { x: ML + 132, y: doc.y, size: 8.5, font, color: BLACK })
        doc.y -= 13
      }
    },

    hr(gap = 8) {
      doc.y -= gap / 2
      doc.page.drawLine({ start: { x: ML, y: doc.y }, end: { x: PAGE_W - MR, y: doc.y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
      doc.y -= gap
    },

    async finish(filename: string, disposition: 'inline' | 'attachment' = 'inline') {
      const bytes = await pdfDoc.save()
      return new Response(bytes as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `${disposition}; filename="${filename}"`,
        },
      })
    },
  }

  // Primera página + bloque de título
  await doc.newPage()
  if (opts.sinTitulo) return doc   // el llamador dibuja su propio encabezado
  doc.page.drawText(titulo, { x: ML, y: doc.y, size: 13, font: fontBold, color: GREEN })
  if (opts.numeroDerecha) {
    // Número destacado a la derecha, en la misma línea del título (sin fecha ni subtítulo)
    const w = fontBold.widthOfTextAtSize(numero, 13)
    doc.page.drawText(numero, { x: PAGE_W - MR - w, y: doc.y, size: 13, font: fontBold, color: BLACK })
    doc.y -= 21
  } else {
    doc.y -= 15
    doc.page.drawText(numero, { x: ML, y: doc.y, size: 11, font: fontBold, color: BLACK })
    doc.page.drawText(`Fecha de emisión: ${formatFecha(new Date())}`, { x: PAGE_W - MR - 170, y: doc.y, size: 8.5, font, color: GRAY })
    doc.y -= 6
  }
  doc.page.drawLine({ start: { x: ML, y: doc.y }, end: { x: PAGE_W - MR, y: doc.y }, thickness: 0.8, color: GREEN })
  doc.y -= 14

  return doc
}

// ── Bloques "tipo cotización" ─────────────────────────────────────────────────
// Encabezado numerado y cuadro de celdas con etiqueta verde arriba y valor
// debajo, como en el PDF de cotización. Compacta en una fila lo que el formato
// de campos sueltos (`field`) gastaba en tres o cuatro líneas.
export const SHADE = rgb(0.918, 0.957, 0.957)   // fondo claro CETOX #EAF4F4

export interface CeldaGrid {
  label: string
  /** Varios valores se apilan en líneas (p. ej. tres contactos). */
  values: (string | null | undefined)[] | string | null | undefined
  /** Columnas que ocupa dentro de la fila (por defecto 1). */
  span?: number
  size?: number
}

export function wrapText(font: PDFFont, text: string, maxW: number, size: number): string[] {
  const out: string[] = []
  for (const para of String(text).split(/\r?\n/)) {
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

export function crearGrid(doc: MembreteDoc, columnas = 3) {
  const { font, fontBold } = doc
  const bx0 = ML, bx1 = PAGE_W - MR
  const colW = (bx1 - bx0) / columnas
  const LINE = 9.5, PAD_TOP = 16, PAD_BOT = 4

  const badge = (n: string, titulo: string) => {
    doc.page.drawRectangle({ x: ML, y: doc.y - 3, width: 13, height: 13, color: GREEN })
    doc.page.drawText(n, { x: ML + 4, y: doc.y, size: 8.5, font: fontBold, color: WHITE })
    doc.page.drawText(titulo, { x: ML + 19, y: doc.y, size: 9.5, font: fontBold, color: GREEN })
    doc.y -= 15
  }

  type Prep = { x: number; w: number; label: string; lines: string[]; vacio: boolean; size: number }
  const preparar = (celdas: CeldaGrid[]): Prep[] => {
    let x = bx0
    return celdas.map(c => {
      const span = c.span ?? 1
      const w = colW * span
      const size = c.size ?? 8
      const raw = Array.isArray(c.values) ? c.values : [c.values]
      const vals = raw.filter(Boolean).map(String)
      const lines = vals.length ? vals.flatMap(v => wrapText(font, v, w - 6, size)) : ['—']
      const p = { x, w, label: c.label, lines, vacio: vals.length === 0, size }
      x += w
      return p
    })
  }

  /**
   * Dibuja las filas de un cuadro, una por llamada a `filas`, con sombreado
   * alterno y bordes. Cada fila mide lo que necesite su celda más alta.
   */
  const cuadro = async (filas: CeldaGrid[][]) => {
    const preps = filas.map(preparar)
    const alturas = preps.map(p => PAD_TOP + Math.max(...p.map(c => c.lines.length)) * LINE + PAD_BOT - LINE + 2)
    const total = alturas.reduce((a, b) => a + b, 0)
    await doc.ensureSpace(total + 8)
    const yTop = doc.y
    let y = yTop
    preps.forEach((celdas, i) => {
      const h = alturas[i]
      const yBot = y - h
      if (i % 2 === 0) doc.page.drawRectangle({ x: bx0, y: yBot, width: bx1 - bx0, height: h, color: SHADE })
      celdas.forEach(c => {
        doc.page.drawText(c.label, { x: c.x + 3, y: y - 8, size: 6.3, font: fontBold, color: GREEN })
        c.lines.forEach((ln, j) => doc.page.drawText(ln, { x: c.x + 3, y: y - PAD_TOP - j * LINE, size: c.size, font, color: c.vacio ? GRAY : BLACK }))
        if (c.x > bx0) doc.page.drawLine({ start: { x: c.x, y }, end: { x: c.x, y: yBot }, thickness: 0.6, color: GREEN })
      })
      doc.page.drawLine({ start: { x: bx0, y: yBot }, end: { x: bx1, y: yBot }, thickness: 0.6, color: GREEN })
      y = yBot
    })
    doc.page.drawRectangle({ x: bx0, y, width: bx1 - bx0, height: yTop - y, borderColor: GREEN, borderWidth: 0.7 })
    doc.y = y - 12
  }

  return { badge, cuadro, bx0, bx1, colW }
}
