'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export async function crearAseguramientoItem(data: {
  departamento: string
  muestra: string
  ensayoId: string
  fechaInicio: string
  dias: number
}) {
  const session = await auth()
  if (!session) throw new Error('No autorizado')

  const fechaInicio = new Date(data.fechaInicio)
  const fechaEntrega = addDays(fechaInicio, data.dias)

  await prisma.aseguramientoItem.create({
    data: {
      departamento: data.departamento,
      muestra: data.muestra,
      ensayoId: data.ensayoId,
      fechaInicio,
      dias: data.dias,
      fechaEntrega,
    },
  })

  revalidatePath('/calidad/aseguramiento')
}

export async function toggleAseguramientoItem(id: string) {
  const session = await auth()
  if (!session) throw new Error('No autorizado')

  const item = await prisma.aseguramientoItem.findUnique({ where: { id } })
  if (!item) throw new Error('No encontrado')

  await prisma.aseguramientoItem.update({
    where: { id },
    data: { completado: !item.completado },
  })

  revalidatePath('/calidad/aseguramiento')
}

export async function eliminarAseguramientoItem(id: string) {
  const session = await auth()
  if (!session) throw new Error('No autorizado')

  await prisma.aseguramientoItem.delete({ where: { id } })
  revalidatePath('/calidad/aseguramiento')
}
