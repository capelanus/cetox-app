'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { audit } from '@/lib/audit'

// Roles que los gerentes pueden controlar
const ROLES_CONTROLABLES = ['ADMINISTRACION', 'JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA', 'ANALISTA']

// Roles que tienen permiso para ejecutar esta acción
const ROLES_GERENCIA = ['DIRECTOR_CALIDAD', 'GERENTE_TECNICO', 'SUPER_ADMIN']

export async function toggleAccesoUsuario(usuarioId: string, nuevoEstado: boolean) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  // Solo gerentes pueden hacer esto
  if (!ROLES_GERENCIA.includes(session.user.rol)) {
    throw new Error('No tienes permisos para realizar esta acción')
  }

  // Verificar que el usuario objetivo existe y su rol es controlable
  const objetivo = await prisma.usuario.findUnique({
    where:  { id: usuarioId },
    select: { id: true, nombre: true, rol: true, activo: true, email: true },
  })

  if (!objetivo) throw new Error('Usuario no encontrado')

  // No se puede controlar el propio acceso
  if (objetivo.id === session.user.id) {
    throw new Error('No puedes modificar tu propio acceso')
  }

  // Solo se pueden controlar los roles designados
  if (!ROLES_CONTROLABLES.includes(objetivo.rol)) {
    throw new Error(`No tienes permiso para controlar usuarios con rol ${objetivo.rol}`)
  }

  await prisma.usuario.update({
    where: { id: usuarioId },
    data:  { activo: nuevoEstado },
  })

  await audit({
    accion:    'UPDATE',
    entidad:   'Usuario',
    entidadId: usuarioId,
    detalle: {
      activo: { antes: objetivo.activo, despues: nuevoEstado },
      accion: nuevoEstado ? 'Acceso reactivado' : 'Acceso desactivado',
    },
  })

  revalidatePath('/gerencia/accesos')
  return { ok: true, nombre: objetivo.nombre }
}
