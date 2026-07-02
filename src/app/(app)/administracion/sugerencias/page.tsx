import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { SugerenciasViewer } from './sugerencias-viewer'

const ROLES_PERMITIDOS = [
  'SUPER_ADMIN', 'ADMINISTRACION', 'DIRECTOR_ADMINISTRACION',
  'DIRECTOR_CALIDAD', 'COORDINADOR_CALIDAD',
]

export default async function AdminSugerenciasPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (!ROLES_PERMITIDOS.includes(session.user.rol)) redirect('/dashboard')

  const sugerencias = await prisma.sugerenciaCliente.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return <SugerenciasViewer sugerencias={sugerencias} />
}
