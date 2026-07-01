import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// Mapeo de rol → departamento para control de acceso
const ROL_A_DEPARTAMENTO: Record<string, string> = {
  ADMINISTRACION:        'ADMINISTRACION',
  DIRECTOR_ADMINISTRACION: 'ADMINISTRACION',
  GERENTE_TECNICO:       'LABORATORIO',
  ANALISTA:              'LABORATORIO',
  GERENTE_GENERAL:       'LABORATORIO',
  JEFE_OPERACIONES:      'OPERACIONES',
  ASISTENTE_LOGISTICA:   'OPERACIONES',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const rol = session.user.rol

  const doc = await prisma.documentoCalidad.findUnique({
    where: { id },
    include: { accesos: { select: { departamento: true } } },
  })
  if (!doc) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  // Calidad siempre tiene acceso
  const esCalidad = rol === 'DIRECTOR_CALIDAD' || rol === 'COORDINADOR_CALIDAD' || rol === 'SUPER_ADMIN'

  if (!esCalidad) {
    const dept = ROL_A_DEPARTAMENTO[rol]
    const tieneAcceso = dept && doc.accesos.some(a => a.departamento === dept)
    if (!tieneAcceso) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
  }

  // Proxy del archivo — no exponemos la URL de Vercel Blob al cliente
  const upstream = await fetch(doc.archivoUrl)
  if (!upstream.ok) return NextResponse.json({ error: 'Archivo no disponible' }, { status: 502 })

  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
  const body = await upstream.arrayBuffer()

  return new NextResponse(body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
      // Dificultar descarga / impresión en el navegador
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    },
  })
}
