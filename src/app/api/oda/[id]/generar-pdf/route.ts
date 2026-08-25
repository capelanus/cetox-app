import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { formatFecha, formatNumODA, formatNumSET } from '@/lib/format'
import { rgb } from 'pdf-lib'
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
      set: true,
    },
  })
  if (!oda) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  const set = oda.set
  const numODA = formatNumODA(oda.numero, oda.anio)

  const doc = await crearMembrete('ORDEN DE ANÁLISIS (ODA)', numODA, { plantilla: 'letterhead-cotizacion.pdf' })
  const { font, fontBold } = doc

  // ── Área (destacada, para identificación rápida en el laboratorio) ───────────
  // Nota: el ODA es un documento de trabajo para el laboratorio; no debe exponer
  // el cliente, el nombre comercial de la muestra ni los costos de los ensayos.
  const AREA_COLOR: Record<string, ReturnType<typeof rgb>> = {
    Q: rgb(0.11, 0.35, 0.75),
    B: GREEN,
    M: rgb(0.62, 0.36, 0.06),
  }
  const areaColor = AREA_COLOR[oda.area] ?? GREEN
  const areaLabel = (AREA_LABELS[oda.area] ?? oda.area).toUpperCase()
  await doc.ensureSpace(30)
  doc.page.drawRectangle({ x: ML, y: doc.y - 8, width: CW, height: 24, color: areaColor })
  doc.page.drawText(`ÁREA: ${areaLabel}`, { x: ML + 8, y: doc.y - 1, size: 12, font: fontBold, color: WHITE })
  doc.y -= 32

  // ── Datos de la ODA ────────────────────────────────────────────────────────────
  await doc.section('DATOS DE LA ORDEN')
  doc.field('SET asociado', formatNumSET(set.numero, set.anio))
  doc.field('Estado', ESTADO_LABELS[oda.estado] ?? oda.estado)
  doc.field('Código de muestra', set.codigoMuestra)
  doc.field('Fecha de recepción', oda.fechaRecepcion ? formatFecha(oda.fechaRecepcion) : formatFecha(set.fechaIngreso))
  doc.field('Inicio de ejecución', oda.fechaInicioEjecucion ? formatFecha(oda.fechaInicioEjecucion) : '—')
  doc.field('Edad del paciente', oda.edadPaciente)
  doc.y -= 4

  // ── Ensayos ──────────────────────────────────────────────────────────────────
  const COL_TIEMPO = PAGE_W - MR - 170, COL_FECHA = PAGE_W - MR - 90
  await doc.section(`ENSAYOS (${oda.items.length})`)

  await doc.ensureSpace(24)
  doc.page.drawRectangle({ x: ML, y: doc.y - 4, width: CW, height: 16, color: GREEN })
  doc.page.drawText('Ensayo', { x: ML + 4, y: doc.y, size: 8, font: fontBold, color: WHITE })
  doc.page.drawText('Plazo', { x: COL_TIEMPO, y: doc.y, size: 8, font: fontBold, color: WHITE })
  doc.page.drawText('Entrega', { x: COL_FECHA, y: doc.y, size: 8, font: fontBold, color: WHITE })
  doc.y -= 16

  let idx = 0
  for (const it of oda.items) {
    await doc.ensureSpace(16)
    if (idx % 2 === 1) doc.page.drawRectangle({ x: ML, y: doc.y - 4, width: CW, height: 14, color: LIGHT_GRAY })
    doc.page.drawText(it.ensayo.nombre.substring(0, 80), { x: ML + 4, y: doc.y, size: 8, font, color: BLACK })
    doc.page.drawText(`${it.tiempoEntregaDias} días`, { x: COL_TIEMPO, y: doc.y, size: 8, font, color: BLACK })
    doc.page.drawText(formatFecha(it.fechaEntregaCompromiso), { x: COL_FECHA, y: doc.y, size: 7.5, font, color: BLACK })
    doc.y -= 14
    idx++
  }
  doc.y -= 12

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
