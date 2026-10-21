'use server'

import { prisma } from '@/lib/prisma'
import { requireRol, ROLES_SOLICITUDES_WEB } from '@/lib/roles'
import { revalidatePath } from 'next/cache'

const ESTADOS = ['NUEVA', 'EN_PROCESO', 'ATENDIDA', 'DESCARTADA'] as const
type Estado = (typeof ESTADOS)[number]

export async function cambiarEstadoSolicitudWeb(id: string, estado: Estado, notaInterna?: string) {
  const session = await requireRol(ROLES_SOLICITUDES_WEB)
  if (!ESTADOS.includes(estado)) return { ok: false, error: 'Estado inválido.' }

  await prisma.solicitudWeb.update({
    where: { id },
    data: {
      estado,
      notaInterna: notaInterna?.trim() || undefined,
      atendidoPor: estado === 'NUEVA' ? null : session.user.name,
      fechaAtencion: estado === 'NUEVA' ? null : new Date(),
    },
  })

  revalidatePath('/administracion/solicitudes-web')
  return { ok: true }
}
