import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { formatFecha, formatMoneda, formatNumSET } from '@/lib/format'
import {
  crearMembrete, GREEN, BLACK, GRAY, LIGHT_GRAY, WHITE, ML, MR, CW, PAGE_W,
} from '@/lib/pdf-membrete'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const set = await prisma.sET.findUnique({
    where: { id },
    include: {
      cliente: true,
      cotizacion: true,
      creadoPor: true,
      odas: { include: { items: { include: { ensayo: true } } }, orderBy: { numero: 'asc' } },
    },
  })
  if (!set) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const moneda = (set.cotizacion?.moneda ?? 'USD') as 'USD' | 'PEN'
  const odas = set.odas
  const numSET = formatNumSET(set.numero, set.anio)

  const doc = await crearMembrete('SOLICITUD DE ENSAYO TOXICOLÓGICO', numSET)
  const { font, fontBold } = doc

  // ── Cliente ──────────────────────────────────────────────────────────────────
  await doc.section('DATOS DEL CLIENTE')
  doc.field('Razón social', set.cliente.razonSocial)
  doc.field('RUC', set.cliente.ruc)
  doc.field('Dirección', set.cliente.direccion)
  doc.field('Contacto', set.cotizacion?.contactoNombre)
  doc.field('Email', set.cotizacion?.contactoEmail)
  doc.field('Teléfono', set.cotizacion?.contactoTelefono)
  doc.field('Fecha de ingreso', formatFecha(set.fechaIngreso))
  doc.field('Código de muestra', set.codigoMuestra)
  doc.field('Registrado por', set.creadoPor.nombre)
  doc.y -= 4

  // ── Muestra ──────────────────────────────────────────────────────────────────
  await doc.section('DATOS DE LA MUESTRA')
  doc.field('Nombre comercial', set.nombreComercial)
  doc.field('Tipo de muestra', set.tipoMuestra)
  doc.field('Ingrediente activo', set.ingredienteActivo)
  doc.field('Formulación', set.formulacion)
  doc.field('N° de lote', set.numeroLote)
  doc.field('Peso / Volumen', set.pesoVolumen)
  doc.field('Fecha de fabricación', set.fechaFabricacion ? formatFecha(set.fechaFabricacion) : null)
  doc.field('Fecha de vencimiento', set.fechaVencimiento ? formatFecha(set.fechaVencimiento) : null)
  doc.field('Ingreso de muestra', set.ingresoMuestra === 'Otro' ? `Otro: ${set.ingresoMuestraOtro ?? ''}` : set.ingresoMuestra)
  doc.field('N° de muestras', set.numeroMuestras)
  doc.field('Devolución de sobrante', set.devolucionMuestra)
  doc.field('Condiciones ambientales', set.condicionesAmbientales)
  doc.field('Procedencia', set.procedenciaDescripcion)
  doc.y -= 4

  // ── Ensayos (ODAs) ────────────────────────────────────────────────────────────
  const COL_ENSAYO = ML + 55, COL_AREA = 315, COL_FECHA = 372, COL_COSTO = PAGE_W - MR - 62
  await doc.section(`ENSAYOS SOLICITADOS (${odas.length})`)

  if (odas.length === 0) {
    doc.page.drawText('No hay ensayos asociados a este SET.', { x: ML, y: doc.y, size: 9, font, color: GRAY })
    doc.y -= 14
  } else {
    await doc.ensureSpace(24)
    doc.page.drawRectangle({ x: ML, y: doc.y - 4, width: CW, height: 16, color: GREEN })
    doc.page.drawText('ODA', { x: ML + 4, y: doc.y, size: 8, font: fontBold, color: WHITE })
    doc.page.drawText('Ensayo', { x: COL_ENSAYO, y: doc.y, size: 8, font: fontBold, color: WHITE })
    doc.page.drawText('Área', { x: COL_AREA, y: doc.y, size: 8, font: fontBold, color: WHITE })
    doc.page.drawText('Entrega', { x: COL_FECHA, y: doc.y, size: 8, font: fontBold, color: WHITE })
    doc.page.drawText('Costo', { x: COL_COSTO, y: doc.y, size: 8, font: fontBold, color: WHITE })
    doc.y -= 16

    let subtotal = 0
    let idx = 0
    for (const oda of odas) {
      const ensayoNombre = oda.items.map(i => i.ensayo.nombre).join(', ')
      const costo = oda.items.reduce((s, i) => s + i.costo, 0)
      subtotal += costo
      await doc.ensureSpace(16)
      if (idx % 2 === 1) doc.page.drawRectangle({ x: ML, y: doc.y - 4, width: CW, height: 14, color: LIGHT_GRAY })
      doc.page.drawText(String(oda.numero).padStart(5, '0'), { x: ML + 4, y: doc.y, size: 8, font: fontBold, color: BLACK })
      doc.page.drawText(ensayoNombre.substring(0, 44), { x: COL_ENSAYO, y: doc.y, size: 8, font, color: BLACK })
      doc.page.drawText(oda.area, { x: COL_AREA, y: doc.y, size: 8, font, color: GRAY })
      doc.page.drawText(formatFecha(oda.fechaEntregaCompromiso), { x: COL_FECHA, y: doc.y, size: 7.5, font, color: BLACK })
      doc.page.drawText(formatMoneda(costo, moneda), { x: COL_COSTO, y: doc.y, size: 8, font, color: BLACK })
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
  }

  // ── Condiciones de entrega ─────────────────────────────────────────────────────
  await doc.section('ENTREGA DE INFORMES EN OFICINA CETOX')
  const cond = [
    'Hora de entrega: a partir de las 3:00 pm del día indicado.',
    'Lima/Callao: se recoge en la oficina de CETOX.',
    'Provincia/Exterior: envío por courier vía collect o previa cancelación del envío por el cliente.',
  ]
  for (const line of cond) {
    await doc.ensureSpace(14)
    doc.page.drawText(line.substring(0, 100), { x: ML, y: doc.y, size: 8, font, color: BLACK })
    doc.y -= 12
  }
  doc.y -= 4
  const importante = [
    'IMPORTANTE: Corrobore todos los datos. Al firmar este documento da conformidad de TODOS los datos de la',
    'empresa y de la muestra indicados en el SET, y declara conocer las condiciones contractuales.',
  ]
  for (const line of importante) {
    await doc.ensureSpace(14)
    doc.page.drawText(line.substring(0, 105), { x: ML, y: doc.y, size: 8, font: fontBold, color: BLACK })
    doc.y -= 12
  }

  // ── Firmas ─────────────────────────────────────────────────────────────────────
  await doc.ensureSpace(70)
  doc.y -= 26
  const sigY = doc.y, sig1X = ML + 18, sig2X = PAGE_W - MR - 195
  doc.page.drawLine({ start: { x: sig1X, y: sigY }, end: { x: sig1X + 160, y: sigY }, thickness: 0.75, color: BLACK })
  doc.page.drawLine({ start: { x: sig2X, y: sigY }, end: { x: sig2X + 180, y: sigY }, thickness: 0.75, color: BLACK })
  doc.page.drawText('Cliente', { x: sig1X + 60, y: sigY - 13, size: 8, font: fontBold, color: GRAY })
  doc.page.drawText('Centro Toxicológico S.A.C. "CETOX"', { x: sig2X + 12, y: sigY - 13, size: 8, font: fontBold, color: GRAY })

  return doc.finish(`SET-${numSET}.pdf`, 'attachment') as unknown as NextResponse
}
