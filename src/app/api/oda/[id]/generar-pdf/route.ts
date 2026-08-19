import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { formatFecha, formatMoneda, formatNumODA, formatNumSET } from '@/lib/format'
import {
  crearMembrete, GREEN, BLACK, GRAY, LIGHT_GRAY, WHITE, ML, MR, CW, PAGE_W,
} from '@/lib/pdf-membrete'

const AREA_LABELS: Record<string, string> = { Q: 'Química', B: 'Biología', M: 'Microbiología' }
const ESTADO_LABELS: Record<string, string> = {
  EMITIDA: 'Emitida', RECIBIDA: 'Recibida', EN_EJECUCION: 'En ejecución',
  CON_RESULTADO: 'Con resultado', INFORME_EMITIDO: 'Informe emitido', ANULADO: 'Anulado',
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
      set: { include: { cliente: true, cotizacion: true } },
    },
  })
  if (!oda) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  const set = oda.set
  const cliente = set.cliente
  const moneda = (set.cotizacion?.moneda ?? 'USD') as 'USD' | 'PEN'
  const numODA = formatNumODA(oda.numero, oda.anio)

  const doc = await crearMembrete('ORDEN DE ANÁLISIS (ODA)', numODA, { plantilla: 'letterhead-cotizacion.pdf' })
  const { font, fontBold } = doc

  // ── Cliente ──────────────────────────────────────────────────────────────────
  await doc.section('DATOS DEL CLIENTE')
  doc.field('Razón social', cliente.razonSocial)
  doc.field('RUC', cliente.ruc)
  doc.field('Dirección', cliente.direccion)
  doc.y -= 4

  // ── Datos de la ODA ────────────────────────────────────────────────────────────
  await doc.section('DATOS DE LA ORDEN')
  doc.field('SET asociado', formatNumSET(set.numero, set.anio))
  doc.field('Área', AREA_LABELS[oda.area] ?? oda.area)
  doc.field('Estado', ESTADO_LABELS[oda.estado] ?? oda.estado)
  doc.field('Código de muestra', set.codigoMuestra)
  doc.field('Nombre comercial', set.nombreComercial)
  doc.field('Fecha de recepción', oda.fechaRecepcion ? formatFecha(oda.fechaRecepcion) : formatFecha(set.fechaIngreso))
  doc.field('Inicio de ejecución', oda.fechaInicioEjecucion ? formatFecha(oda.fechaInicioEjecucion) : '—')
  doc.field('Fecha de entrega comprometida', formatFecha(oda.fechaEntregaCompromiso))
  doc.field('Edad del paciente', oda.edadPaciente)
  doc.y -= 4

  // ── Ensayos ──────────────────────────────────────────────────────────────────
  const COL_TIEMPO = 330, COL_FECHA = 400, COL_COSTO = PAGE_W - MR - 62
  await doc.section(`ENSAYOS (${oda.items.length})`)

  await doc.ensureSpace(24)
  doc.page.drawRectangle({ x: ML, y: doc.y - 4, width: CW, height: 16, color: GREEN })
  doc.page.drawText('Ensayo', { x: ML + 4, y: doc.y, size: 8, font: fontBold, color: WHITE })
  doc.page.drawText('Plazo', { x: COL_TIEMPO, y: doc.y, size: 8, font: fontBold, color: WHITE })
  doc.page.drawText('Entrega', { x: COL_FECHA, y: doc.y, size: 8, font: fontBold, color: WHITE })
  doc.page.drawText('Costo', { x: COL_COSTO, y: doc.y, size: 8, font: fontBold, color: WHITE })
  doc.y -= 16

  let subtotal = 0
  let idx = 0
  for (const it of oda.items) {
    subtotal += it.costo
    await doc.ensureSpace(16)
    if (idx % 2 === 1) doc.page.drawRectangle({ x: ML, y: doc.y - 4, width: CW, height: 14, color: LIGHT_GRAY })
    doc.page.drawText(it.ensayo.nombre.substring(0, 60), { x: ML + 4, y: doc.y, size: 8, font, color: BLACK })
    doc.page.drawText(`${it.tiempoEntregaDias} días`, { x: COL_TIEMPO, y: doc.y, size: 8, font, color: BLACK })
    doc.page.drawText(formatFecha(it.fechaEntregaCompromiso), { x: COL_FECHA, y: doc.y, size: 7.5, font, color: BLACK })
    doc.page.drawText(formatMoneda(it.costo, moneda), { x: COL_COSTO, y: doc.y, size: 8, font, color: BLACK })
    doc.y -= 14
    idx++
  }

  // Totales
  await doc.ensureSpace(56)
  doc.hr()
  const igv = subtotal * 0.18, total = subtotal + igv
  const totLabelX = PAGE_W - MR - 150
  for (const [label, val] of [['Subtotal', subtotal], ['IGV (18%)', igv]] as [string, number][]) {
    doc.page.drawText(label, { x: totLabelX, y: doc.y, size: 9, font, color: GRAY })
    doc.page.drawText(formatMoneda(val, moneda), { x: COL_COSTO, y: doc.y, size: 9, font, color: BLACK })
    doc.y -= 13
  }
  doc.page.drawText('TOTAL', { x: totLabelX, y: doc.y, size: 10, font: fontBold, color: GREEN })
  doc.page.drawText(formatMoneda(total, moneda), { x: COL_COSTO, y: doc.y, size: 10, font: fontBold, color: GREEN })
  doc.y -= 16

  // ── Firmas ─────────────────────────────────────────────────────────────────────
  await doc.ensureSpace(70)
  doc.y -= 26
  const sigY = doc.y, sig1X = ML + 18, sig2X = PAGE_W - MR - 195
  doc.page.drawLine({ start: { x: sig1X, y: sigY }, end: { x: sig1X + 160, y: sigY }, thickness: 0.75, color: BLACK })
  doc.page.drawLine({ start: { x: sig2X, y: sigY }, end: { x: sig2X + 180, y: sigY }, thickness: 0.75, color: BLACK })
  doc.page.drawText('Analista responsable', { x: sig1X + 30, y: sigY - 13, size: 8, font: fontBold, color: GRAY })
  doc.page.drawText('Centro Toxicológico S.A.C. "CETOX"', { x: sig2X + 12, y: sigY - 13, size: 8, font: fontBold, color: GRAY })

  return doc.finish(`ODA-${numODA}.pdf`, 'attachment') as unknown as NextResponse
}
