import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const { codigo } = await params
  const clave = req.nextUrl.searchParams.get('clave')

  if (!clave) {
    return NextResponse.json({ valid: false, error: 'Clave requerida' }, { status: 400 })
  }

  const cert = await prisma.certificado.findUnique({
    where: { codigo },
    include: {
      informe: {
        include: {
          oda: { include: { items: { include: { ensayo: true } }, set: { include: { cliente: true } } } },
        },
      },
    },
  })

  if (!cert || cert.clave !== clave) {
    return NextResponse.json({ valid: false })
  }

  return NextResponse.json({
    valid: true,
    informe: {
      numero: cert.informe.numero,
      anio: cert.informe.anio,
      prefijo: cert.informe.prefijo,
      ensayo: cert.informe.oda.items.map((i) => i.ensayo.nombre).join(', '),
      cliente: cert.informe.oda.set.cliente.razonSocial,
      firmaGerencia: cert.informe.firmaGerencia?.toISOString() ?? '',
      pdfUrl: cert.informe.archivoPdf ? `/${cert.informe.archivoPdf}` : null,
    },
  })
}
