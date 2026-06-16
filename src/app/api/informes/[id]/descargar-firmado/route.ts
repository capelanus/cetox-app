'use server'
/**
 * GET /api/informes/[id]/descargar-firmado
 *
 * Estampa el QR de firma digital en TODAS las páginas del PDF subido
 * y lo devuelve para descarga.
 */
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { stampQrOnPdf } from '@/lib/stamp-qr'
import { formatNumInforme } from '@/lib/format'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.rol === 'ANALISTA') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params

  const informe = await prisma.informe.findUnique({
    where:   { id },
    include: { certificadoQR: true },
  })

  if (!informe) return NextResponse.json({ error: 'Informe no encontrado' }, { status: 404 })
  if (!informe.archivoPdf) return NextResponse.json({ error: 'No hay documento subido' }, { status: 404 })
  if (!informe.certificadoQR) return NextResponse.json({ error: 'El informe aún no está certificado' }, { status: 400 })

  const cert   = informe.certificadoQR
  const stamped = await stampQrOnPdf(informe.archivoPdf, cert.qrUrl, cert.clave)

  const numStr   = formatNumInforme(informe.prefijo, informe.numero, informe.anio)
  const filename = `InformeFirmado-${numStr}.pdf`

  return new NextResponse(stamped as unknown as BodyInit, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
