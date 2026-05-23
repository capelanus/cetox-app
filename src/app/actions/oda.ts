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
    include: { items: { include: { ensayo: true }, take: 1 } },
  })

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

  revalidatePath('/oda')
  revalidatePath(`/oda/${odaId}`)
  revalidatePath('/informes')
  redirect(`/informes/${informe.id}`)
}

export async function recibirODA(odaId: string, formData: FormData) {
  const session = await requireRol(['ANALISTA'])
  const edadPaciente = (formData.get('edadPaciente') as string | null)?.trim() || null

  const oda = await prisma.oDA.findUniqueOrThrow({ where: { id: odaId }, select: { area: true } })
  if (session.user.area && oda.area !== session.user.area) {
    throw new Error('No tienes permiso para recibir esta ODA')
  }

  await prisma.oDA.update({
    where: { id: odaId },
    data: { estado: 'RECIBIDA', fechaRecepcion: new Date(), edadPaciente },
  })
  revalidatePath(`/oda/${odaId}`)
}

export async function iniciarEjecucionODA(odaId: string) {
  const session = await requireRol(['ANALISTA'])
  const oda = await prisma.oDA.findUniqueOrThrow({ where: { id: odaId }, select: { area: true } })
  if (session.user.area && oda.area !== session.user.area) {
    throw new Error('No tienes permiso para operar esta ODA')
  }
  await prisma.oDA.update({ where: { id: odaId }, data: { estado: 'EN_EJECUCION' } })
  revalidatePath(`/oda/${odaId}`)
}
