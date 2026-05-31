'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { audit } from '@/lib/audit'

async function siguienteNumeroPeticion(anio: number): Promise<number> {
  const last = await prisma.peticionEfectivo.findFirst({
    where: { anio },
    orderBy: { numero: 'desc' },
    select: { numero: true },
  })
  return (last?.numero ?? 0) + 1
}

export async function crearPeticion(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')
  if (session.user.rol !== 'DIRECTOR_CALIDAD' && session.user.rol !== 'SUPER_ADMIN')
    throw new Error('Sin permiso')

  const concepto = 'Reabastecimiento de Caja Chica'
  const monto    = parseFloat(formData.get('monto') as string)
  const moneda   = (formData.get('moneda') as string) || 'PEN'

  if (isNaN(monto) || monto <= 0) throw new Error('Datos inválidos')

  const anio   = new Date().getFullYear()
  const numero = await siguienteNumeroPeticion(anio)

  const p = await prisma.peticionEfectivo.create({
    data: { numero, anio, solicitanteId: session.user.id, concepto, montoSolicitado: monto, moneda, justificacion: null },
  })

  await audit({ accion: 'CREATE', entidad: 'PeticionEfectivo', entidadId: p.id, detalle: { concepto, monto } })
  revalidatePath('/caja-chica/peticiones')
  redirect('/caja-chica/peticiones')
}

export async function resolverPeticion(
  peticionId: string,
  accion: 'APROBAR' | 'RECHAZAR',
  montoAprobado?: number,
  motivoRechazo?: string,
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')
  if (session.user.rol !== 'DIRECTOR_ADMINISTRACION' && session.user.rol !== 'SUPER_ADMIN')
    throw new Error('Sin permiso')

  const peticion = await prisma.peticionEfectivo.findUnique({ where: { id: peticionId } })
  if (!peticion) throw new Error('Petición no encontrada')
  if (peticion.estado !== 'PENDIENTE') throw new Error('La petición ya fue resuelta')

  if (accion === 'APROBAR') {
    const monto = montoAprobado ?? peticion.montoSolicitado

    // Create CajaChicaIngreso automatically
    const ingreso = await prisma.cajaChicaIngreso.create({
      data: {
        monto,
        moneda:      peticion.moneda,
        descripcion: `Aprobación petición #${peticion.numero}-${peticion.anio}: ${peticion.concepto}`,
        creadoPorId: session.user.id,
      },
    })

    await prisma.peticionEfectivo.update({
      where: { id: peticionId },
      data: {
        estado:          'APROBADA',
        montoAprobado:   monto,
        aprobadaPorId:   session.user.id,
        fechaResolucion: new Date(),
        ingresoId:       ingreso.id,
      },
    })
  } else {
    await prisma.peticionEfectivo.update({
      where: { id: peticionId },
      data: {
        estado:          'RECHAZADA',
        motivoRechazo:   motivoRechazo || 'Sin motivo',
        aprobadaPorId:   session.user.id,
        fechaResolucion: new Date(),
      },
    })
  }

  await audit({
    accion: 'UPDATE',
    entidad: 'PeticionEfectivo',
    entidadId: peticionId,
    detalle: { accion, montoAprobado, motivoRechazo },
  })
  revalidatePath('/caja-chica/peticiones')
  revalidatePath('/caja-chica')
}
