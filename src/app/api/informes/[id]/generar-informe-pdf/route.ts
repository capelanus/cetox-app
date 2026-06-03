'use server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import QRCode from 'qrcode'
import { formatFecha, formatNumInforme } from '@/lib/format'

// ── Colores corporativos CETOX ────────────────────────────────────────────────
const GREEN      = rgb(0.075, 0.376, 0.173)   // #13602C
const TEAL       = rgb(0.290, 0.765, 0.698)   // #4AC3B2
const BLACK      = rgb(0,     0,     0)
const GRAY       = rgb(0.45,  0.45,  0.45)
const LIGHT_GRAY = rgb(0.96,  0.96,  0.96)
const WHITE      = rgb(1,     1,     1)

const PAGE_W = 595   // A4
const PAGE_H = 842

// Márgenes y área de contenido
const ML = 42                              // margen izquierdo
const MR = 42                              // margen derecho
const CW = PAGE_W - ML - MR               // ancho de contenido

// ── Posición fija del QR (esquina inferior derecha del espacio en blanco) ─────
// El template tiene: barra verde inferior (~35px) + textos de descargo (~40px)
// El QR se ancla sobre esa área, siempre visible independiente del contenido.
const QR_SIZE   = 110                      // tamaño QR en puntos
const QR_MARGIN = 14                       // margen desde el borde derecho
const QR_X      = PAGE_W - QR_SIZE - QR_MARGIN   // ≈ 471
const QR_BASE_Y = 82                       // y desde abajo (despeja footer del template)

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Intenta cargar el membrete oficial; si falla, retorna null */
async function loadTemplate(): Promise<PDFDocument | null> {
  try {
    const base = process.env.NEXTAUTH_URL ?? 'https://cetox-app.vercel.app'
    const res  = await fetch(`${base}/templates/letterhead.pdf`, { cache: 'no-store' })
    if (!res.ok) return null
    const bytes = await res.arrayBuffer()
    return await PDFDocument.load(bytes)
  } catch {
    return null
  }
}

/** Dibuja el header programático (fallback si no hay membrete) */
function drawFallbackHeader(page: ReturnType<PDFDocument['getPage']>, font: ReturnType<PDFDocument['embedFont']> extends Promise<infer F> ? F : never, fontBold: typeof font) {
  // Barra superior verde
  page.drawRectangle({ x: 0, y: PAGE_H - 80, width: PAGE_W, height: 80, color: GREEN })
  page.drawText('CETOX LAB', { x: ML, y: PAGE_H - 38, size: 20, font: fontBold, color: WHITE })
  page.drawText('LABORATORIO DE ENSAYO ACREDITADO — INACAL-DA — Registro Nº LE-044', {
    x: ML, y: PAGE_H - 52, size: 7.5, font, color: rgb(0.75, 0.93, 0.82),
  })
  page.drawText('CENTRO TOXICOLÓGICO S.A.C. — CETOX LAB', {
    x: ML, y: PAGE_H - 64, size: 8.5, font: fontBold, color: TEAL,
  })
  // Barra inferior verde con datos de contacto
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 50, color: GREEN })
  page.drawText('Av. Angamos Este N° 2668–2670, Urb. La Calera – Surquillo', {
    x: ML, y: 33, size: 6.5, font, color: rgb(0.75, 0.93, 0.82),
  })
  page.drawText('servicios@cetox.com.pe  ·  (511) 920 008 680  ·  www.cetox.com.pe', {
    x: ML, y: 22, size: 6.5, font, color: rgb(0.75, 0.93, 0.82),
  })
  page.drawText('Datos proporcionados por el cliente · Prohibida su reproducción total o parcial', {
    x: ML, y: 10, size: 5.5, font, color: rgb(0.55, 0.75, 0.65),
  })
  page.drawText('LE-044', { x: PAGE_W - 60, y: 20, size: 9, font: fontBold, color: TEAL })
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  const informe = await prisma.informe.findUnique({
    where: { id },
    include: {
      analista:     true,
      certificadoQR: true,
      oda: {
        include: {
          items: { include: { ensayo: true } },
          set:   { include: { cliente: true } },
        },
      },
    },
  })
  if (!informe) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const set         = informe.oda.set
  const cliente     = set.cliente
  const ensayos     = informe.oda.items.map(i => i.ensayo.nombre).join(', ')
  const numInforme  = formatNumInforme(informe.prefijo, informe.numero, informe.anio)
  const descripEnvase = [set.tipoEnvase, set.materialEnvase, set.etiquetaEnvase, set.seguridadEnvase]
    .filter(Boolean).join(', ')

  // ── Cargar membrete ───────────────────────────────────────────────────────
  const templateDoc = await loadTemplate()
  const HEADER_H    = templateDoc ? 158 : 80   // alto del header en puntos
  const FOOTER_H    = templateDoc ? 88  : 50   // alto del footer (despeja footer del template)
  const TOP_Y       = PAGE_H - HEADER_H - 12   // coordenada y de inicio del contenido

  // ── Crear documento ───────────────────────────────────────────────────────
  const pdfDoc   = await PDFDocument.create()
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let pageNum = 0
  let page: ReturnType<PDFDocument['getPage']>

  async function newPage(): Promise<ReturnType<PDFDocument['getPage']>> {
    pageNum++
    if (templateDoc) {
      const [bg] = await pdfDoc.copyPages(templateDoc, [0])
      pdfDoc.addPage(bg)
    } else {
      pdfDoc.addPage([PAGE_W, PAGE_H])
    }
    const p = pdfDoc.getPage(pdfDoc.getPageCount() - 1)
    if (!templateDoc) drawFallbackHeader(p, font, fontBold)
    else if (pageNum > 1) {
      // Barra de continuación sobre el membrete
      p.drawRectangle({ x: 0, y: PAGE_H - 30, width: PAGE_W, height: 30, color: rgb(0, 0, 0), opacity: 0.25 })
      p.drawText(`${numInforme} — continuación`, {
        x: ML, y: PAGE_H - 20, size: 8, font: fontBold, color: WHITE,
      })
    }
    return p
  }

  page = await newPage()
  let y = TOP_Y

  // Verifica espacio; crea página nueva si hace falta
  async function ensureSpace(needed: number) {
    if (y < FOOTER_H + needed) {
      page = await newPage()
      y = TOP_Y
    }
  }

  // ── Título del informe ────────────────────────────────────────────────────
  page.drawText('INFORME DE ENSAYO ACREDITADO', {
    x: ML, y, size: 13, font: fontBold, color: GREEN,
  })
  y -= 15
  page.drawText(numInforme, { x: ML, y, size: 11, font: fontBold, color: BLACK })
  page.drawText(`Fecha de emisión: ${formatFecha(new Date())}`, {
    x: PAGE_W - MR - 170, y, size: 8.5, font, color: GRAY,
  })
  y -= 6
  page.drawLine({ start: { x: ML, y }, end: { x: PAGE_W - MR, y }, thickness: 0.8, color: GREEN })
  y -= 14

  // ── Helper: sección ───────────────────────────────────────────────────────
  async function section(title: string) {
    await ensureSpace(28)
    page.drawRectangle({ x: ML, y: y - 3, width: CW, height: 17, color: LIGHT_GRAY })
    page.drawText(title, { x: ML + 5, y, size: 8.5, font: fontBold, color: GREEN })
    y -= 21
  }

  // ── Helper: campo label/valor ─────────────────────────────────────────────
  function field(label: string, value: string | null | undefined) {
    if (!value) return
    const valStr = String(value)
    const lines  = Math.ceil(valStr.length / 82)
    page.drawText(`${label}:`, { x: ML, y, size: 8.5, font: fontBold, color: GRAY })
    // Primera línea del valor
    page.drawText(valStr.substring(0, 82), { x: ML + 132, y, size: 8.5, font, color: BLACK })
    y -= 13
    // Líneas adicionales si el valor es largo
    for (let i = 1; i < lines; i++) {
      page.drawText(valStr.substring(i * 82, (i + 1) * 82), {
        x: ML + 132, y, size: 8.5, font, color: BLACK,
      })
      y -= 13
    }
  }

  // ── 1. Solicitante ────────────────────────────────────────────────────────
  await section('1. SOLICITANTE')
  field('Razón social', cliente.razonSocial)
  field('RUC', cliente.ruc)
  field('Dirección', cliente.direccion)
  y -= 4

  // ── 2. Identificación de la muestra ──────────────────────────────────────
  await section('2. IDENTIFICACIÓN DE LA MUESTRA')
  field('Nombre comercial', set.nombreComercial)
  field('Ingrediente activo', set.ingredienteActivo)
  field('Formulación', set.formulacion)
  field('Número de lote', set.numeroLote)
  field('Fecha de fabricación', set.fechaFabricacion ? formatFecha(set.fechaFabricacion) : null)
  field('Fecha de vencimiento', set.fechaVencimiento ? formatFecha(set.fechaVencimiento) : null)
  field('Código interno', set.codigoMuestra)
  y -= 4

  // ── 3. Datos del ensayo ───────────────────────────────────────────────────
  await section('3. DATOS DEL ENSAYO')
  field('Análisis solicitado', ensayos)
  field('Descripción del envase', descripEnvase || null)
  field('Fecha de recepción', formatFecha(set.fechaIngreso))
  field('Inicio de ejecución', informe.oda.fechaInicioEjecucion ? formatFecha(informe.oda.fechaInicioEjecucion) : '________________________')
  field('Fin de ejecución', informe.fechaEnvioResultados ? formatFecha(informe.fechaEnvioResultados) : '________________________')
  field('Analista responsable', informe.analista.nombre)
  y -= 4

  // ── 4. Resultados ─────────────────────────────────────────────────────────
  await section('4. RESULTADOS')

  const resultadoTexto = informe.resultadoTexto ?? '(Sin resultados cargados)'
  for (const rawLine of resultadoTexto.split('\n')) {
    // Fragmenta líneas largas cada 90 caracteres
    const segments = rawLine.length === 0
      ? ['']
      : Array.from({ length: Math.ceil(rawLine.length / 90) }, (_, i) =>
          rawLine.substring(i * 90, (i + 1) * 90))

    for (const seg of segments) {
      await ensureSpace(20)
      page.drawText(seg, { x: ML, y, size: 8.5, font, color: BLACK })
      y -= 13
    }
  }
  y -= 6

  // ── 5. Imágenes adjuntas ──────────────────────────────────────────────────
  const imagenes: string[] = JSON.parse(informe.resultadoImagenes || '[]')
  if (imagenes.length > 0) {
    await section('5. ANEXOS — IMÁGENES')

    for (let i = 0; i < imagenes.length; i++) {
      try {
        const imgBytes = await fetch(imagenes[i]).then(r => r.arrayBuffer())
        const isJpg    = imagenes[i].match(/\.(jpe?g)/i) || !imagenes[i].match(/\.png/i)
        const img      = isJpg
          ? await pdfDoc.embedJpg(imgBytes)
          : await pdfDoc.embedPng(imgBytes)

        const maxW  = CW
        const maxH  = 260
        const ratio = Math.min(maxW / img.width, maxH / img.height)
        const imgW  = img.width  * ratio
        const imgH  = img.height * ratio

        await ensureSpace(imgH + 24)
        page.drawText(`Figura ${i + 1}`, { x: ML, y, size: 8, font: fontBold, color: GRAY })
        y -= 10
        page.drawImage(img, { x: ML, y: y - imgH, width: imgW, height: imgH })
        y -= imgH + 14
      } catch {
        await ensureSpace(16)
        page.drawText(`[Imagen ${i + 1} no disponible]`, { x: ML, y, size: 8, font, color: GRAY })
        y -= 13
      }
    }
    y -= 4
  }

  // ── 6. Firmas ─────────────────────────────────────────────────────────────
  await ensureSpace(80)
  y -= 24
  const sigY  = y
  const sig1X = ML + 10
  const sig2X = PAGE_W - MR - 190

  page.drawLine({ start: { x: sig1X, y: sigY }, end: { x: sig1X + 155, y: sigY }, thickness: 0.75, color: BLACK })
  page.drawLine({ start: { x: sig2X, y: sigY }, end: { x: sig2X + 175, y: sigY }, thickness: 0.75, color: BLACK })
  page.drawText('Analista responsable', { x: sig1X + 22, y: sigY - 13, size: 8, font: fontBold, color: GRAY })
  page.drawText('Centro Toxicológico S.A.C. "CETOX"', { x: sig2X + 10, y: sigY - 13, size: 8, font: fontBold, color: GRAY })
  y = sigY - 28

  // ── QR — esquina inferior derecha (posición fija sobre el espacio en blanco) ─
  if (informe.certificadoQR) {
    const cert     = informe.certificadoQR
    const qrBuffer = await QRCode.toBuffer(cert.qrUrl, { width: 200, margin: 1, errorCorrectionLevel: 'H' })
    const qrImage  = await pdfDoc.embedPng(qrBuffer)

    const lastPage = pdfDoc.getPage(pdfDoc.getPageCount() - 1)
    const qrTop    = QR_BASE_Y + QR_SIZE   // punto y superior del bloque QR

    // Fondo blanco detrás del QR (para que destaque sobre el template)
    lastPage.drawRectangle({
      x: QR_X - 6, y: QR_BASE_Y - 20,
      width: QR_SIZE + 12, height: QR_SIZE + 36,
      color: WHITE,
      borderColor: rgb(0.88, 0.92, 0.88),
      borderWidth: 0.5,
    })

    // Etiqueta superior
    lastPage.drawText('FIRMADO DIGITALMENTE', {
      x: QR_X, y: qrTop + 14,
      size: 5.5, font: fontBold, color: GREEN,
    })
    lastPage.drawText('Dra. Rosalía Anaya · Gerente Técnico', {
      x: QR_X, y: qrTop + 6,
      size: 5, font, color: GRAY,
    })

    // QR image
    lastPage.drawImage(qrImage, { x: QR_X, y: QR_BASE_Y, width: QR_SIZE, height: QR_SIZE })

    // Código bajo el QR
    lastPage.drawText(`Cód: ${cert.codigo}  ·  Clave: ${cert.clave}`, {
      x: QR_X, y: QR_BASE_Y - 9,
      size: 4.5, font: fontBold, color: GREEN,
    })
    lastPage.drawText('Escanear para verificar autenticidad', {
      x: QR_X, y: QR_BASE_Y - 16,
      size: 4, font, color: GRAY,
    })
  }

  // ── Devolver PDF ──────────────────────────────────────────────────────────
  const pdfBytes = await pdfDoc.save()
  const filename  = `InformeEnsayo-${numInforme}.pdf`

  return new NextResponse(pdfBytes as unknown as BodyInit, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
