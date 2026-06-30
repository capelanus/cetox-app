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

  if (!['REVISADO', 'APROBADA'].includes(cot.estado)) {
    throw new Error('La cotización debe estar revisada/aprobada para crear el SET')
  }

  const anio = new Date().getFullYear()
  const numero = await siguienteCorrelativo('set', anio)
  const codigoMuestra = `${String(numero).padStart(4, '0')}`

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
      condicionesAmbientales: resolveCondAmb(formData),
      procedenciaDescripcion: (formData.get('procedenciaDescripcion') as string) || null,
      otraIndicacion: (formData.get('otraIndicacion') as string) || null,
      otraIndicacionQ: (formData.get('otraIndicacionQ') as string) || null,
      otraIndicacionB: (formData.get('otraIndicacionB') as string) || null,
      otraIndicacionM: (formData.get('otraIndicacionM') as string) || null,
      tipoEnvase: (formData.get('tipoEnvase') as string) || null,
      materialEnvase: (formData.get('materialEnvase') as string) || null,
      etiquetaEnvase: (formData.get('etiquetaEnvase') as string) || null,
      seguridadEnvase: (formData.get('seguridadEnvase') as string) || null,
    },
  })

  await prisma.cotizacion.update({ where: { id: cotizacionId }, data: { estado: 'APROBADA' } })

  revalidatePath('/set')
  revalidatePath('/cotizaciones')
  redirect(`/set/${set.id}`)
}

export async function generarODAs(setId: string, formData: FormData) {
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
  if (!cot) throw new Error('Este SET no tiene cotización asociada.')

  let sourceItems
  if (set.muestraId) {
    const muestra = cot.muestras.find((m) => m.id === set.muestraId)
    sourceItems = muestra?.items ?? []
  } else if (cot.muestras.length > 0) {
    sourceItems = cot.muestras.flatMap((m) => m.items)
  } else {
    sourceItems = cot.items
  }

  // Filtrar por los items seleccionados en el formulario
  const selectedIds = formData.getAll('itemId') as string[]
  if (selectedIds.length > 0) {
    const selectedSet = new Set(selectedIds)
    sourceItems = sourceItems.filter((it) => selectedSet.has(it.id))
  }
  if (sourceItems.length === 0) throw new Error('Selecciona al menos un ensayo para generar ODAs.')

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

// Resuelve condiciones ambientales: si es "Otro", toma el campo libre
function resolveCondAmb(fd: FormData, prefix = '') {
  const val = (fd.get(`${prefix}condicionesAmbientales`) as string) || null
  if (val === 'Otro') {
    return (fd.get(`${prefix}condicionesAmbientalesOtro`) as string) || null
  }
  return val
}

// Helper para construir datos de SET a partir de FormData (prefijados o no)
function buildSETData(fd: FormData, prefix = '') {
  const g = (k: string) => (fd.get(`${prefix}${k}`) as string) || null
  return {
    nombreComercial: g('nombreComercial'),
    ingredienteActivo: g('ingredienteActivo'),
    formulacion: g('formulacion'),
    numeroLote: g('numeroLote'),
    fechaFabricacion: g('fechaFabricacion') ? new Date(g('fechaFabricacion')!) : null,
    fechaVencimiento: g('fechaVencimiento') ? new Date(g('fechaVencimiento')!) : null,
    pesoVolumen: g('pesoVolumen'),
    tipoMuestra: g('tipoMuestra'),
    observaciones: g('observaciones'),
    nombrePaciente: g('nombrePaciente'),
    edadPaciente: g('edadPaciente'),
    ingresoMuestra: g('ingresoMuestra'),
    ingresoMuestraOtro: g('ingresoMuestraOtro'),
    numeroMuestras: g('numeroMuestras'),
    devolucionMuestra: g('devolucionMuestra'),
    condicionesAmbientales: resolveCondAmb(fd, prefix),
    procedenciaDescripcion: g('procedenciaDescripcion'),
    otraIndicacion: g('otraIndicacion'),          // legacy
    otraIndicacionQ: g('otraIndicacionQ'),
    otraIndicacionB: g('otraIndicacionB'),
    otraIndicacionM: g('otraIndicacionM'),
    tipoEnvase: g('tipoEnvase'),
    materialEnvase: g('materialEnvase'),
    etiquetaEnvase: g('etiquetaEnvase'),
    seguridadEnvase: g('seguridadEnvase'),
  }
}

/**
 * Crea un SET por cada muestra de la cotización.
 * FormData contiene campos prefijados por índice: "0_nombreComercial", "1_nombreComercial", etc.
 * y campos compartidos: "fechaIngreso", "cotizacionId", "muestraIds" (JSON array)
 */
export async function crearSETsFromMuestras(formData: FormData) {
  const session = await requireRol(['ADMINISTRACION'])
  const cotizacionId = formData.get('cotizacionId') as string
  const muestraIdsJson = formData.get('muestraIds') as string
  // muestraIds = lista completa ordenada renderizada (mapea prefijo {i}_ → id)
  const muestraIds: string[] = JSON.parse(muestraIdsJson)
  // selectedMuestraIds = subset que el usuario quiere generar ahora; si no viene, todas.
  const selectedJson = formData.get('selectedMuestraIds') as string | null
  const selectedSet: Set<string> = selectedJson
    ? new Set(JSON.parse(selectedJson) as string[])
    : new Set(muestraIds)
  if (selectedSet.size === 0) throw new Error('Debes seleccionar al menos una muestra')

  // Verificar que las muestras seleccionadas aún no tengan SET (evitar carrera o doble click)
  const yaConSET = await prisma.sET.findMany({
    where: { muestraId: { in: Array.from(selectedSet) } },
    select: { muestraId: true },
  })
  if (yaConSET.length > 0) {
    throw new Error('Una o más muestras seleccionadas ya tienen un SET creado. Recarga la página.')
  }

  const cot = await prisma.cotizacion.findUniqueOrThrow({
    where: { id: cotizacionId },
    select: { clienteId: true, estado: true },
  })
  if (!['REVISADO', 'APROBADA'].includes(cot.estado)) throw new Error('La cotización debe estar revisada/aprobada')

  // Cargar indicaciones guardadas en cada muestra para pre-llenar el SET
  const muestrasDB = await prisma.cotizacionMuestra.findMany({
    where: { id: { in: muestraIds } },
    select: { id: true, indicacionQ: true, indicacionB: true, indicacionM: true },
  })
  const muestraMap = Object.fromEntries(muestrasDB.map((m) => [m.id, m]))

  const anio = new Date().getFullYear()
  const fechaIngresoRaw = formData.get('fechaIngreso') as string
  const fechaIngreso = fechaIngresoRaw ? new Date(fechaIngresoRaw) : new Date()

  const setIds: string[] = []

  for (let i = 0; i < muestraIds.length; i++) {
    const muestraId = muestraIds[i]
    if (!selectedSet.has(muestraId)) continue
    const numero = await siguienteCorrelativo('set', anio)
    const codigoMuestra = `${String(numero).padStart(4, '0')}`

    const setData = buildSETData(formData, `${i}_`)
    const muestraDB = muestraMap[muestraId]

    // Si el formulario no tiene indicaciones propias, usar las de la cotizacion
    if (!setData.otraIndicacionQ && muestraDB?.indicacionQ) setData.otraIndicacionQ = muestraDB.indicacionQ
    if (!setData.otraIndicacionB && muestraDB?.indicacionB) setData.otraIndicacionB = muestraDB.indicacionB
    if (!setData.otraIndicacionM && muestraDB?.indicacionM) setData.otraIndicacionM = muestraDB.indicacionM

    const set = await prisma.sET.create({
      data: {
        numero,
        anio,
        cotizacionId,
        muestraId,
        clienteId: cot.clienteId,
        codigoMuestra,
        fechaIngreso,
        creadoPorId: session.user.id,
        ...setData,
      },
    })
    setIds.push(set.id)
  }

  await prisma.cotizacion.update({ where: { id: cotizacionId }, data: { estado: 'APROBADA' } })

  revalidatePath('/set')
  revalidatePath('/cotizaciones')
  revalidatePath(`/cotizaciones/${cotizacionId}`)
  // Redirigir al primer SET si solo hay uno, a la lista si son varios
  redirect(setIds.length === 1 ? `/set/${setIds[0]}` : '/set')
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
  const codigoMuestra = `${String(numero).padStart(4, '0')}`

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
      condicionesAmbientales: resolveCondAmb(formData),
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

export async function anularSET(setId: string) {
  await requireRol(['ADMINISTRACION'])

  const set = await prisma.sET.findUniqueOrThrow({
    where: { id: setId },
    select: { estado: true },
  })

  if (set.estado === 'ANULADO') {
    throw new Error('El SET ya está anulado')
  }

  // Anular el SET. Las ODAs e informes asociados conservan su estado
  // (historial intacto), pero quedan excluidos de cargos y contabilidad
  // mediante filtros que verifican el estado del SET.
  await prisma.sET.update({
    where: { id: setId },
    data: { estado: 'ANULADO' },
  })

  revalidatePath(`/set/${setId}`)
  revalidatePath('/set')
  revalidatePath('/finanzas')
  revalidatePath('/kpis')
  revalidatePath('/cargos')
  revalidatePath('/oda')
  revalidatePath('/informes')
}

export async function reestablecerSET(setId: string) {
  await requireRol(['ADMINISTRACION'])

  const set = await prisma.sET.findUniqueOrThrow({
    where: { id: setId },
    select: { estado: true },
  })

  if (set.estado !== 'ANULADO') {
    throw new Error('Solo se puede reestablecer un SET anulado')
  }

  // Si el SET tiene ODAs, debe volver a EN_EJECUCION; si no, a EMITIDA
  const odasCount = await prisma.oDA.count({ where: { setId } })
  const estadoRestaurado = odasCount > 0 ? 'EN_EJECUCION' : 'EMITIDA'

  await prisma.sET.update({
    where: { id: setId },
    data: { estado: estadoRestaurado },
  })

  revalidatePath(`/set/${setId}`)
  revalidatePath('/set')
  revalidatePath('/finanzas')
  revalidatePath('/kpis')
  revalidatePath('/cargos')
  revalidatePath('/oda')
  revalidatePath('/informes')
}

export async function actualizarSET(setId: string, formData: FormData) {
  await requireRol(['ADMINISTRACION'])

  await prisma.sET.update({
    where: { id: setId },
    data: {
      fechaIngreso: formData.get('fechaIngreso') ? new Date(formData.get('fechaIngreso') as string) : undefined,
      nombreComercial: (formData.get('nombreComercial') as string) || null,
      ingredienteActivo: (formData.get('ingredienteActivo') as string) || null,
      formulacion: (formData.get('formulacion') as string) || null,
      numeroLote: (formData.get('numeroLote') as string) || null,
      fechaFabricacion: formData.get('fechaFabricacion') ? new Date(formData.get('fechaFabricacion') as string) : null,
      fechaVencimiento: formData.get('fechaVencimiento') ? new Date(formData.get('fechaVencimiento') as string) : null,
      pesoVolumen: (formData.get('pesoVolumen') as string) || null,
      tipoMuestra: (formData.get('tipoMuestra') as string) || null,
      observaciones: (formData.get('observaciones') as string) || null,
      nombrePaciente: (formData.get('nombrePaciente') as string) || null,
      edadPaciente: (formData.get('edadPaciente') as string) || null,
      ingresoMuestra: (formData.get('ingresoMuestra') as string) || null,
      ingresoMuestraOtro: (formData.get('ingresoMuestraOtro') as string) || null,
      numeroMuestras: (formData.get('numeroMuestras') as string) || null,
      devolucionMuestra: (formData.get('devolucionMuestra') as string) || null,
      condicionesAmbientales: resolveCondAmb(formData),
      procedenciaDescripcion: (formData.get('procedenciaDescripcion') as string) || null,
      otraIndicacion: (formData.get('otraIndicacion') as string) || null,
      otraIndicacionQ: (formData.get('otraIndicacionQ') as string) || null,
      otraIndicacionB: (formData.get('otraIndicacionB') as string) || null,
      otraIndicacionM: (formData.get('otraIndicacionM') as string) || null,
      tipoEnvase: (formData.get('tipoEnvase') as string) || null,
      materialEnvase: (formData.get('materialEnvase') as string) || null,
      etiquetaEnvase: (formData.get('etiquetaEnvase') as string) || null,
      seguridadEnvase: (formData.get('seguridadEnvase') as string) || null,
    },
  })

  revalidatePath(`/set/${setId}`)
  revalidatePath('/set')
  redirect(`/set/${setId}`)
}
