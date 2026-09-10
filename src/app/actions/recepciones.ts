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

  // Acumular lo recibido en los ítems de la OC (misma cantidad y orden con la que
  // se prellenó el formulario, ver recepciones/nueva/page.tsx). No hay FK entre
  // RecepcionItem y OrdenCompraItem, así que se emparejan por posición. Se usa
  // { increment } dentro de una transacción para que dos recepciones concurrentes
  // sobre la misma OC no se pisen (lectura-luego-escritura no es atómica).
  const ocItems = await prisma.ordenCompraItem.findMany({ where: { ordenCompraId }, orderBy: { orden: 'asc' } })
  await prisma.$transaction(
    ocItems.slice(0, items.length).map((ocItem, i) =>
      prisma.ordenCompraItem.update({
        where: { id: ocItem.id },
        data: { cantidadRecibida: { increment: items[i]?.cantidadRecibida || 0 } },
      })
    )
  )

  await prisma.ordenCompraHistorial.create({
    data: {
      ordenCompraId,
      usuarioId: session.user.id,
      descripcion: `Recepción ${estado === 'CONFORME' ? 'conforme' : 'no conforme'} registrada por ${session.user.name ?? session.user.email}`,
    },
  })

  revalidatePath('/operaciones/recepciones')
  revalidatePath('/operaciones/ordenes-compra')
  revalidatePath(`/operaciones/ordenes-compra/${ordenCompraId}`)
  revalidatePath('/operaciones/seguimiento')
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
  revalidatePath('/operaciones/seguimiento')
}
