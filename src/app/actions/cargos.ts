'use server'

import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'
import { siguienteCorrelativo } from '@/lib/correlativo'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function crearCargoEntrega(setId: string, formData: FormData) {
  await requireRol(['ADMINISTRACION'])

  const anio = new Date().getFullYear()
  const numero = await siguienteCorrelativo('cargo', anio)

  const cargo = await prisma.cargoEntrega.upsert({
    where: { setId },
    update: {
      recibidoPor: (formData.get('recibidoPor') as string) || null,
      dniRecibe: (formData.get('dniRecibe') as string) || null,
      fechaRecepcion: formData.get('fechaRecepcion')
        ? new Date(formData.get('fechaRecepcion') as string)
        : new Date(),
    },
    create: {
      numero,
      anio,
      setId,
      recibidoPor: (formData.get('recibidoPor') as string) || null,
      dniRecibe: (formData.get('dniRecibe') as string) || null,
      fechaRecepcion: formData.get('fechaRecepcion')
        ? new Date(formData.get('fechaRecepcion') as string)
        : new Date(),
    },
  })

  await prisma.sET.update({ where: { id: setId }, data: { estado: 'ENTREGADA' } })

  revalidatePath('/cargos')
  revalidatePath(`/cargos/${setId}`)
  revalidatePath('/set')
  redirect(`/cargos/${setId}`)
}
