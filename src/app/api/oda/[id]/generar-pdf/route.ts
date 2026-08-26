import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { formatFecha, formatNumODA, formatNumSET } from '@/lib/format'
import { rgb } from 'pdf-lib'
import {
  crearMembrete, GREEN, BLACK, GRAY, LIGHT_GRAY, WHITE, ML, MR, CW, PAGE_W,
} from '@/lib/pdf-membrete'

const AREA_LABELS: Record<string, string> = { Q: 'Química', B: 'Biología', M: 'Microbiología' }

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

  // ── Datos de la ODA (mismos campos que el formato físico) ────────────────────
  const otraIndicacion = ({ Q: set.otraIndicacionQ, B: set.otraIndicacionB, M: set.otraIndicacionM } as Record<string, string | null>)[oda.area] ?? set.otraIndicacion

  await doc.section('DATOS DE LA ORDEN')
  doc.field('SET N°', formatNumSET(set.numero, set.anio))
  doc.field('Fecha de recepción', oda.fechaRecepcion ? formatFecha(oda.fechaRecepcion) : formatFecha(set.fechaIngreso))
  doc.field('Tipo de muestra', set.tipoMuestra)
  doc.field('Ingrediente activo', set.ingredienteActivo)
  doc.field('Formulación', set.formulacion)
  doc.field('Edad del paciente', oda.edadPaciente)
  doc.field('Condiciones ambientales', set.condicionesAmbientales)
  doc.field('Número de muestras', set.numeroMuestras)
  doc.field('Peso o volumen de muestra', set.pesoVolumen)
  doc.field('Código de la muestra', set.codigoMuestra)
  doc.field('Otra indicación', otraIndicacion)
  doc.y -= 4

  // ── Ensayos ──────────────────────────────────────────────────────────────────
  const COL_TIEMPO = PAGE_W - MR - 170, COL_FECHA = PAGE_W - MR - 90
  await doc.section(`ENSAYOS (${oda.items.length})`)

  await doc.ensureSpace(24)
  doc.page.drawRectangle({ x: ML, y: doc.y - 4, width: CW, height: 16, color: GREEN })
  doc.page.drawText('Tipo de ensayo', { x: ML + 4, y: doc.y, size: 8, font: fontBold, color: WHITE })
  doc.page.drawText('Plazo', { x: COL_TIEMPO, y: doc.y, size: 8, font: fontBold, color: WHITE })
  doc.page.drawText('Fecha de entrega', { x: COL_FECHA, y: doc.y, size: 8, font: fontBold, color: WHITE })
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
  doc.y -= 8

  // ── Observaciones ──────────────────────────────────────────────────────────────
  if (set.observaciones) {
    await doc.section('OBSERVACIONES')
    const lineas = wrapText(set.observaciones, CW - 8, 8.5)
    for (const ln of lineas) {
      await doc.ensureSpace(13)
      doc.page.drawText(ln, { x: ML + 2, y: doc.y, size: 8.5, font, color: BLACK })
      doc.y -= 12
    }
    doc.y -= 4
  }

  // ── Conformidad de la recepción de la muestra ─────────────────────────────────
  await doc.ensureSpace(30)
  doc.page.drawText('Conformidad de la recepción de la muestra:', { x: ML, y: doc.y, size: 8.5, font: fontBold, color: GRAY })
  const confLabelW = fontBold.widthOfTextAtSize('Conformidad de la recepción de la muestra:', 8.5)
  doc.page.drawLine({ start: { x: ML + confLabelW + 8, y: doc.y - 2 }, end: { x: PAGE_W - MR - 110, y: doc.y - 2 }, thickness: 0.6, color: BLACK })
  doc.page.drawText('Fecha:', { x: PAGE_W - MR - 95, y: doc.y, size: 8.5, font: fontBold, color: GRAY })
  const fechaLabelW = fontBold.widthOfTextAtSize('Fecha:', 8.5)
  doc.page.drawLine({ start: { x: PAGE_W - MR - 95 + fechaLabelW + 4, y: doc.y - 2 }, end: { x: PAGE_W - MR, y: doc.y - 2 }, thickness: 0.6, color: BLACK })
  doc.y -= 16

  return doc.finish(`ODA-${numODA}.pdf`, 'attachment') as unknown as NextResponse
}
