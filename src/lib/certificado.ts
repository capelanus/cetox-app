import { PDFDocument, PDFFont, PDFPage, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import fs from 'node:fs/promises'
import path from 'node:path'

export type TipoReconocimiento = 'participación' | 'desempeño' | 'logro'

export interface CertificadoData {
  nombre:             string                  // "Andrea Castillo Blanco"
  tipoReconocimiento: TipoReconocimiento
  motivo:             string                  // "el Curso de Buenas Prácticas..."
  lugar:              string                  // "Lima, Perú"
  dias:               string[]                // ["2026-03-15", "2026-03-16", ...]  ISO YYYY-MM-DD
  horas?:             number                  // 8, 16, etc. (opcional)
  expositor?:         string                  // "Dr. Juan Pérez" (opcional)
}

// ── Layout (page is 830.4 x 617.3 pt — landscape) ────────────────────────
const TEMPLATE_PATH  = path.join(process.cwd(), 'public', 'templates', 'certificado-cetox.pdf')
const FONT_BOLD_PATH = path.join(process.cwd(), 'public', 'fonts', 'Montserrat-ExtraBold.ttf')
const FONT_MED_PATH  = path.join(process.cwd(), 'public', 'fonts', 'Montserrat-Medium.ttf')

const COLOR_BLACK = rgb(0, 0, 0)
const COLOR_GREEN = rgb(0x00 / 255, 0x4d / 255, 0x1c / 255)  // #004d1c

const Y_NOMBRE          = 280
const Y_PARRAFO1_TOP    = 230   // primer renglón del texto principal
const PARAFO_GAP        = 12    // espacio extra entre párrafos
const Y_EXPOSITOR       = 102   // nombre del expositor (debajo de la etiqueta "Expositor")
const X_EXPOSITOR_CTR   = 588   // centro X del label "Expositor" (medido)
const SIZE_NOMBRE       = 24
const SIZE_TEXTO        = 12
const SIZE_EXPOSITOR    = 11
const LINE_HEIGHT       = 17
const TEXTO_MAX_WIDTH   = 600

// ── Día → frase con concordancia día/días ──────────────────────────────────
const MESES_ES = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre',
]

function parseISO(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m: m - 1, d }
}

function joinEs(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} y ${items[1]}`
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`
}

export function formatearDias(diasISO: string[]): { prefijo: 'día' | 'días'; frase: string } {
  if (diasISO.length === 0) return { prefijo: 'día', frase: '' }
  const ordenados = [...diasISO].sort()
  const fechas = ordenados.map(parseISO)

  if (fechas.length === 1) {
    const f = fechas[0]
    return { prefijo: 'día', frase: `${f.d} de ${MESES_ES[f.m]} de ${f.y}` }
  }

  // Agrupar por (year, month) y dentro listar los días
  const grupos = new Map<string, number[]>()
  for (const f of fechas) {
    const key = `${f.y}-${f.m}`
    if (!grupos.has(key)) grupos.set(key, [])
    grupos.get(key)!.push(f.d)
  }
  const partes: string[] = []
  for (const [key, dds] of grupos) {
    const [y, m] = key.split('-').map(Number)
    partes.push(`${joinEs(dds.map(String))} de ${MESES_ES[m]} de ${y}`)
  }
  return { prefijo: 'días', frase: joinEs(partes) }
}

// ── Wrap manual respetando word boundaries ─────────────────────────────────
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (font.widthOfTextAtSize(test, size) <= maxWidth) line = test
    else { if (line) lines.push(line); line = w }
  }
  if (line) lines.push(line)
  return lines
}

function drawCentered(
  page: PDFPage, text: string, y: number,
  font: PDFFont, size: number, color: ReturnType<typeof rgb>,
  centerX?: number,
) {
  const cx = centerX ?? page.getWidth() / 2
  const w = font.widthOfTextAtSize(text, size)
  page.drawText(text, { x: cx - w / 2, y, size, font, color })
}

// ── Main ────────────────────────────────────────────────────────────────────
export async function generarCertificadoPdf(data: CertificadoData): Promise<Uint8Array> {
  const [templateBytes, fontBoldBytes, fontMedBytes] = await Promise.all([
    fs.readFile(TEMPLATE_PATH),
    fs.readFile(FONT_BOLD_PATH),
    fs.readFile(FONT_MED_PATH),
  ])

  const pdf = await PDFDocument.load(templateBytes)
  pdf.registerFontkit(fontkit)
  const fontBold = await pdf.embedFont(fontBoldBytes)
  const fontMed  = await pdf.embedFont(fontMedBytes)
  const page = pdf.getPage(0)

  // 1) Nombre — ExtraBold 24pt negro, centrado
  drawCentered(page, data.nombre, Y_NOMBRE, fontBold, SIZE_NOMBRE, COLOR_BLACK)

  // 2) Párrafos del motivo — Medium 12pt verde #004d1c, multi-línea centrada
  const { prefijo, frase } = formatearDias(data.dias)
  const sufijoHoras = data.horas && data.horas > 0
    ? `, con una duración de ${data.horas} ${data.horas === 1 ? 'hora académica' : 'horas académicas'}`
    : ''
  const parrafo1 = (
    `Por su ${data.tipoReconocimiento} en ${data.motivo}, ` +
    `realizado en ${data.lugar} el ${prefijo} ${frase}${sufijoHoras}.`
  )
  const parrafo2 = (
    `Con este reconocimiento, CETOX LAB reafirma su compromiso con la ` +
    `excelencia científica y el desarrollo profesional.`
  )

  const lines1 = wrapText(parrafo1, fontMed, SIZE_TEXTO, TEXTO_MAX_WIDTH)
  const lines2 = wrapText(parrafo2, fontMed, SIZE_TEXTO, TEXTO_MAX_WIDTH)

  let y = Y_PARRAFO1_TOP
  for (const l of lines1) {
    drawCentered(page, l, y, fontMed, SIZE_TEXTO, COLOR_GREEN)
    y -= LINE_HEIGHT
  }
  y -= PARAFO_GAP  // espacio entre párrafos
  for (const l of lines2) {
    drawCentered(page, l, y, fontMed, SIZE_TEXTO, COLOR_GREEN)
    y -= LINE_HEIGHT
  }

  // 3) Nombre del expositor (opcional) — ExtraBold 11pt verde,
  // sobre la etiqueta "Expositor" del lado derecho
  if (data.expositor && data.expositor.trim()) {
    drawCentered(
      page, data.expositor.trim(),
      Y_EXPOSITOR, fontBold, SIZE_EXPOSITOR, COLOR_GREEN, X_EXPOSITOR_CTR,
    )
  }

  return await pdf.save()
}
