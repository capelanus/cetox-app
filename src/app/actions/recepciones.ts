'use server'

import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'
import { siguienteCorrelativo } from '@/lib/correlativo'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function crearRecepcion(formData: FormData) {
  const session = await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  const anio = new Date().getFullYear()
  const numero = await siguienteCorrelativo('recepcion', anio)

  const ordenCompraId = formData.get('ordenCompraId') as string
  const observaciones = formData.get('observaciones') as string
  const areaDestino   = (formData.get('areaDestino') as string) || null
  const itemsJson = formData.get('items') as string
  const items: { descripcion: string; cantidadEsperada: number; cantidadRecibida: number; unidad: string; conforme: boolean; observacion?: string }[] = JSON.parse(itemsJson || '[]')

  const todosConformes = items.every(item => item.conforme)
  const estado = todosConformes ? 'CONFORME' : 'NO_CONFORME'

  const rec = await prisma.recepcion.create({
    data: {
      numero,
      anio,
      ordenCompraId,
      recibidoPorId: session.user.id,
      estado,
      observaciones: observaciones || null,
      areaDestino,
      items: { create: items },
    },
  })

  // Update OC estado
  await prisma.ordenCompra.update({ where: { id: ordenCompraId }, data: { estado: 'RECIBIDA' } })
  const oc = await prisma.ordenCompra.findUnique({ where: { id: ordenCompraId } })
  if (oc) await prisma.requerimiento.update({ where: { id: oc.requerimientoId }, data: { estado: 'RECEPCIONADO' } })

  revalidatePath('/operaciones/recepciones')
  redirect(`/operaciones/recepciones/${rec.id}`)
}

export async function registrarEntregaArea(id: string, formData: FormData) {
  await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  const entregadoAlAreaPor = formData.get('entregadoAlAreaPor') as string
  const conformeArea = formData.get('conformeArea') === 'true'
  const observacionesArea = formData.get('observacionesArea') as string

  await prisma.recepcion.update({
    where: { id },
    data: {
      entregadoAlAreaFecha: new Date(),
      entregadoAlAreaPor: entregadoAlAreaPor || null,
      conformeArea,
      observacionesArea: observacionesArea || null,
      estado: conformeArea ? 'ENTREGADO_AREA' : 'NO_CONFORME',
    },
  })
  revalidatePath('/operaciones/recepciones')
  revalidatePath(`/operaciones/recepciones/${id}`)
}
