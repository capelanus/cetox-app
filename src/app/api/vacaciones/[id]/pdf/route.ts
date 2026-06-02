'use server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// ── Colors ────────────────────────────────────────────────────────────────────
const GREEN   = rgb(0.075, 0.376, 0.173)  // #13602C
const WHITE   = rgb(1, 1, 1)
const BLACK   = rgb(0, 0, 0)
const GRAY    = rgb(0.4, 0.4, 0.4)
const YELLOW  = rgb(1, 0.988, 0.753)      // light yellow fill for fields

const PAGE_W = 595
const PAGE_H = 842
const ML = 42
const MR = 42
const CW = PAGE_W - ML - MR

// ── Helpers ───────────────────────────────────────────────────────────────────

const MESES = ['enero','febrero','marzo','abril','mayo','junio',
               'julio','agosto','septiembre','octubre','noviembre','diciembre']

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return ''
  const dt = typeof d === 'string' ? new Date(d) : d
  return `${dt.getUTCDate().toString().padStart(2,'0')}/${(dt.getUTCMonth()+1).toString().padStart(2,'0')}/${dt.getUTCFullYear()}`
}

function formatDiasTexto(isoList: string[]): string {
  if (isoList.length === 0) return ''
  const sorted = [...isoList].sort()
  const parts = sorted.map(iso => {
    const [y, m, d] = iso.split('-').map(Number)
    return `${d} de ${MESES[m-1]} del ${y}`
  })
  if (parts.length === 1) return `01 dia (${parts[0]})`
  const last = parts.pop()!
  return `${sorted.length} dias (${parts.join(', ')} y ${last})`
}

const TIPO_VAC_LABELS: Record<string, string> = {
  REGLAMENTARIA: 'Reglamentaria',
  ATRASADA:      'Atrasada',
  ADELANTADA:    'Adelantada',
}
const TIPO_LIC_LABELS: Record<string, string> = {
  CON_GOCE:           'Con goce de haber',
  SIN_GOCE:           'Sin goce de haber',
  MOTIVOS_PERSONALES: 'Por motivos personales',
  OTROS:              'Otros',
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const sol = await prisma.solicitudVacaciones.findUnique({
    where:   { id },
    include: { usuario: { select: { nombre: true, rol: true } } },
  })
  if (!sol) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  // Only own solicitud or HR roles
  const isHR = ['ADMINISTRACION','DIRECTOR_ADMINISTRACION'].includes(session.user.rol)
  if (!isHR && session.user.id !== sol.usuarioId)
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const diasList: string[] = JSON.parse(sol.diasSolicitados)

  // ── Build PDF ──────────────────────────────────────────────────────────────
  const pdfDoc   = await PDFDocument.create()
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const page = pdfDoc.addPage([PAGE_W, PAGE_H])
  let y = PAGE_H - 50

  // ── Title ──────────────────────────────────────────────────────────────────
  page.drawText('Anexo 03.  Formato de Solicitud de Vacaciones', {
    x: ML, y, size: 11, font: fontBold, color: BLACK,
  })
  y -= 24

  // ── Header bar ────────────────────────────────────────────────────────────
  page.drawRectangle({ x: ML, y: y - 4, width: CW, height: 20, color: GREEN })
  page.drawText('FORMATO DE SOLICITUD DE VACACIONES', {
    x: ML + 10, y: y + 1, size: 10, font: fontBold, color: WHITE,
  })
  y -= 24

  // ── Table rows helper ─────────────────────────────────────────────────────
  const COL1 = 160  // width of label column
  const ROW_H = 22

  function drawRow(label: string, value: string, highlight = false, labelBold = false) {
    // border
    page.drawRectangle({
      x: ML, y: y - ROW_H + 4, width: CW, height: ROW_H,
      borderColor: rgb(0.75, 0.75, 0.75), borderWidth: 0.5,
      color: WHITE,
    })
    // label cell
    page.drawRectangle({
      x: ML, y: y - ROW_H + 4, width: COL1, height: ROW_H,
      color: rgb(0.97, 0.97, 0.97),
    })
    page.drawText(label, {
      x: ML + 5, y: y + 0, size: 8,
      font: labelBold ? fontBold : font, color: BLACK,
    })
    // vertical divider
    page.drawLine({
      start: { x: ML + COL1, y: y - ROW_H + 4 },
      end:   { x: ML + COL1, y: y + 4 },
      thickness: 0.5, color: rgb(0.75, 0.75, 0.75),
    })
    // value fill
    if (highlight) {
      page.drawRectangle({
        x: ML + COL1 + 1, y: y - ROW_H + 5, width: CW - COL1 - 2, height: ROW_H - 2,
        color: YELLOW,
      })
    }
    if (value) {
      page.drawText(value.substring(0, 75), {
        x: ML + COL1 + 8, y: y + 0, size: 8,
        font: fontBold, color: BLACK,
      })
    }
    y -= ROW_H
  }

  // ── Rows ──────────────────────────────────────────────────────────────────
  drawRow('Apellidos y nombres',  sol.usuario.nombre.toUpperCase(), true, false)
  drawRow('Cargo',                sol.cargo,                        true)
  drawRow('Departamento',         sol.departamento,                 true)
  drawRow('Jefe inmediato superior', sol.jefeInmediato,             true)
  drawRow('Directora de Calidad y Laboratorios³', 'RISCO TUTAYA GABRIELA', false)
  drawRow('Fecha de solicitud',   formatDate(sol.fechaSolicitud),   true)
  drawRow('Fecha de autorización', sol.fechaAutorizacion ? formatDate(sol.fechaAutorizacion) : '', true)
  drawRow('Fecha de aprobación',  sol.fechaAprobacion  ? formatDate(sol.fechaAprobacion)  : '', true)

  // Días solicitados (tall row)
  const DIAS_H = 28
  page.drawRectangle({ x: ML, y: y - DIAS_H + 4, width: CW, height: DIAS_H, borderColor: rgb(0.75,0.75,0.75), borderWidth: 0.5, color: WHITE })
  page.drawRectangle({ x: ML, y: y - DIAS_H + 4, width: COL1, height: DIAS_H, color: rgb(0.97,0.97,0.97) })
  page.drawLine({ start: { x: ML+COL1, y: y-DIAS_H+4 }, end: { x: ML+COL1, y: y+4 }, thickness: 0.5, color: rgb(0.75,0.75,0.75) })
  page.drawText('Día(s) solicitados', { x: ML+5, y: y+2, size: 8, font, color: BLACK })
  page.drawRectangle({ x: ML+COL1+1, y: y-DIAS_H+5, width: CW-COL1-2, height: DIAS_H-2, color: YELLOW })
  const diasText = formatDiasTexto(diasList)
  page.drawText(diasText.substring(0, 70), { x: ML+COL1+8, y: y+4, size: 8, font: fontBold, color: BLACK })
  if (diasText.length > 70) {
    page.drawText(diasText.substring(70, 140), { x: ML+COL1+8, y: y-6, size: 8, font: fontBold, color: BLACK })
  }
  y -= DIAS_H

  // ── Tipo de Vacaciones (3-option row) ─────────────────────────────────────
  const VAC_H = 54
  page.drawRectangle({ x: ML, y: y-VAC_H+4, width: CW, height: VAC_H, borderColor: rgb(0.75,0.75,0.75), borderWidth: 0.5, color: WHITE })
  page.drawRectangle({ x: ML, y: y-VAC_H+4, width: COL1, height: VAC_H, color: rgb(0.97,0.97,0.97) })
  page.drawLine({ start:{x:ML+COL1,y:y-VAC_H+4}, end:{x:ML+COL1,y:y+4}, thickness:0.5, color:rgb(0.75,0.75,0.75) })
  page.drawText('Tipo de Vacaciones', { x:ML+5, y:y-3, size:8, font, color:BLACK })

  const vacOptions = ['REGLAMENTARIA','ATRASADA','ADELANTADA']
  const optX = ML + COL1 + 10
  const optW = (CW - COL1 - 20) / 3
  vacOptions.forEach((opt, i) => {
    const ox = optX + i * optW
    const isSelected = sol.tipoVacaciones === opt
    page.drawText(TIPO_VAC_LABELS[opt], { x: ox, y: y-3, size: 8, font, color: BLACK })
    // checkbox box
    page.drawRectangle({ x: ox + optW - 18, y: y-15, width: 14, height: 14, borderColor: rgb(0.6,0.6,0.6), borderWidth: 0.8, color: isSelected ? YELLOW : WHITE })
    if (isSelected) {
      page.drawText('X', { x: ox + optW - 14, y: y-14, size: 9, font: fontBold, color: GREEN })
    }
    if (i < vacOptions.length - 1) {
      // smaller options below
      page.drawText('', { x: ox, y: y-16, size: 7, font, color: GRAY })
    }
  })
  // Second row options
  const opt2Labels = ['Atrasada','Adelantada']
  ;['ATRASADA','ADELANTADA'].forEach((opt, i) => {
    const ox = optX + (i+1) * optW
    const isSelected = sol.tipoVacaciones === opt
  })
  y -= VAC_H

  // ── Tipo de Licencia (4-option row) ───────────────────────────────────────
  const LIC_H = 66
  page.drawRectangle({ x:ML, y:y-LIC_H+4, width:CW, height:LIC_H, borderColor:rgb(0.75,0.75,0.75), borderWidth:0.5, color:WHITE })
  page.drawRectangle({ x:ML, y:y-LIC_H+4, width:COL1, height:LIC_H, color:rgb(0.97,0.97,0.97) })
  page.drawLine({ start:{x:ML+COL1,y:y-LIC_H+4}, end:{x:ML+COL1,y:y+4}, thickness:0.5, color:rgb(0.75,0.75,0.75) })
  page.drawText('Tipo de licencia', { x:ML+5, y:y-3, size:8, font, color:BLACK })

  const licOptions = ['CON_GOCE','SIN_GOCE','MOTIVOS_PERSONALES','OTROS']
  const licOptX = ML + COL1 + 10
  const licOptW = (CW - COL1 - 20) / 2
  licOptions.forEach((opt, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const ox = licOptX + col * licOptW
    const oy = y - 3 - row * 22
    const isSelected = sol.tipoLicencia === opt
    page.drawText(TIPO_LIC_LABELS[opt], { x:ox, y:oy, size:8, font, color:BLACK })
    page.drawRectangle({ x:ox+licOptW-18, y:oy-12, width:14, height:14, borderColor:rgb(0.6,0.6,0.6), borderWidth:0.8, color:isSelected ? YELLOW : WHITE })
    if (isSelected) {
      page.drawText('X', { x:ox+licOptW-14, y:oy-11, size:9, font:fontBold, color:GREEN })
    }
  })
  y -= LIC_H

  // ── Delegado + Observaciones ──────────────────────────────────────────────
  drawRow('Persona a quien se delega sus funciones', sol.personaDelegada ?? '', true)

  // Observaciones (tall)
  const OBS_H = 48
  page.drawRectangle({ x:ML, y:y-OBS_H+4, width:CW, height:OBS_H, borderColor:rgb(0.75,0.75,0.75), borderWidth:0.5, color:WHITE })
  page.drawRectangle({ x:ML, y:y-OBS_H+4, width:COL1, height:OBS_H, color:rgb(0.97,0.97,0.97) })
  page.drawLine({ start:{x:ML+COL1,y:y-OBS_H+4}, end:{x:ML+COL1,y:y+4}, thickness:0.5, color:rgb(0.75,0.75,0.75) })
  page.drawText('Observaciones', { x:ML+5, y:y, size:8, font, color:BLACK })
  const obsText = sol.observaciones ?? 'Aquí colocar los pendientes a realizar o algún dato importante que informar'
  page.drawText(obsText.substring(0, 72), { x:ML+COL1+8, y:y, size:7.5, font, color:GRAY })
  if (obsText.length > 72) {
    page.drawText(obsText.substring(72, 144), { x:ML+COL1+8, y:y-12, size:7.5, font, color:GRAY })
  }
  y -= OBS_H

  y -= 20

  // ── Firma section ─────────────────────────────────────────────────────────
  page.drawRectangle({ x:ML, y:y-16, width:CW, height:18, color:rgb(0.878, 0.929, 0.878) })
  page.drawText('Firman a manera de conformidad', { x:ML+8, y:y-11, size:9, font:fontBold, color:GREEN })
  y -= 40

  // Signature lines
  const SIG_W = (CW - 20) / 2
  const sig1X = ML
  const sig2X = ML + SIG_W + 20

  // Line 1
  page.drawLine({ start:{x:sig1X, y}, end:{x:sig1X+SIG_W, y}, thickness:0.8, color:BLACK })
  page.drawLine({ start:{x:sig2X, y}, end:{x:sig2X+SIG_W, y}, thickness:0.8, color:BLACK })
  y -= 12

  // Role labels
  page.drawText('Trabajador', { x:sig1X, y, size:8, font:fontBold, color: rgb(0.8, 0.6, 0) })
  page.drawText('Jefe Inmediato Superior', { x:sig2X, y, size:8, font:fontBold, color: rgb(0.8, 0.6, 0) })
  y -= 13

  // Names
  page.drawText(sol.usuario.nombre, { x:sig1X, y, size:8, font, color:BLACK })
  page.drawText(sol.jefeInmediato,  { x:sig2X, y, size:8, font, color:BLACK })
  y -= 12

  // Cargo under names
  page.drawText(sol.cargo, { x:sig1X, y, size:7.5, font, color:GRAY })
  y -= 20

  // ── Footnote ──────────────────────────────────────────────────────────────
  page.drawText('³ Esta también podría ser autorizada por casos excepcionales por la Dirección de Administración y Finanzas o la Gerencia General.', {
    x:ML, y:60, size:6.5, font, color:GRAY,
  })

  // ── Footer ────────────────────────────────────────────────────────────────
  page.drawRectangle({ x:0, y:0, width:PAGE_W, height:46, color:GREEN })
  page.drawText('CETOX LAB · Laboratorio de Ensayo Acreditado LE-044', { x:ML, y:30, size:7, font:fontBold, color:WHITE })
  page.drawText('Av. Angamos Este N° 2668–2670, Urb. La Calera – Surquillo · servicios@cetox.com.pe', { x:ML, y:18, size:6, font, color:rgb(0.75,0.93,0.82) })
  page.drawText('Documento generado electrónicamente por CETOX LAB ERP', { x:ML, y:8, size:5.5, font, color:rgb(0.55,0.75,0.65) })

  // ── Return ────────────────────────────────────────────────────────────────
  const bytes    = await pdfDoc.save()
  const filename = `SolicitudVacaciones-${sol.usuario.nombre.split(' ')[0]}-${new Date(sol.fechaSolicitud).getFullYear()}.pdf`

  return new NextResponse(bytes as unknown as BodyInit, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
