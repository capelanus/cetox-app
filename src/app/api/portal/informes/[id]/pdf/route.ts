import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getPortalSession } from '@/lib/portal-auth'
import { stampQrOnPdf } from '@/lib/stamp-qr'
import { formatNumInforme } from '@/lib/format'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getPortalSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const informe = await prisma.informe.findUnique({
    where: { id },
    include: { certificadoQR: true, oda: { include: { set: true } } },
  })

  if (!informe) return NextResponse.json({ error: 'Informe no encontrado' }, { status: 404 })
  if (informe.oda.set.clienteId !== session.clienteId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  if (!informe.archivoPdf) return NextResponse.json({ error: 'No hay documento disponible' }, { status: 404 })
  if (!informe.certificadoQR) return NextResponse.json({ error: 'El informe aún no está certificado' }, { status: 400 })

  const cert = informe.certificadoQR
  const stamped = await stampQrOnPdf(informe.archivoPdf, cert.qrUrl, cert.clave)

  const numStr = formatNumInforme(informe.prefijo, informe.numero, informe.anio)
  const filename = `Informe-${numStr}.pdf`

  return new NextResponse(stamped as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
