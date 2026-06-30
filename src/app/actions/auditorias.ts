'use server'

import { prisma } from '@/lib/prisma'
import { requireRol, type Rol } from '@/lib/roles'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const ROLES_AUDITORIA: Rol[] = ['DIRECTOR_CALIDAD', 'COORDINADOR_CALIDAD']

export async function crearAuditoria(formData: FormData) {
  const session = await requireRol(ROLES_AUDITORIA)
  const codigo      = (formData.get('codigo') as string)?.trim()
  const fechaRaw    = formData.get('fecha') as string
  const descripcion = (formData.get('descripcion') as string)?.trim() || null

  if (!codigo) throw new Error('El código es obligatorio')
  if (!fechaRaw) throw new Error('La fecha es obligatoria')

  const auditoria = await prisma.auditoria.create({
    data: {
      codigo,
      fecha:       new Date(fechaRaw),
      descripcion,
      creadoPorId: session.user.id,
    },
  })

  revalidatePath('/auditorias')
  redirect(`/auditorias/${auditoria.id}`)
}

export async function agregarDocumentoAuditoria(auditoriaId: string, nombre: string, archivoUrl: string) {
  await requireRol(ROLES_AUDITORIA)
  await prisma.auditoriaDocumento.create({
    data: { auditoriaId, nombre, archivoUrl },
  })
  revalidatePath(`/auditorias/${auditoriaId}`)
}

export async function eliminarDocumentoAuditoria(docId: string) {
  await requireRol(ROLES_AUDITORIA)
  const doc = await prisma.auditoriaDocumento.findUniqueOrThrow({
    where:  { id: docId },
    select: { auditoriaId: true },
  })
  await prisma.auditoriaDocumento.delete({ where: { id: docId } })
  revalidatePath(`/auditorias/${doc.auditoriaId}`)
}

export async function eliminarAuditoria(id: string) {
  await requireRol(ROLES_AUDITORIA)
  await prisma.auditoria.delete({ where: { id } })
  revalidatePath('/auditorias')
  redirect('/auditorias')
}
