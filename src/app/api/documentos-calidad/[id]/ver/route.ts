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

  // Redirect directly to the Vercel Blob URL — avoids server-side proxy fetch issues.
  // The URL is public but unguessable; access control is enforced above.
  return NextResponse.redirect(doc.archivoUrl)
}
