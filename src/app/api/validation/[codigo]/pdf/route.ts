/**
 * GET /api/validation/[codigo]/pdf?clave=<clave>&download=1
 *
 * Endpoint público para visualizar/descargar el informe firmado
 * original (con QR estampado en todas las páginas) tras validar la clave.
 */
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { stampQrOnPdf } from '@/lib/stamp-qr'
import { formatNumInforme } from '@/lib/format'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const { codigo } = await params
  const clave    = req.nextUrl.searchParams.get('clave')
  const download = req.nextUrl.searchParams.get('download') === '1'

  if (!clave) {
    return NextResponse.json({ error: 'Clave requerida' }, { status: 400 })
  }

  const cert = await prisma.certificado.findUnique({
    where:   { codigo },
    include: { informe: true },
  })

  if (!cert || cert.clave !== clave) {
    return NextResponse.json({ error: 'Certificado no válido' }, { status: 403 })
  }

  const informe = cert.informe
  if (!informe.archivoPdf) {
    return NextResponse.json({ error: 'Documento no disponible' }, { status: 404 })
  }

  const stamped  = await stampQrOnPdf(informe.archivoPdf, cert.qrUrl, cert.clave)
  const numStr   = formatNumInforme(informe.prefijo, informe.numero, informe.anio)
  const filename = `InformeFirmado-${numStr}.pdf`

  return new NextResponse(stamped as unknown as BodyInit, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${filename}"`,
      'Cache-Control':       'no-store',
    },
  })
}
