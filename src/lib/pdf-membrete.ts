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

/** Carga el membrete oficial; si falla, retorna null (se usa header programático) */
async function loadTemplate(): Promise<PDFDocument | null> {
  // 1) Leer del disco (next start sirve /public desde disco)
  try {
    const { readFile } = await import('node:fs/promises')
    const path = await import('node:path')
    const file = path.join(process.cwd(), 'public', 'templates', 'letterhead.pdf')
    return await PDFDocument.load(await readFile(file))
  } catch { /* intenta fetch */ }
  // 2) Fallback: fetch (serverless donde /public no está en disco)
  try {
    const base = process.env.NEXTAUTH_URL ?? 'https://cetoxlab.tech'
    const res = await fetch(`${base}/templates/letterhead.pdf`, { cache: 'no-store' })
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
export async function crearMembrete(titulo: string, numero: string): Promise<MembreteDoc> {
  const templateDoc = await loadTemplate()
  const HEADER_H = templateDoc ? 158 : 80
  const FOOTER_H = templateDoc ? 88 : 50
  const TOP_Y = PAGE_H - HEADER_H - 12

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
  doc.page.drawText(titulo, { x: ML, y: doc.y, size: 13, font: fontBold, color: GREEN })
  doc.y -= 15
  doc.page.drawText(numero, { x: ML, y: doc.y, size: 11, font: fontBold, color: BLACK })
  doc.page.drawText(`Fecha de emisión: ${formatFecha(new Date())}`, { x: PAGE_W - MR - 170, y: doc.y, size: 8.5, font, color: GRAY })
  doc.y -= 6
  doc.page.drawLine({ start: { x: ML, y: doc.y }, end: { x: PAGE_W - MR, y: doc.y }, thickness: 0.8, color: GREEN })
  doc.y -= 14

  return doc
}
