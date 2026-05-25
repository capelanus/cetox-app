import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { formatFecha } from '@/lib/format'
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType,
} from 'docx'

function bold(text: string) {
  return new TextRun({ text, bold: true })
}

function field(label: string, value: string | null | undefined) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun({ text: value ?? '' }),
    ],
    spacing: { after: 100 },
  })
}

function sectionTitle(num: string, title: string) {
  return new Paragraph({
    children: [new TextRun({ text: `${num}. ${title.toUpperCase()}`, bold: true, size: 24 })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1F4E79' } },
  })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const informe = await prisma.informe.findUnique({
    where: { id },
    include: {
      analista: true,
      oda: {
        include: {
          items: { include: { ensayo: true } },
          set: { include: { cliente: true } },
        },
      },
    },
  })
  if (!informe) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const set = informe.oda.set
  const cliente = set.cliente
  const ensayos = informe.oda.items.map((i) => i.ensayo.nombre).join(', ')
  const descripcionEnvase = [set.tipoEnvase, set.materialEnvase, set.etiquetaEnvase, set.seguridadEnvase]
    .filter(Boolean).join(', ')

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Arial', size: 22 },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1080, bottom: 1080, left: 1260, right: 1260 },
        },
      },
      children: [
        // ── Título principal ──────────────────────────────────────────────
        new Paragraph({
          children: [bold('INFORME DE ENSAYO')],
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Centro Toxicológico S.A.C. — CETOX — LE-044', color: '1F4E79' }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        // ── 1. Solicitante ────────────────────────────────────────────────
        sectionTitle('1', 'Solicitante'),
        field('Solicitante', cliente.razonSocial),
        field('Dirección', cliente.direccion),

        // ── 2. Identificación de la muestra ───────────────────────────────
        sectionTitle('2', 'Identificación de la muestra'),
        field('Nombre comercial', set.nombreComercial),
        field('Ingrediente activo', set.ingredienteActivo),
        field('Formulación', set.formulacion),
        field('Número de lote', set.numeroLote),
        field('Fecha de fabricación', set.fechaFabricacion ? formatFecha(set.fechaFabricacion) : null),
        field('Fecha de vencimiento', set.fechaVencimiento ? formatFecha(set.fechaVencimiento) : null),

        // ── 3. Muestra ────────────────────────────────────────────────────
        sectionTitle('3', 'Muestra'),
        field('Descripción del envase', descripcionEnvase || null),
        field('Fecha de recepción', formatFecha(set.fechaIngreso)),
        field('Análisis solicitado', ensayos),
        new Paragraph({
          children: [
            new TextRun({ text: 'Ejecución del ensayo: ', bold: true }),
            new TextRun({ text: `Inicio: ${informe.oda.fechaInicioEjecucion ? formatFecha(informe.oda.fechaInicioEjecucion) : '______________________'}   Fin: ${informe.fechaEnvioResultados ? formatFecha(informe.fechaEnvioResultados) : '______________________'}` }),
          ],
          spacing: { after: 100 },
        }),
        field('Código interno', set.codigoMuestra),
        new Paragraph({
          children: [
            new TextRun({ text: 'Periodo de custodia: ', bold: true }),
            new TextRun({ text: '___________________________________' }),
          ],
          spacing: { after: 100 },
        }),
        field('Fecha de emisión', formatFecha(new Date())),

        // ── Espacio para resultados ───────────────────────────────────────
        new Paragraph({ text: '', spacing: { after: 300 } }),
        new Paragraph({
          children: [bold('RESULTADOS')],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 120 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1F4E79' } },
        }),
        new Paragraph({
          children: [new TextRun({ text: informe.resultadoTexto ?? '(completar con los resultados del ensayo)', color: informe.resultadoTexto ? '000000' : '888888', italics: !informe.resultadoTexto })],
          spacing: { after: 200 },
        }),

        // ── Firmas ────────────────────────────────────────────────────────
        new Paragraph({ text: '', spacing: { before: 600 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
            insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 45, type: WidthType.PERCENTAGE },
                  borders: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' }, top: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  children: [new Paragraph({ text: '' })],
                }),
                new TableCell({
                  width: { size: 10, type: WidthType.PERCENTAGE },
                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  children: [new Paragraph({ text: '' })],
                }),
                new TableCell({
                  width: { size: 45, type: WidthType.PERCENTAGE },
                  borders: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' }, top: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  children: [new Paragraph({ text: '' })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  children: [new Paragraph({ children: [bold('Analista responsable')], alignment: AlignmentType.CENTER, spacing: { before: 80 } })],
                }),
                new TableCell({
                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  children: [new Paragraph({ text: '' })],
                }),
                new TableCell({
                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  children: [new Paragraph({ children: [bold('Centro Toxicológico S.A.C. "CETOX"')], alignment: AlignmentType.CENTER, spacing: { before: 80 } })],
                }),
              ],
            }),
          ],
        }),
      ],
    }],
  })

  const buffer = await Packer.toBuffer(doc)
  const filename = `InformeEnsayo-${set.codigoMuestra}.docx`

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
