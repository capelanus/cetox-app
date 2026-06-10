'use server'

import { put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'
import { generarCertificadoPdf, type TipoReconocimiento } from '@/lib/certificado'
import { revalidatePath } from 'next/cache'

export interface EmitirCertificadoInput {
  empleadoId:        string
  nombre:            string                   // libre (puede sobrescribir el del empleado)
  tipoReconocimiento: TipoReconocimiento
  motivo:            string
  lugar:             string
  fecha:             string                   // texto libre, ya formateado
}

export async function emitirCertificado(
  input: EmitirCertificadoInput,
): Promise<{ ok: true; url: string; documentoId: string } | { error: string }> {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_ADMINISTRACION'])

  const empleado = await prisma.empleado.findUnique({ where: { id: input.empleadoId } })
  if (!empleado) return { error: 'Empleado no encontrado.' }

  if (!input.nombre.trim())  return { error: 'El nombre es requerido.' }
  if (!input.motivo.trim())  return { error: 'El motivo es requerido.' }
  if (!input.lugar.trim())   return { error: 'El lugar es requerido.' }
  if (!input.fecha.trim())   return { error: 'La fecha es requerida.' }

  // Generar PDF
  const pdfBytes = await generarCertificadoPdf({
    nombre:             input.nombre.trim(),
    tipoReconocimiento: input.tipoReconocimiento,
    motivo:             input.motivo.trim(),
    lugar:              input.lugar.trim(),
    fecha:              input.fecha.trim(),
  })

  // Subir a Vercel Blob
  const slug = input.nombre.trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40)
  const filename = `certificados/${input.empleadoId}/${Date.now()}-${slug}.pdf`
  const blob = await put(filename, Buffer.from(pdfBytes), {
    access:       'public',
    contentType:  'application/pdf',
  })

  // Persistir en DocumentoEmpleado
  const documento = await prisma.documentoEmpleado.create({
    data: {
      empleadoId:  input.empleadoId,
      nombre:      `Certificado · ${input.motivo.slice(0, 80)}`,
      tipo:        'CERTIFICADO',
      archivoUrl:  blob.url,
      archivoTipo: 'application/pdf',
      tamanio:     pdfBytes.length,
    },
  })

  revalidatePath(`/rrhh/personal/${input.empleadoId}`)
  revalidatePath('/rrhh/contratos')

  return { ok: true, url: blob.url, documentoId: documento.id }
}
