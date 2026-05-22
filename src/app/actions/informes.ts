'use server'

import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { nanoid } from 'nanoid'

export async function firmarConformidadCalidad(informeId: string) {
  await requireRol(['DIRECTOR_CALIDAD'])
  await prisma.informe.update({
    where: { id: informeId },
    data: { estado: 'EN_FIRMA_GERENCIA', firmaCalidad: new Date() },
  })
  revalidatePath(`/informes/${informeId}`)
  revalidatePath('/informes')
}

export async function firmarGerenciaTecnica(informeId: string) {
  await requireRol(['GERENTE_TECNICO'])

  const informe = await prisma.informe.findUniqueOrThrow({
    where: { id: informeId },
    include: { oda: { include: { set: { include: { cliente: true } } } } },
  })

  const anio = new Date().getFullYear()
  const num = String(Math.floor(Math.random() * 900) + 100)
  const codigo = `${anio}-${num}`
  const clave = nanoid(16)
  const base = process.env.NEXTAUTH_URL ?? 'https://cetox-app.vercel.app'
  const qrUrl = `${base}/validation/${codigo}`

  await prisma.informe.update({
    where: { id: informeId },
    data: { estado: 'FIRMADO', firmaGerencia: new Date() },
  })

  await prisma.certificado.create({
    data: { codigo, informeId, clave, qrUrl },
  })

  await prisma.oDA.update({
    where: { id: informe.odaId },
    data: { estado: 'INFORME_EMITIDO' },
  })

  revalidatePath(`/informes/${informeId}`)
  revalidatePath('/informes')
  redirect(`/informes/${informeId}`)
}

export async function enviarARevision(informeId: string) {
  await requireRol(['ANALISTA'])
  await prisma.informe.update({
    where: { id: informeId },
    data: { estado: 'EN_REVISION_CALIDAD' },
  })
  revalidatePath(`/informes/${informeId}`)
  revalidatePath('/informes')
}
