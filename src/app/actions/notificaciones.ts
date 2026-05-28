'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function marcarLeida(notificacionId: string) {
  const session = await auth()
  if (!session?.user?.id) return
  await prisma.notificacion.updateMany({
    where: { id: notificacionId, usuarioId: session.user.id },
    data: { leida: true },
  })
  revalidatePath('/', 'layout')
}

export async function marcarTodasLeidas() {
  const session = await auth()
  if (!session?.user?.id) return
  await prisma.notificacion.updateMany({
    where: { usuarioId: session.user.id, leida: false },
    data: { leida: true },
  })
  revalidatePath('/', 'layout')
}
