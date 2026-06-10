import { PDFDocument, PDFFont, PDFPage, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import fs from 'node:fs/promises'
import path from 'node:path'

export type TipoReconocimiento = 'participación' | 'desempeño' | 'logro'

export interface CertificadoData {
  nombre:            string                  // "Andrea Castillo Blanco"
  tipoReconocimiento: TipoReconocimiento
  motivo:            string                  // "el Curso de Buenas Prácticas..."
  lugar:             string                  // "Lima, Perú"
  fecha:             string                  // "15 de marzo de 2026"
}

// ── Layout (page is 830.4 x 617.3 pt — A4 landscape-ish) ─────────────────
const TEMPLATE_PATH = path.join(process.cwd(), 'public', 'templates', 'certificado-cetox.pdf')
const FONT_BOLD_PATH = path.join(process.cwd(), 'public', 'fonts', 'Montserrat-ExtraBold.ttf')
const FONT_MED_PATH  = path.join(process.cwd(), 'public', 'fonts', 'Montserrat-Medium.ttf')

const COLOR_BLACK = rgb(0, 0, 0)
const COLOR_GREEN = rgb(0x00 / 255, 0x4d / 255, 0x1c / 255)  // #004d1c

// Y-coordinates measured from PDF bottom (pdf-lib convention)
const Y_NOMBRE     = 280   // nombre destinatario, debajo de "CETOX LAB otorga..."
const Y_TEXTO_TOP  = 230   // primer renglón del texto del motivo
const SIZE_NOMBRE  = 24
const SIZE_TEXTO   = 12
const LINE_HEIGHT  = 17
const TEXTO_MAX_WIDTH = 600 // ancho útil para wrap

// ── Word wrap ──────────────────────────────────────────────────────────────
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (font.widthOfTextAtSize(test, size) <= maxWidth) line = test
    else {
      if (line) lines.push(line)
      line = w
    }
  }
  if (line) lines.push(line)
  return lines
}

function drawCentered(
  page: PDFPage,
  text: string,
  y: number,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
) {
  const pageWidth = page.getWidth()
  const textWidth = font.widthOfTextAtSize(text, size)
  page.drawText(text, {
    x: (pageWidth - textWidth) / 2,
    y,
    size,
    font,
    color,
  })
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

  // 1) Nombre — Montserrat ExtraBold 24pt negro, centrado
  drawCentered(page, data.nombre, Y_NOMBRE, fontBold, SIZE_NOMBRE, COLOR_BLACK)

  // 2) Texto del motivo — Montserrat Medium 12pt verde #004d1c, multi-línea centrada
  const texto = (
    `por su ${data.tipoReconocimiento} en ${data.motivo}, ` +
    `realizado en ${data.lugar} el día ${data.fecha}. ` +
    `Con este reconocimiento, CETOX LAB reafirma su compromiso con la ` +
    `excelencia científica y el desarrollo profesional.`
  )
  const lines = wrapText(texto, fontMed, SIZE_TEXTO, TEXTO_MAX_WIDTH)
  for (let i = 0; i < lines.length; i++) {
    drawCentered(page, lines[i], Y_TEXTO_TOP - i * LINE_HEIGHT, fontMed, SIZE_TEXTO, COLOR_GREEN)
  }

  return await pdf.save()
}
