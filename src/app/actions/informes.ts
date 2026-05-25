'use server'

import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'
import { siguienteCorrelativo } from '@/lib/correlativo'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { nanoid } from 'nanoid'
import { put } from '@vercel/blob'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import QRCode from 'qrcode'

export async function firmarConformidadCalidad(informeId: string, formData: FormData) {
  await requireRol(['DIRECTOR_CALIDAD'])
  const observaciones = (formData.get('observacionesCalidad') as string) || null
  await prisma.informe.update({
    where: { id: informeId },
    data: { estado: 'EN_FIRMA_GERENCIA', firmaCalidad: new Date(), observacionesCalidad: observaciones },
  })
  revalidatePath(`/informes/${informeId}`)
  revalidatePath('/informes')
}

export async function devolverAAdministracion(informeId: string, formData: FormData) {
  await requireRol(['DIRECTOR_CALIDAD'])
  const observaciones = (formData.get('observacionesCalidad') as string) || null
  await prisma.informe.update({
    where: { id: informeId },
    data: { estado: 'EN_ELABORACION', firmaCalidad: null, observacionesCalidad: observaciones },
  })
  revalidatePath(`/informes/${informeId}`)
  revalidatePath('/informes')
}

export async function subirInformeCorregidoCalidad(informeId: string, formData: FormData) {
  await requireRol(['DIRECTOR_CALIDAD'])
  const file = formData.get('informeCorregido') as File | null
  const observaciones = (formData.get('observacionesCalidad') as string) || null
  if (!file || file.size === 0) return

  const ext = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '') || 'pdf'
  const filename = `informes-calidad/${informeId}/${Date.now()}.${ext}`
  const blob = await put(filename, file, { access: 'public' })

  await prisma.informe.update({
    where: { id: informeId },
    data: {
      archivoPdf: blob.url,
      estado: 'EN_FIRMA_GERENCIA',
      firmaCalidad: new Date(),
      observacionesCalidad: observaciones,
    },
  })
  revalidatePath(`/informes/${informeId}`)
  revalidatePath('/informes')
}

export async function subirDocumentoFirmado(informeId: string, formData: FormData) {
  await requireRol(['GERENTE_TECNICO'])
  const file = formData.get('firmado') as File | null
  if (!file || file.size === 0) return

  const ext = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '') || 'pdf'
  const filename = `informes-firmados/${informeId}/${Date.now()}.${ext}`
  const blob = await put(filename, file, { access: 'public' })

  await prisma.informe.update({
    where: { id: informeId },
    data: { archivoFirmadoGerencia: blob.url },
  })
  revalidatePath(`/informes/${informeId}`)
}

export async function firmarGerenciaTecnica(informeId: string) {
  await requireRol(['GERENTE_TECNICO'])

  const informe = await prisma.informe.findUniqueOrThrow({
    where: { id: informeId },
    include: { oda: { include: { set: { include: { cliente: true } } } } },
  })

  if (!informe.archivoFirmadoGerencia) {
    throw new Error('Debes subir el documento firmado antes de generar el QR')
  }

  const anio = new Date().getFullYear()
  const num = String(Math.floor(Math.random() * 900) + 100)
  const codigo = `${anio}-${num}`
  const clave = nanoid(16)
  const base = process.env.NEXTAUTH_URL ?? 'https://cetox-app.vercel.app'
  const qrUrl = `${base}/validation/${codigo}`

  // Embed QR into the signed PDF
  const docBytes = await fetch(informe.archivoFirmadoGerencia).then((r) => r.arrayBuffer())
  const pdfDoc = await PDFDocument.load(docBytes)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const qrBuffer = await QRCode.toBuffer(qrUrl, { width: 120, margin: 1 })
  const qrImage = await pdfDoc.embedPng(qrBuffer)

  const pages = pdfDoc.getPages()
  const lastPage = pages[pages.length - 1]
  const { width } = lastPage.getSize()
  const qrSize = 90

  lastPage.drawImage(qrImage, { x: width - qrSize - 20, y: 20, width: qrSize, height: qrSize })
  lastPage.drawText('Verificar en:', { x: width - qrSize - 20, y: 115, size: 6, font, color: rgb(0.4, 0.4, 0.4) })
  lastPage.drawText(qrUrl, { x: width - qrSize - 20, y: 108, size: 5.5, font, color: rgb(0.4, 0.4, 0.4) })
  lastPage.drawText(`Código: ${codigo}  |  Clave: ${clave}`, { x: width - qrSize - 20, y: 101, size: 5.5, font, color: rgb(0.122, 0.306, 0.475) })

  const finalBytes = await pdfDoc.save()
  const finalBlob = await put(
    `informes-finales/${informeId}/informe-firmado-qr.pdf`,
    finalBytes,
    { access: 'public' }
  )

  await prisma.informe.update({
    where: { id: informeId },
    data: { estado: 'FIRMADO', firmaGerencia: new Date(), archivoPdf: finalBlob.url },
  })

  await prisma.certificado.create({
    data: { codigo, informeId, clave, qrUrl },
  })

  await prisma.oDA.update({
    where: { id: informe.odaId },
    data: { estado: 'INFORME_EMITIDO' },
  })

  // Auto-crear cargo de entrega para el SET si aún no existe
  const setId = informe.oda.setId
  const anioActual = new Date().getFullYear()
  const existeCargo = await prisma.cargoEntrega.findUnique({ where: { setId } })
  if (!existeCargo) {
    const numCargo = await siguienteCorrelativo('cargo', anioActual)
    await prisma.cargoEntrega.create({
      data: { numero: numCargo, anio: anioActual, setId },
    })
  }
  await prisma.sET.update({ where: { id: setId }, data: { estado: 'INFORME_EMITIDO' } })

  revalidatePath('/cargos')
  revalidatePath(`/informes/${informeId}`)
  revalidatePath('/informes')
  redirect(`/informes/${informeId}`)
}

export async function subirInformeElaborado(informeId: string, formData: FormData) {
  await requireRol(['ADMINISTRACION'])
  const file = formData.get('informe') as File | null
  if (!file || file.size === 0) return

  const ext = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '') || 'docx'
  const filename = `informes-elaborados/${informeId}/${Date.now()}.${ext}`
  const blob = await put(filename, file, { access: 'public' })

  await prisma.informe.update({
    where: { id: informeId },
    data: { archivoPdf: blob.url },
  })
  revalidatePath(`/informes/${informeId}`)
}

export async function enviarAElaboracion(informeId: string) {
  await requireRol(['ANALISTA'])
  await prisma.informe.update({
    where: { id: informeId },
    data: { estado: 'EN_ELABORACION', fechaEnvioResultados: new Date() },
  })
  revalidatePath(`/informes/${informeId}`)
  revalidatePath('/informes')
}

export async function enviarARevision(informeId: string) {
  await requireRol(['ADMINISTRACION'])
  await prisma.informe.update({
    where: { id: informeId },
    data: { estado: 'EN_REVISION_CALIDAD' },
  })
  revalidatePath(`/informes/${informeId}`)
  revalidatePath('/informes')
}
