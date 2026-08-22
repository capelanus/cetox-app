import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { formatFecha, formatMoneda, formatNumCotizacion } from '@/lib/format'
import { MODALIDAD_LABELS } from '@/lib/constants'
import { rgb } from 'pdf-lib'
import {
  crearMembrete, GREEN, BLACK, GRAY, LIGHT_GRAY, WHITE, ML, MR, CW, PAGE_W,
} from '@/lib/pdf-membrete'

// Color de sombreado (fondo claro CETOX #EAF4F4)
const SHADE = rgb(0.918, 0.957, 0.957)

// Área como letra (código interno CETOX): Q Química · B Biología · M Microbiología · P Proveedor
const AREA_A_LETRA: Record<string, string> = {
  Q: 'Q', B: 'B', M: 'M', P: 'P', QUIMICA: 'Q', BIOLOGIA: 'B', MICROBIOLOGIA: 'M', PROVEEDOR: 'P',
}
const areaLetra = (a: string | null | undefined): string =>
  a ? (AREA_A_LETRA[a.toUpperCase()] ?? a[0].toUpperCase()) : ''

const DIRECCION_CETOX = 'Av. Angamos Este N° 2668–2670, Urb. La Calera – Surquillo'
const HORARIO_ATENCION = '9:00 am – 05:00 pm'
const NUM_FORMATO = 'FR N° 019-CETOX-V.09'
const DATOS_REQUISITOS = [
  '- Muestra(s) debidamente cerrada(s) e identificada(s)',
  '- Nombre comercial del producto',
  '- Ingrediente activo y su concentración',
  '- Tipo de formulación (Ej: polvo soluble, granulado, suspensión concentrada, etc.)',
  '- Fecha de fabricación, fecha de vencimiento y número de lote',
].join('\n')
const DATOS_BANCARIOS = [
  'Depósito o transferencia — Banco de Crédito del Perú, a nombre de CENTRO TOXICOLÓGICO S.A.C. (RUC 20506303746).',
  'Dólares americanos: Cta. cte. 1941427241185 // CCI 00219400142724118592',
  'Soles: Cta. cte. 1941778268001 // CCI 00219400177826800195',
  'Presentar / escanear el voucher de depósito: 920008680 (WhatsApp) / servicios@cetox.com.pe',
  'Sistema de Detracción (empresa nacional) tasa 12%: Banco de la Nación (S/) Cta. N° 058-067458. Tipo de operación 01 · Bien/servicio 037 (Demás servicios gravados con el IGV).',
  'Empresas extranjeras: Swift Code BCPLPEPL — Banco de Crédito del Perú, Jr. Lampa N° 499, Lima. Los gastos bancarios los asume el cliente (cargo "OUR").',
].join('\n')

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const cot = await prisma.cotizacion.findUnique({
    where: { id },
    include: {
      cliente: true,
      creadoPor: true,
      items: { include: { ensayo: true } },
      muestras: { include: { items: { include: { ensayo: true } } }, orderBy: { orden: 'asc' } },
    },
  })
  if (!cot) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  const moneda = cot.moneda as 'USD' | 'PEN'
  const monedaTxt = moneda === 'USD' ? 'Dólares americanos (USD)' : 'Soles (PEN)'
  const hasMuestras = cot.muestras.length > 0
  const numCot = formatNumCotizacion(cot.numero, cot.anio, cot.sufijo)

  const doc = await crearMembrete('COTIZACIÓN DE SERVICIOS', numCot, {
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
  const cell = (x: number, yTopRow: number, label: string, value: string | null | undefined, max = 58) => {
    doc.page.drawText(label, { x: x + 4, y: yTopRow - 12, size: 8, font: fontBold, color: BLACK })
    const lw = fontBold.widthOfTextAtSize(label, 8)
    if (value) doc.page.drawText(String(value).substring(0, max), { x: x + 4 + lw + 3, y: yTopRow - 12, size: 8, font, color: BLACK })
  }

  // ── Encabezado ───────────────────────────────────────────────────────────────
  doc.page.drawText('COTIZACIÓN DE SERVICIOS', { x: ML, y: doc.y, size: 15, font: fontBold, color: GREEN })
  const nw = fontBold.widthOfTextAtSize(numCot, 14)
  doc.page.drawText(numCot, { x: PAGE_W - MR - nw, y: doc.y, size: 14, font: fontBold, color: BLACK })
  doc.y -= 12
  doc.page.drawText('Análisis toxicológicos de laboratorio', { x: ML, y: doc.y, size: 8, font, color: GRAY })
  const emi = `Emisión: ${formatFecha(cot.fechaEmision)}    |    Vigencia: ${formatFecha(cot.vigenciaHasta)}`
  const ew = font.widthOfTextAtSize(emi, 7.5)
  doc.page.drawText(emi, { x: PAGE_W - MR - ew, y: doc.y, size: 7.5, font, color: GRAY })
  doc.y -= 8
  doc.page.drawLine({ start: { x: ML, y: doc.y }, end: { x: PAGE_W - MR, y: doc.y }, thickness: 0.8, color: GREEN })
  doc.y -= 18

  const badge = (n: string, titulo: string) => {
    doc.page.drawRectangle({ x: ML, y: doc.y - 3, width: 13, height: 13, color: GREEN })
    doc.page.drawText(n, { x: ML + 4, y: doc.y, size: 8.5, font: fontBold, color: WHITE })
    doc.page.drawText(titulo, { x: ML + 19, y: doc.y, size: 9.5, font: fontBold, color: GREEN })
    doc.y -= 16
  }

  // ── 1. DATOS DEL CLIENTE ─────────────────────────────────────────────────────
  badge('1', 'DATOS DEL CLIENTE')
  {
    const contactos = [cot.contactoNombre, cot.contactoNombre2, cot.contactoNombre3].filter(Boolean) as string[]
    const telefonos = [cot.contactoTelefono, cot.contactoTelefono2, cot.contactoTelefono3].filter(Boolean) as string[]
    const emails = [cot.contactoEmail, cot.contactoEmail2, cot.contactoEmail3].filter(Boolean) as string[]
    const maxA = Math.max(1, contactos.length, telefonos.length)
    const maxB = Math.max(1, emails.length)
    const hA = 12 + maxA * 10, hB = 12 + maxB * 10
    const total = hA + hB

    await doc.ensureSpace(total + 8)
    const yTop = doc.y, yBot = yTop - total
    const c1 = bx0, c2 = bx0 + 135, c3 = bx0 + 265, c4 = bx0 + 395
    const yB = yTop - hA

    // Sombreado en damero (alterna por fila y columna) con el color de fondo de la app
    const colX = [c1, c2, c3, c4, bx1]
    const rows = [
      { y0: yB, h: hA },
      { y0: yBot, h: hB },
    ]
    rows.forEach((row, ri) => {
      colX.slice(0, -1).forEach((cx, ci) => {
        if ((ri + ci) % 2 === 0) {
          doc.page.drawRectangle({ x: cx, y: row.y0, width: colX[ci + 1] - cx, height: row.h, color: SHADE })
        }
      })
    })

    // Bordes
    vseg(bx0, yTop, yBot); vseg(bx1, yTop, yBot)
    vseg(c2, yTop, yBot); vseg(c3, yTop, yBot); vseg(c4, yTop, yBot)
    for (const y of [yTop, yB, yBot]) hline(y)

    // Celda: etiqueta (versalita verde CETOX) arriba y valor(es) apilados debajo
    const cellV = (x: number, rowTop: number, label: string, values: (string | null | undefined)[], colW: number, size = 8) => {
      doc.page.drawText(label, { x: x + 3, y: rowTop - 8, size: 6.3, font: fontBold, color: GREEN })
      const maxCh = Math.max(6, Math.floor((colW - 5) / (size * 0.52)))
      const vals = values.filter(Boolean) as string[]
      ;(vals.length ? vals : ['—']).forEach((v, i) => {
        doc.page.drawText(v.substring(0, maxCh), { x: x + 3, y: rowTop - 18 - i * 9.5, size, font, color: vals.length ? BLACK : GRAY })
      })
    }

    // Fila A: Solicitante · R.U.C. · Contacto · Teléfono
    cellV(c1, yTop, 'SOLICITANTE', [cot.cliente.razonSocial], 135)
    cellV(c2, yTop, 'R.U.C.', [cot.cliente.ruc], 130)
    cellV(c3, yTop, 'CONTACTO', contactos, 130)
    cellV(c4, yTop, 'TELÉFONO', telefonos, bx1 - c4)

    // Fila B: Dirección · Moneda · Email · Comunicación (solo la forma elegida)
    const FORMA_LABEL: Record<string, string> = { EMAIL: 'E-mail', WHATSAPP: 'WhatsApp', TELEFONICA: 'Telefónica', PERSONAL: 'Personal', OTROS: 'Otros' }
    const comBase = cot.formaContacto ? (FORMA_LABEL[cot.formaContacto] ?? cot.formaContacto) : ''
    const comLabel = comBase + (cot.formaContacto === 'OTROS' && cot.formaContactoOtro ? `: ${cot.formaContactoOtro}` : '')
    cellV(c1, yB, 'DIRECCIÓN', [cot.cliente.direccion], 135)
    cellV(c2, yB, 'MONEDA', [monedaTxt], 130)
    cellV(c3, yB, 'EMAIL', emails, 130, 7)
    cellV(c4, yB, 'COMUNICACIÓN', [comLabel], bx1 - c4, 7)

    doc.y = yBot - 14
  }

  // ── 2. ENSAYOS COTIZADOS ─────────────────────────────────────────────────────
  badge('2', 'ENSAYOS COTIZADOS')
  // Columna de ensayo más ancha; área/entrega/costo más delgadas y a la derecha
  const COL_AREA = PAGE_W - MR - 178, COL_PLAZO = PAGE_W - MR - 128, COL_COSTO = PAGE_W - MR - 52

  async function tableHeader() {
    await doc.ensureSpace(24)
    doc.page.drawRectangle({ x: ML, y: doc.y - 4, width: CW, height: 16, color: GREEN })
    doc.page.drawText('Ensayo / método', { x: ML + 4, y: doc.y, size: 8, font: fontBold, color: WHITE })
    doc.page.drawText('Área', { x: COL_AREA, y: doc.y, size: 8, font: fontBold, color: WHITE })
    doc.page.drawText('Entrega*', { x: COL_PLAZO, y: doc.y, size: 8, font: fontBold, color: WHITE })
    doc.page.drawText('Costo', { x: COL_COSTO, y: doc.y, size: 8, font: fontBold, color: WHITE })
    doc.y -= 16
  }

  async function row(ensayo: { nombre: string; area: string }, costo: number, dias: number, shade: boolean) {
    const lineas = wrapText(ensayo.nombre, COL_AREA - ML - 8, 8)
    const h = Math.max(14, lineas.length * 10 + 3)
    await doc.ensureSpace(h + 2)
    if (shade) doc.page.drawRectangle({ x: ML, y: doc.y - h + 10, width: CW, height: h, color: LIGHT_GRAY })
    lineas.forEach((ln, i) => doc.page.drawText(ln, { x: ML + 4, y: doc.y - i * 10, size: 8, font, color: BLACK }))
    doc.page.drawText(areaLetra(ensayo.area), { x: COL_AREA, y: doc.y, size: 8, font: fontBold, color: GRAY })
    doc.page.drawText(`${dias} días`, { x: COL_PLAZO, y: doc.y, size: 8, font, color: BLACK })
    doc.page.drawText(formatMoneda(costo, moneda), { x: COL_COSTO, y: doc.y, size: 8, font, color: BLACK })
    doc.y -= h
  }

  if (hasMuestras) {
    for (const muestra of cot.muestras) {
      await doc.ensureSpace(40)
      doc.page.drawRectangle({ x: ML, y: doc.y - 4, width: CW, height: 15, color: LIGHT_GRAY })
      doc.page.drawText(`Muestra: ${muestra.nombre || '(sin nombre)'}`, { x: ML + 4, y: doc.y, size: 8.5, font: fontBold, color: GREEN })
      doc.y -= 16
      await tableHeader()
      let i = 0
      for (const it of muestra.items) { await row(it.ensayo, it.costo, it.tiempoEntregaDias, i % 2 === 1); i++ }
      doc.y -= 6
    }
  } else {
    await tableHeader()
    let i = 0
    for (const it of cot.items) { await row(it.ensayo, it.costo, it.tiempoEntregaDias, i % 2 === 1); i++ }
  }

  // ── Totales (derecha, en caja) + notas de entrega (izquierda) ────────────────
  await doc.ensureSpace(76)
  doc.hr()
  const bandY = doc.y
  const totLabelX = PAGE_W - MR - 150, totValX = COL_COSTO
  const drawRight = (text: string, x: number, y: number, size: number, f: typeof font, color: typeof BLACK) =>
    doc.page.drawText(text, { x: x - f.widthOfTextAtSize(text, size), y, size, font: f, color })

  const totBoxX0 = totLabelX - 8, totBoxW = bx1 - totBoxX0, totRowH = 16
  const totRows: [string, number][] = [
    ['Precio neto', cot.subtotal],
    ['Sub-total', cot.subtotal],
    ['I.G.V (18%)', cot.igv],
  ]
  const totRightEdge = bx1 - 6
  const totBoxTop = bandY + 4
  let rowTop = totBoxTop
  totRows.forEach(([label, val], i) => {
    const rowBot = rowTop - totRowH
    if (i % 2 === 0) doc.page.drawRectangle({ x: totBoxX0, y: rowBot, width: totBoxW, height: totRowH, color: SHADE })
    doc.page.drawText(label, { x: totLabelX, y: rowTop - 11, size: 8.5, font, color: BLACK })
    drawRight(formatMoneda(val, moneda), totRightEdge, rowTop - 11, 8.5, font, BLACK)
    rowTop = rowBot
  })
  const totalRowBot = rowTop - totRowH
  doc.page.drawRectangle({ x: totBoxX0, y: totalRowBot, width: totBoxW, height: totRowH, color: GREEN })
  doc.page.drawText('TOTAL (S/.)', { x: totLabelX, y: rowTop - 11, size: 9.5, font: fontBold, color: WHITE })
  drawRight(formatMoneda(cot.total, moneda), totRightEdge, rowTop - 11, 9.5, fontBold, WHITE)
  doc.page.drawRectangle({ x: totBoxX0, y: totalRowBot, width: totBoxW, height: totBoxTop - totalRowBot, borderColor: GREEN, borderWidth: 0.7 })
  let ty = totalRowBot - 8

  doc.page.drawText('Notas de entrega', { x: ML, y: bandY, size: 8.5, font: fontBold, color: GREEN })
  let ny = bandY - 12
  const notas = [
    `La presente cotización está emitida en ${monedaTxt}.`,
    '*El tiempo de entrega de los informes de ensayo indicado es referencial, la fecha exacta se especificará en la Solicitud de Ensayo (con el ingreso de la muestra).',
    '** El Informe de ensayo se emitirá en idioma español, se ofrece servicio de traducción.',
  ]
  const notaW = totLabelX - ML - 14
  for (const nota of notas) {
    for (const ln of wrapText(nota, notaW, 6.8)) {
      doc.page.drawText(ln, { x: ML, y: ny, size: 6.8, font, color: BLACK })
      ny -= 9
    }
    ny -= 2
  }
  doc.y = Math.min(ty, ny) - 14

  // ── 3. CONDICIONES Y RECEPCIÓN DE MUESTRAS ───────────────────────────────────
  const muestrasNombres = cot.muestras.map(m => m.nombre).filter(Boolean).join(', ')
  const observacionesTxt = [
    `La presente cotización está emitida en ${monedaTxt}.`,
    cot.observaciones,
    'El cliente debe verificar y confirmar si los ensayos cotizados son según sus requerimientos.',
  ].filter(Boolean).join('\n')

  type FRow = { label: string; value: string | null }
  const labelW2 = 160, valW2 = CW - labelW2 - 8

  // Solo se listan los campos con valor; los que quedan en blanco no se dibujan.
  const izqBase: FRow[] = [
    { label: 'Observaciones :', value: observacionesTxt },
    { label: 'Muestra :', value: muestrasNombres || null },
    { label: 'Datos y requisitos necesarios :', value: DATOS_REQUISITOS },
    { label: 'Lugar de recepción de muestra :', value: DIRECCION_CETOX },
    { label: 'Horario de atención :', value: HORARIO_ATENCION },
  ].filter(r => r.value)
  const derBase: FRow[] = [
    { label: 'Forma de pago :', value: MODALIDAD_LABELS[cot.modalidadPago] ?? cot.modalidadPago },
    { label: 'Teléfono 2 :', value: cot.contactoTelefono2 },
    { label: 'Hora :', value: cot.horaContacto },
  ].filter(r => r.value)

  const buildFilas = (base: FRow[]) => base.map(r => {
    const valueLines = wrapText(r.value as string, valW2 - 4, 8)
    return { label: r.label, valueLines, h: Math.max(13, valueLines.length * 9.7 + 4) }
  })
  const filasIzq = buildFilas(izqBase), filasDer = buildFilas(derBase)
  const hIzq = filasIzq.reduce((a, r) => a + r.h, 0)
  const hDer = filasDer.reduce((a, r) => a + r.h, 0)
  const subH = 15
  const totalH = subH + hIzq + (filasDer.length ? subH + hDer : 0)

  // Datos bancarios como bloque full-width debajo (predeterminado, no editable)
  const bancLines = wrapText(DATOS_BANCARIOS, CW - 4, 6.8)
  const bancH = bancLines.length * 8.2 + 12

  // Reservar el título + cuadro + datos bancarios juntos (evita que se separen)
  await doc.ensureSpace(totalH + bancH + 24)
  badge('3', 'CONDICIONES Y RECEPCIÓN DE MUESTRAS')

  const boxTop = doc.y

  const subHeader = (titulo: string) => {
    doc.page.drawRectangle({ x: bx0, y: doc.y - subH, width: bx1 - bx0, height: subH, color: GREEN })
    doc.page.drawText(titulo, { x: bx0 + 4, y: doc.y - subH + 5, size: 8, font: fontBold, color: WHITE })
    doc.y -= subH
  }
  const drawFilas = (filas: ReturnType<typeof buildFilas>) => {
    for (const r of filas) {
      doc.page.drawText(r.label, { x: bx0 + 4, y: doc.y - 9, size: 8, font: fontBold, color: BLACK })
      r.valueLines.forEach((ln, j) => doc.page.drawText(ln, { x: bx0 + labelW2 + 4, y: doc.y - 9 - j * 9.7, size: 8, font, color: BLACK }))
      doc.y -= r.h
    }
  }

  subHeader('RECEPCIÓN Y LOGÍSTICA')
  drawFilas(filasIzq)
  if (filasDer.length) {
    subHeader('CONDICIONES COMERCIALES')
    drawFilas(filasDer)
  }

  const boxBot = doc.y
  doc.page.drawRectangle({ x: bx0, y: boxBot, width: bx1 - bx0, height: boxTop - boxBot, borderColor: GREEN, borderWidth: 0.7 })
  doc.y = boxBot - 12

  // Datos bancarios (bloque full-width, texto pequeño, predeterminado)
  doc.page.drawText('Datos bancarios:', { x: ML, y: doc.y, size: 8, font: fontBold, color: GREEN })
  doc.y -= 10
  for (const ln of bancLines) {
    doc.page.drawText(ln, { x: ML, y: doc.y, size: 6.8, font, color: BLACK })
    doc.y -= 8.2
  }

  // ── Pie de página: N° de formato + texto legal (verde CETOX, en todas las páginas) ─
  const piePagina = [
    'Este documento no significa que se estén realizando las pruebas indicadas.',
    'Es necesaria la aceptación de la Solicitud de Ensayo Toxicológico por parte del cliente y el laboratorio.',
  ]
  for (const p of doc.pdfDoc.getPages()) {
    let fy = 42
    for (const ln of piePagina) {
      p.drawText(ln, { x: ML, y: fy, size: 7.5, font: fontBold, color: GREEN })
      fy -= 10
    }
    const fw = font.widthOfTextAtSize(NUM_FORMATO, 7)
    p.drawText(NUM_FORMATO, { x: PAGE_W - MR - fw, y: 32, size: 7, font: fontBold, color: GREEN })
  }

  return doc.finish(`Cotizacion-${numCot}.pdf`, 'attachment') as unknown as NextResponse
}
