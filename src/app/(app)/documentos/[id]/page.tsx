import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { SecureViewer } from './viewer'
import { getDepartamento } from '@/lib/calidad-constants'

export default async function DocumentoViewerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const { rol, area } = session.user

  const doc = await prisma.documentoCalidad.findUnique({
    where: { id },
    include: { accesos: { select: { departamento: true } } },
  })
  if (!doc) notFound()

  const esCalidad = rol === 'DIRECTOR_CALIDAD' || rol === 'COORDINADOR_CALIDAD' || rol === 'SUPER_ADMIN'
  if (!esCalidad) {
    const dept = getDepartamento(rol, area)
    const tieneAcceso = dept && doc.accesos.some(a => a.departamento === dept)
    if (!tieneAcceso) notFound()
  }

  const url = doc.archivoUrl.split('?')[0].toLowerCase()
  const esPdf    = url.endsWith('.pdf')
  const esImagen = /\.(png|jpe?g|gif|webp|svg)$/.test(url)

  return (
    <SecureViewer
      docId={doc.id}
      nombre={doc.nombre}
      esPdf={esPdf}
      esImagen={esImagen}
    />
  )
}
