'use server'

import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'
import { siguienteCorrelativo } from '@/lib/correlativo'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function crearRequerimiento(formData: FormData) {
  const session = await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  const anio = new Date().getFullYear()
  const numero = await siguienteCorrelativo('requerimiento', anio)

  const areaSolicitante = formData.get('areaSolicitante') as string
  const descripcion = formData.get('descripcion') as string
  const justificacion = formData.get('justificacion') as string
  const urgencia = formData.get('urgencia') as string
  const fechaRequerida = formData.get('fechaRequerida') as string

  // Parse items from JSON
  const itemsJson = formData.get('items') as string
  const items: { descripcion: string; cantidad: number; unidad: string; especificaciones?: string }[] = JSON.parse(itemsJson || '[]')

  if (!areaSolicitante || !descripcion) throw new Error('Área y descripción son requeridos')

  const req = await prisma.requerimiento.create({
    data: {
      numero,
      anio,
      areaSolicitante,
      descripcion,
      justificacion: justificacion || null,
      urgencia: urgencia || 'NORMAL',
      estado: 'BORRADOR',
      fechaRequerida: fechaRequerida ? new Date(fechaRequerida) : null,
      creadoPorId: session.user.id,
      items: {
        create: items.map((item, i) => ({
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          unidad: item.unidad,
          especificaciones: item.especificaciones || null,
          orden: i,
        })),
      },
    },
  })

  revalidatePath('/operaciones/requerimientos')
  redirect(`/operaciones/requerimientos/${req.id}`)
}

export async function enviarRequerimiento(id: string) {
  await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  await prisma.requerimiento.update({
    where: { id },
    data: { estado: 'ENVIADO' },
  })
  revalidatePath('/operaciones/requerimientos')
  revalidatePath(`/operaciones/requerimientos/${id}`)
}

export async function actualizarRequerimiento(id: string, formData: FormData) {
  await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  const areaSolicitante = formData.get('areaSolicitante') as string
  const descripcion = formData.get('descripcion') as string
  const justificacion = formData.get('justificacion') as string
  const urgencia = formData.get('urgencia') as string
  const fechaRequerida = formData.get('fechaRequerida') as string
  const itemsJson = formData.get('items') as string
  const items: { descripcion: string; cantidad: number; unidad: string; especificaciones?: string }[] = JSON.parse(itemsJson || '[]')

  await prisma.requerimientoItem.deleteMany({ where: { requerimientoId: id } })
  await prisma.requerimiento.update({
    where: { id },
    data: {
      areaSolicitante,
      descripcion,
      justificacion: justificacion || null,
      urgencia: urgencia || 'NORMAL',
      fechaRequerida: fechaRequerida ? new Date(fechaRequerida) : null,
      items: {
        create: items.map((item, i) => ({
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          unidad: item.unidad,
          especificaciones: item.especificaciones || null,
          orden: i,
        })),
      },
    },
  })
  revalidatePath('/operaciones/requerimientos')
  revalidatePath(`/operaciones/requerimientos/${id}`)
  redirect(`/operaciones/requerimientos/${id}`)
}
