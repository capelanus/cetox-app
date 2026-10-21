import { requireRol, ROLES_SOLICITUDES_WEB } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { SolicitudesWebViewer } from './solicitudes-web-viewer'

export const dynamic = 'force-dynamic'

export default async function SolicitudesWebPage() {
  await requireRol(ROLES_SOLICITUDES_WEB)

  const solicitudes = await prisma.solicitudWeb.findMany({
    orderBy: { createdAt: 'desc' },
    take: 300,
  })

  return (
    <SolicitudesWebViewer
      solicitudes={solicitudes.map(s => ({ ...s, createdAt: s.createdAt.toISOString(), fechaAtencion: s.fechaAtencion?.toISOString() ?? null }))}
    />
  )
}
