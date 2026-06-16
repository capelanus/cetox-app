import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const informe = await prisma.informe.findUnique({
    where: { id },
    select: { archivoPdf: true },
  })

  if (!informe?.archivoPdf) {
    return NextResponse.json({ error: 'No hay documento disponible' }, { status: 404 })
  }

  const res = await fetch(informe.archivoPdf)
  if (!res.ok) return NextResponse.json({ error: 'No se pudo obtener el archivo' }, { status: 502 })

  const buffer = await res.arrayBuffer()
  const contentType = res.headers.get('content-type') ?? 'application/pdf'

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
      // Sobreescribe X-Frame-Options:DENY y la CSP estricta del Vercel Blob
      // que impiden renderizar el PDF dentro de un <iframe> same-origin.
      'X-Frame-Options': 'SAMEORIGIN',
      'Content-Security-Policy': "frame-ancestors 'self'",
    },
  })
}
