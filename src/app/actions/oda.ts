'use server'

import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'
import { siguienteCorrelativo } from '@/lib/correlativo'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'

export async function cargarResultado(odaId: string, formData: FormData) {
  const session = await requireRol(['ANALISTA'])
  const resultadoTexto = formData.get('resultadoTexto') as string

  const oda = await prisma.oDA.findUniqueOrThrow({
    where: { id: odaId },
    include: { items: { include: { ensayo: true }, take: 1 } },
  })

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

  // Save uploaded images
  const imageFiles: File[] = []
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('imagen_') && value instanceof File && value.size > 0) {
      imageFiles.push(value)
    }
  }

  if (imageFiles.length > 0) {
    const dir = path.resolve(process.cwd(), 'public/uploads/resultados', informe.id)
    mkdirSync(dir, { recursive: true })

    const existing: string[] = JSON.parse(informe.resultadoImagenes || '[]')
    const newPaths: string[] = []

    for (const file of imageFiles) {
      const ext = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '') || 'png'
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      writeFileSync(path.join(dir, filename), Buffer.from(await file.arrayBuffer()))
      newPaths.push(`uploads/resultados/${informe.id}/${filename}`)
    }

    await prisma.informe.update({
      where: { id: informe.id },
      data: { resultadoImagenes: JSON.stringify([...existing, ...newPaths]) },
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
  await requireRol(['ANALISTA'])
  const edadPaciente = (formData.get('edadPaciente') as string | null)?.trim() || null
  await prisma.oDA.update({
    where: { id: odaId },
    data: { estado: 'RECIBIDA', fechaRecepcion: new Date(), edadPaciente },
  })
  revalidatePath(`/oda/${odaId}`)
}

export async function iniciarEjecucionODA(odaId: string) {
  await requireRol(['ANALISTA'])
  await prisma.oDA.update({ where: { id: odaId }, data: { estado: 'EN_EJECUCION' } })
  revalidatePath(`/oda/${odaId}`)
}
