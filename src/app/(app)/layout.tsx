import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { moduloBloqueado } from '@/lib/roles'
import { AppShell } from '@/components/app-shell'
import { PageTransition } from '@/components/page-transition'

const DESTINO_BLOQUEO = '/dashboard'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  // La cuenta de la tablet del counter nunca entra al ERP: todo lo que esté
  // bajo (app) la devuelve a su pantalla. El counter vive fuera de este layout.
  if (session.user.rol === 'COUNTER_QUIMICA') redirect('/counter/quimica')

  // Fetch the 30 most recent notifications + approver matrix check (for sidebar gating)
  const [notificaciones, vacApproverCount, usuarioMeta] = await Promise.all([
    prisma.notificacion.findMany({
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
    }),
    prisma.usuarioAprobadorVacaciones.count({ where: { aprobadorId: session.user.id } }),
    prisma.usuario.findUnique({ where: { id: session.user.id }, select: { esJefeLab: true, modulosBloqueados: true } }),
  ])
  const isVacApprover = vacApproverCount > 0
  const esJefeLab = usuarioMeta?.esJefeLab ?? false
  const modulosBloqueados = usuarioMeta?.modulosBloqueados ?? []

  // Punto único donde se aplican los módulos bloqueados: el layout envuelve a
  // todas las páginas, así que cubre también el acceso directo por URL sin
  // tener que tocar el guard de cada página.
  if (modulosBloqueados.length > 0 && session.user.rol !== 'SUPER_ADMIN') {
    const pathname = (await headers()).get('x-pathname') ?? ''
    if (pathname !== DESTINO_BLOQUEO && moduloBloqueado(modulosBloqueados, pathname)) {
      redirect(DESTINO_BLOQUEO)
    }
  }

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
      isVacApprover={isVacApprover}
      esJefeLab={esJefeLab}
      modulosBloqueados={modulosBloqueados}
      notificaciones={notificacionesSerialized}
    >
      <PageTransition>{children}</PageTransition>
    </AppShell>
  )
}
