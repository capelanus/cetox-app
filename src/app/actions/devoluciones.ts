'use server'

import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'
import { siguienteCorrelativo } from '@/lib/correlativo'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function crearDevolucion(formData: FormData) {
  const session = await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  const anio = new Date().getFullYear()
  const numero = await siguienteCorrelativo('devolucion', anio)

  const recepcionId = formData.get('recepcionId') as string
  const tipo = (formData.get('tipo') as string) || 'TOTAL'
  const motivo = formData.get('motivo') as string
  const itemsJson = formData.get('items') as string
  const items: { descripcion: string; cantidad: number; unidad: string; motivo?: string }[] = JSON.parse(itemsJson || '[]')

  const dev = await prisma.devolucion.create({
    data: {
      numero,
      anio,
      recepcionId,
      tipo,
      motivo,
      gestionadoPorId: session.user.id,
      estado: 'PENDIENTE',
      items: { create: items },
    },
  })

  revalidatePath('/operaciones/devoluciones')
  revalidatePath(`/operaciones/recepciones/${recepcionId}`)
  redirect(`/operaciones/devoluciones/${dev.id}`)
}

export async function procesarDevolucion(id: string) {
  await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  await prisma.devolucion.update({ where: { id }, data: { estado: 'PROCESADA' } })
  revalidatePath('/operaciones/devoluciones')
  revalidatePath(`/operaciones/devoluciones/${id}`)
}
