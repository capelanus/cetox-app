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
      edadPaciente: (formData.get('edadPaciente') as string) || null,
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
      cotizacion: {
        include: {
          items: { include: { ensayo: true } },
          muestras: { include: { items: { include: { ensayo: true } } } },
        },
      },
    },
  })

  const anio = new Date().getFullYear()
  const cot = set.cotizacion
  if (!cot) throw new Error('Este SET no tiene cotización asociada. Las ODAs ya fueron generadas al crearlo.')

  const sourceItems = cot.muestras.length > 0
    ? cot.muestras.flatMap((m) => m.items)
    : cot.items

  // One ODA per ensayo item
  for (const item of sourceItems) {
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

export async function crearSETCero(formData: FormData) {
  const session = await requireRol(['ADMINISTRACION'])

  const clienteId = formData.get('clienteId') as string
  const motivoCero = formData.get('motivoCero') as string
  const ensayoIds = formData.getAll('ensayoIds') as string[]

  if (!clienteId) throw new Error('Debe seleccionar un cliente')
  if (!motivoCero) throw new Error('Debe seleccionar el motivo')
  if (ensayoIds.length === 0) throw new Error('Debe seleccionar al menos un ensayo')

  const anio = new Date().getFullYear()
  const numero = await siguienteCorrelativo('set', anio)
  const codigoMuestra = `MU-${anio}-${String(numero).padStart(4, '0')}`

  const fechaIngresoRaw = formData.get('fechaIngreso') as string
  const fechaIngreso = fechaIngresoRaw ? new Date(fechaIngresoRaw) : new Date()

  const set = await prisma.sET.create({
    data: {
      numero,
      anio,
      cotizacionId: null,
      motivoCero,
      clienteId,
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
      edadPaciente: (formData.get('edadPaciente') as string) || null,
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

  // Fetch ensayo details and immediately generate ODAs with costo = 0
  const ensayos = await prisma.ensayo.findMany({ where: { id: { in: ensayoIds } } })
  for (const ensayo of ensayos) {
    const odaNum = await siguienteCorrelativo('oda', anio)
    const fechaEntregaCompromiso = addDays(fechaIngreso, ensayo.tiempoEntregaDias)
    await prisma.oDA.create({
      data: {
        numero: odaNum,
        anio,
        setId: set.id,
        area: ensayo.area,
        fechaEntregaCompromiso,
        items: {
          create: [{
            ensayoId: ensayo.id,
            costo: 0,
            tiempoEntregaDias: ensayo.tiempoEntregaDias,
            fechaEntregaCompromiso,
          }],
        },
      },
    })
  }

  await prisma.sET.update({ where: { id: set.id }, data: { estado: 'EN_EJECUCION' } })

  revalidatePath('/set')
  revalidatePath('/oda')
  redirect(`/set/${set.id}`)
}

export async function toggleRevisadoODA(odaId: string, setId: string) {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_CALIDAD', 'GERENTE_TECNICO', 'ANALISTA'])
  const oda = await prisma.oDA.findUniqueOrThrow({ where: { id: odaId }, select: { revisado: true } })
  const nuevoRevisado = !oda.revisado
  await prisma.oDA.update({
    where: { id: odaId },
    data: { revisado: nuevoRevisado, fechaRevisado: nuevoRevisado ? new Date() : null },
  })
  revalidatePath(`/set/${setId}`)
}

export async function cambiarEstadoSET(setId: string, estado: string) {
  await requireRol(['ADMINISTRACION'])
  await prisma.sET.update({ where: { id: setId }, data: { estado } })
  revalidatePath(`/set/${setId}`)
  revalidatePath('/set')
}
