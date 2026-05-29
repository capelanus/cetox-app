import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/app-shell'
import { PageTransition } from '@/components/page-transition'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  // Fetch the 30 most recent notifications for this user
  const notificaciones = await prisma.notificacion.findMany({
    where: { usuarioId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: {
      id: true,
      tipo: true,
      titulo: true,
      mensaje: true,
      enlace: true,
      leida: true,
      createdAt: true,
    },
  })

  const notificacionesSerialized = notificaciones.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }))

  return (
    <AppShell
      userName={session.user.name ?? ''}
      userEmail={session.user.email ?? ''}
      userRol={session.user.rol}
      userArea={session.user.area}
      userId={session.user.id}
      notificaciones={notificacionesSerialized}
    >
      <PageTransition>{children}</PageTransition>
    </AppShell>
  )
}
