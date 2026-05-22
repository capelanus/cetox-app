import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { formatFecha } from '@/lib/format'

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
  const firstItem = informe.oda.items[0]
  const cliente = set.cliente

  // Find template
  const templatesDir = path.resolve(process.cwd(), '..', 'templates')
  const templateFile = firstItem?.ensayo.plantillaWord ?? 'PLANTILLA PQ.docx'
  let templatePath = path.join(templatesDir, templateFile)
  if (!existsSync(templatePath)) {
    templatePath = path.join(templatesDir, 'PLANTILLA PQ.docx')
  }

  let docxBuffer: Buffer
  try {
    const content = readFileSync(templatePath, 'binary')
    const zip = new PizZip(content)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{', end: '}' },
    })

    doc.render({
      cliente: cliente.razonSocial,
      ruc: cliente.ruc,
      direccion: cliente.direccion,
      nombreComercial: set.nombreComercial,
      ingredienteActivo: set.ingredienteActivo ?? '',
      lote: set.numeroLote ?? '',
      fechaFabricacion: set.fechaFabricacion ? formatFecha(set.fechaFabricacion) : '',
      fechaVencimiento: set.fechaVencimiento ? formatFecha(set.fechaVencimiento) : '',
      codigoInterno: set.codigoMuestra,
      fechaRecepcion: formatFecha(set.fechaIngreso),
      fechaEmision: formatFecha(new Date()),
      resultado: informe.resultadoTexto ?? '',
      analista: informe.analista.nombre,
      calidad: informe.firmaCalidad ? 'Dra. Gabriela Risco' : '',
      gerencia: informe.firmaGerencia ? 'Dra. Rosalía Anaya' : '',
      qrCode: '',
    })

    docxBuffer = doc.getZip().generate({ type: 'nodebuffer' })
  } catch {
    // If template has no placeholders, serve template as-is
    docxBuffer = readFileSync(templatePath)
  }

  const filename = `${informe.prefijo}-${informe.numero}-${informe.anio}.docx`

  return new NextResponse(docxBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
