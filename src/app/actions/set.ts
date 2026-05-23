'use server'

import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'
import { siguienteCorrelativo } from '@/lib/correlativo'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { addDays } from 'date-fns'

export async function crearSET(formData: FormData) {
  const session = await requireRol(['ADMINISTRACION'])
  const cotizacionId = formData.get('cotizacionId') as string

  const cot = await prisma.cotizacion.findUniqueOrThrow({
    where: { id: cotizacionId },
    select: { clienteId: true, estado: true },
  })

  if (cot.estado !== 'ACEPTADA') {
    throw new Error('La cotización debe estar aceptada para crear el SET')
  }

  const anio = new Date().getFullYear()
  const numero = await siguienteCorrelativo('set', anio)
  const codigoMuestra = `MU-${anio}-${String(numero).padStart(4, '0')}`

  const fechaIngresoRaw = formData.get('fechaIngreso') as string
  const fechaIngreso = fechaIngresoRaw ? new Date(fechaIngresoRaw) : new Date()

  const set = await prisma.sET.create({
    data: {
      numero,
      anio,
      cotizacionId,
      clienteId: cot.clienteId,
      codigoMuestra,
      fechaIngreso,
      nombreComercial: (formData.get('nombreComercial') as string) || null,
      ingredienteActivo: (formData.get('ingredienteActivo') as string) || null,
      formulacion: (formData.get('formulacion') as string) || null,
      numeroLote: (formData.get('numeroLote') as string) || null,
      fechaFabricacion: formData.get('fechaFabricacion') ? new Date(formData.get('fechaFabricacion') as string) : null,
      fechaVencimiento: formData.get('fechaVencimiento') ? new Date(formData.get('fechaVencimiento') as string) : null,
      pesoVolumen: (formData.get('pesoVolumen') as string) || null,
      tipoMuestra: (formData.get('tipoMuestra') as string) || null,
      observaciones: (formData.get('observaciones') as string) || null,
      creadoPorId: session.user.id,
      nombrePaciente: (formData.get('nombrePaciente') as string) || null,
      ingresoMuestra: (formData.get('ingresoMuestra') as string) || null,
      ingresoMuestraOtro: (formData.get('ingresoMuestraOtro') as string) || null,
      numeroMuestras: (formData.get('numeroMuestras') as string) || null,
      devolucionMuestra: (formData.get('devolucionMuestra') as string) || null,
      condicionesAmbientales: (formData.get('condicionesAmbientales') as string) || null,
      procedenciaDescripcion: (formData.get('procedenciaDescripcion') as string) || null,
      otraIndicacion: (formData.get('otraIndicacion') as string) || null,
      tipoEnvase: (formData.get('tipoEnvase') as string) || null,
      materialEnvase: (formData.get('materialEnvase') as string) || null,
      etiquetaEnvase: (formData.get('etiquetaEnvase') as string) || null,
      seguridadEnvase: (formData.get('seguridadEnvase') as string) || null,
    },
  })

  revalidatePath('/set')
  redirect(`/set/${set.id}`)
}

export async function generarODAs(setId: string) {
  await requireRol(['ADMINISTRACION'])

  const set = await prisma.sET.findUniqueOrThrow({
    where: { id: setId },
    include: {
      cotizacion: { include: { items: { include: { ensayo: true } } } },
    },
  })

  const anio = new Date().getFullYear()

  // One ODA per cotizacion item (ensayo)
  for (const item of set.cotizacion.items) {
    const numero = await siguienteCorrelativo('oda', anio)
    const fechaEntregaCompromiso = addDays(set.fechaIngreso, item.tiempoEntregaDias)

    await prisma.oDA.create({
      data: {
        numero,
        anio,
        setId,
        area: item.ensayo.area,
        fechaEntregaCompromiso,
        items: {
          create: [{
            ensayoId: item.ensayoId,
            costo: item.costo,
            tiempoEntregaDias: item.tiempoEntregaDias,
            fechaEntregaCompromiso,
          }],
        },
      },
    })
  }

  await prisma.sET.update({ where: { id: setId }, data: { estado: 'EN_EJECUCION' } })
  revalidatePath('/set')
  revalidatePath(`/set/${setId}`)
  revalidatePath('/oda')
}

export async function toggleRevisadoODA(odaId: string, setId: string) {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_CALIDAD', 'GERENTE_TECNICO', 'ANALISTA'])
  const oda = await prisma.oDA.findUniqueOrThrow({ where: { id: odaId }, select: { revisado: true } })
  await prisma.oDA.update({ where: { id: odaId }, data: { revisado: !oda.revisado } })
  revalidatePath(`/set/${setId}`)
}

export async function cambiarEstadoSET(setId: string, estado: string) {
  await requireRol(['ADMINISTRACION'])
  await prisma.sET.update({ where: { id: setId }, data: { estado } })
  revalidatePath(`/set/${setId}`)
  revalidatePath('/set')
}
