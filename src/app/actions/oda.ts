'use server'

import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'
import { siguienteCorrelativo } from '@/lib/correlativo'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { put } from '@vercel/blob'

export async function cargarResultado(odaId: string, formData: FormData) {
  const session = await requireRol(['ANALISTA'])
  const resultadoTexto = formData.get('resultadoTexto') as string

  const oda = await prisma.oDA.findUniqueOrThrow({
    where: { id: odaId },
    include: {
      items: { include: { ensayo: true }, take: 1 },
      set: { select: { id: true, nombreComercial: true } },
    },
  })
  const estadoAnteriorOda = oda.estado

  if (session.user.area && oda.area !== session.user.area) {
    throw new Error('No tienes permiso para cargar resultados en esta ODA')
  }

  const prefijo = oda.area

  let informe = await prisma.informe.findUnique({ where: { odaId } })
  if (!informe) {
    const anio = new Date().getFullYear()
    const numero = await siguienteCorrelativo('informe', anio, prefijo)
    informe = await prisma.informe.create({
      data: {
        numero,
        anio,
        prefijo,
        odaId,
        analistaId: session.user.id,
        resultadoTexto,
        estado: 'BORRADOR',
      },
    })
  } else {
    await prisma.informe.update({
      where: { id: informe.id },
      data: { resultadoTexto },
    })
  }

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff']
  const ALLOWED_DOC_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ]
  const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

  const imageFiles: File[] = []
  const docFiles: File[] = []
  for (const [key, value] of formData.entries()) {
    if (!(value instanceof File) || value.size === 0) continue
    if (value.size > MAX_FILE_SIZE) continue
    if (key.startsWith('imagen_') && ALLOWED_IMAGE_TYPES.includes(value.type)) imageFiles.push(value)
    if (key.startsWith('archivo_') && ALLOWED_DOC_TYPES.includes(value.type)) docFiles.push(value)
  }

  if (imageFiles.length > 0) {
    const existing: string[] = JSON.parse(informe.resultadoImagenes || '[]')
    const newUrls: string[] = []

    for (const file of imageFiles) {
      const ext = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '') || 'png'
      const filename = `resultados/${informe.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const blob = await put(filename, file, { access: 'public' })
      newUrls.push(blob.url)
    }

    await prisma.informe.update({
      where: { id: informe.id },
      data: { resultadoImagenes: JSON.stringify([...existing, ...newUrls]) },
    })
  }

  if (docFiles.length > 0) {
    const existing: string[] = JSON.parse((informe as { resultadoArchivos?: string }).resultadoArchivos || '[]')
    const newUrls: string[] = []

    for (const file of docFiles) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filename = `archivos/${informe.id}/${Date.now()}-${safeName}`
      const blob = await put(filename, file, { access: 'public' })
      newUrls.push(blob.url)
    }

    await prisma.informe.update({
      where: { id: informe.id },
      data: { resultadoArchivos: JSON.stringify([...existing, ...newUrls]) },
    })
  }

  await prisma.oDA.update({
    where: { id: odaId },
    data: { estado: 'CON_RESULTADO' },
  })

  // Notificar si todas las ODAs del SET están terminadas (solo en la primera transición)
  if (estadoAnteriorOda !== 'CON_RESULTADO' && estadoAnteriorOda !== 'INFORME_EMITIDO') {
    const ESTADOS_COMPLETADO = ['CON_RESULTADO', 'INFORME_EMITIDO']
    const todasOdas = await prisma.oDA.findMany({
      where: { setId: oda.setId },
      select: { id: true, estado: true },
    })
    // Considerar esta ODA como ya completada (acaba de actualizarse)
    const todasCompletas = todasOdas.every((o) =>
      o.id === odaId ? true : ESTADOS_COMPLETADO.includes(o.estado)
    )
    if (todasCompletas) {
      const ROLES_NOTIFICAR = ['ADMINISTRACION', 'DIRECTOR_CALIDAD', 'GERENTE_TECNICO']
      const destinatarios = await prisma.usuario.findMany({
        where: { rol: { in: ROLES_NOTIFICAR }, activo: true },
        select: { id: true },
      })
      if (destinatarios.length > 0) {
        const nombreMuestra = oda.set.nombreComercial ?? 'muestra sin nombre'
        const numOdas = todasOdas.length
        await prisma.notificacion.createMany({
          data: destinatarios.map((u) => ({
            usuarioId: u.id,
            tipo: 'SET_COMPLETO',
            titulo: numOdas === 1
              ? 'ODA completada'
              : 'Todas las ODAs completadas',
            mensaje: numOdas === 1
              ? `El laboratorio completó su resultado para "${nombreMuestra}".`
              : `Los ${numOdas} laboratorios completaron sus resultados para "${nombreMuestra}".`,
            enlace: `/set/${oda.setId}`,
          })),
        })
      }
    }
  }

  revalidatePath('/oda')
  revalidatePath(`/oda/${odaId}`)
  revalidatePath('/informes')
  redirect(`/informes/${informe.id}`)
}

export async function recibirODA(odaId: string, _formData: FormData) {
  const session = await requireRol(['ANALISTA'])

  const oda = await prisma.oDA.findUniqueOrThrow({ where: { id: odaId }, select: { area: true } })
  if (session.user.area && oda.area !== session.user.area) {
    throw new Error('No tienes permiso para recibir esta ODA')
  }

  await prisma.oDA.update({
    where: { id: odaId },
    data: { estado: 'RECIBIDA', fechaRecepcion: new Date() },
  })
  revalidatePath(`/oda/${odaId}`)
}

export async function iniciarEjecucionODA(odaId: string) {
  const session = await requireRol(['ANALISTA'])
  const oda = await prisma.oDA.findUniqueOrThrow({ where: { id: odaId }, select: { area: true } })
  if (session.user.area && oda.area !== session.user.area) {
    throw new Error('No tienes permiso para operar esta ODA')
  }
  await prisma.oDA.update({ where: { id: odaId }, data: { estado: 'EN_EJECUCION', fechaInicioEjecucion: new Date() } })
  revalidatePath(`/oda/${odaId}`)
}

export async function actualizarODA(odaId: string, formData: FormData) {
  await requireRol(['ADMINISTRACION'])

  const oda = await prisma.oDA.findUniqueOrThrow({
    where: { id: odaId },
    include: { items: true },
  })

  const fechaEntrega = formData.get('fechaEntregaCompromiso') as string
  const area = formData.get('area') as string

  // Update ODA main fields
  await prisma.oDA.update({
    where: { id: odaId },
    data: {
      ...(fechaEntrega ? { fechaEntregaCompromiso: new Date(fechaEntrega) } : {}),
      ...(area ? { area } : {}),
    },
  })

  // Update each ODAItem
  for (const item of oda.items) {
    const costo = formData.get(`costo_${item.id}`) as string
    const dias = formData.get(`dias_${item.id}`) as string
    const fechaItem = formData.get(`fecha_${item.id}`) as string

    await prisma.oDAItem.update({
      where: { id: item.id },
      data: {
        ...(costo !== null && costo !== '' ? { costo: parseFloat(costo) } : {}),
        ...(dias !== null && dias !== '' ? { tiempoEntregaDias: parseInt(dias) } : {}),
        ...(fechaItem ? { fechaEntregaCompromiso: new Date(fechaItem) } : {}),
      },
    })
  }

  revalidatePath(`/set/${oda.setId}`)
  revalidatePath(`/set/${oda.setId}/editar`)
  revalidatePath(`/oda/${odaId}`)
  revalidatePath('/oda')
}

export async function eliminarODA(odaId: string) {
  await requireRol(['ADMINISTRACION'])

  const oda = await prisma.oDA.findUniqueOrThrow({
    where: { id: odaId },
    include: { informe: true },
  })

  // Bloquear si el informe ya está en un estado avanzado
  if (oda.informe) {
    const estadosProtegidos = ['EMITIDO', 'FIRMADO', 'ENTREGADO']
    if (estadosProtegidos.includes(oda.informe.estado)) {
      throw new Error(
        `No se puede eliminar: el informe ${oda.informe.prefijo}-${oda.informe.numero} ya está en estado "${oda.informe.estado}".`
      )
    }
    // Si está en BORRADOR o CON_RESULTADO, eliminar el informe primero
    await prisma.informe.delete({ where: { id: oda.informe.id } })
  }

  // ODAItems tienen onDelete: Cascade — se eliminan automáticamente
  await prisma.oDA.delete({ where: { id: odaId } })

  // Si el SET ya no tiene ODAs, volver a estado EMITIDA
  const odaRestantes = await prisma.oDA.count({ where: { setId: oda.setId } })
  if (odaRestantes === 0) {
    await prisma.sET.update({ where: { id: oda.setId }, data: { estado: 'EMITIDA' } })
  }

  revalidatePath(`/set/${oda.setId}`)
  revalidatePath(`/set/${oda.setId}/editar`)
  revalidatePath('/set')
  revalidatePath('/oda')
}
