import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getDepartamento } from '@/lib/calidad-constants'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const { rol, area } = session.user

  const doc = await prisma.documentoCalidad.findUnique({
    where: { id },
    include: { accesos: { select: { departamento: true } } },
  })
  if (!doc) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const esCalidad = rol === 'DIRECTOR_CALIDAD' || rol === 'COORDINADOR_CALIDAD' || rol === 'SUPER_ADMIN'

  if (!esCalidad) {
    const dept = getDepartamento(rol, area)
    const tieneAcceso = dept && doc.accesos.some(a => a.departamento === dept)
    if (!tieneAcceso) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
  }

  const upstream = await fetch(doc.archivoUrl)
  if (!upstream.ok) return NextResponse.json({ error: 'Archivo no disponible' }, { status: 502 })

  // Detect content-type from URL extension when upstream returns a generic type
  const ext = doc.archivoUrl.split('?')[0].split('.').pop()?.toLowerCase() ?? ''
  const MIME: Record<string, string> = {
    pdf:  'application/pdf',
    png:  'image/png',
    jpg:  'image/jpeg',
    jpeg: 'image/jpeg',
    gif:  'image/gif',
    webp: 'image/webp',
    svg:  'image/svg+xml',
  }
  const upstreamType = upstream.headers.get('content-type') ?? ''
  const contentType =
    (upstreamType && upstreamType !== 'application/octet-stream')
      ? upstreamType
      : (MIME[ext] ?? 'application/octet-stream')

  const body = await upstream.arrayBuffer()

  return new NextResponse(body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
      'X-Frame-Options': 'SAMEORIGIN',
    },
  })
}
