'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const ROLES_GESTION = [
  'SUPER_ADMIN', 'GERENTE_GENERAL', 'GERENTE_TECNICO',
  'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION',
]

async function guard() {
  const session = await auth()
  if (!session) throw new Error('No autenticado')
  if (!ROLES_GESTION.includes(session.user.rol)) throw new Error('No autorizado')
  return session
}

function optDate(v?: string | null): Date | null {
  return v ? new Date(v) : null
}

export async function crearTarea(data: {
  proyectoId: string; titulo: string; descripcion?: string; responsableId?: string
  estado?: string; prioridad?: string; fechaVencimiento?: string; orden?: number
}) {
  await guard()
  const { fechaVencimiento, ...rest } = data
  await prisma.tareaProyecto.create({ data: { ...rest, fechaVencimiento: optDate(fechaVencimiento) } })
  revalidatePath(`/gerencia/proyectos/${data.proyectoId}`)
}

export async function actualizarTarea(id: string, data: {
  titulo?: string; descripcion?: string; responsableId?: string | null
  estado?: string; prioridad?: string | null; fechaVencimiento?: string | null; orden?: number
}) {
  await guard()
  const { fechaVencimiento, ...rest } = data
  const t = await prisma.tareaProyecto.update({
    where: { id },
    data: { ...rest, ...(fechaVencimiento !== undefined ? { fechaVencimiento: optDate(fechaVencimiento) } : {}) },
    select: { proyectoId: true },
  })
  revalidatePath(`/gerencia/proyectos/${t.proyectoId}`)
}

export async function eliminarTarea(id: string) {
  await guard()
  const t = await prisma.tareaProyecto.delete({ where: { id }, select: { proyectoId: true } })
  revalidatePath(`/gerencia/proyectos/${t.proyectoId}`)
}
