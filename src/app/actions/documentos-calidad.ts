'use server'

import { prisma } from '@/lib/prisma'
import { requireRol, type Rol } from '@/lib/roles'
import { revalidatePath } from 'next/cache'
import { type Departamento } from '@/lib/calidad-constants'

const ROLES_CALIDAD: Rol[] = ['DIRECTOR_CALIDAD', 'COORDINADOR_CALIDAD']

const CATEGORIAS_VALIDAS = ['FORMATO', 'PROCEDIMIENTO', 'INSTRUCTIVO'] as const

export async function subirDocumentoCalidad(
  categoria: string,
  nombre: string,
  archivoUrl: string,
) {
  const session = await requireRol(ROLES_CALIDAD)

  if (!CATEGORIAS_VALIDAS.includes(categoria as typeof CATEGORIAS_VALIDAS[number])) {
    throw new Error('Categoría inválida')
  }
  if (!nombre.trim()) throw new Error('El nombre es obligatorio')
  if (!archivoUrl) throw new Error('El archivo es obligatorio')

  await prisma.documentoCalidad.create({
    data: {
      nombre: nombre.trim(),
      archivoUrl,
      categoria,
      subidoPorId: session.user.id,
    },
  })

  revalidatePath(`/calidad/${categoria.toLowerCase()}s`)
}

export async function eliminarDocumentoCalidad(id: string, categoria: string) {
  await requireRol(ROLES_CALIDAD)
  await prisma.documentoCalidad.delete({ where: { id } })
  revalidatePath(`/calidad/${categoria.toLowerCase()}s`)
}

export async function toggleAccesoDocumento(documentoId: string, departamento: Departamento) {
  await requireRol(ROLES_CALIDAD)

  const existente = await prisma.documentoCalidadAcceso.findUnique({
    where: { documentoId_departamento: { documentoId, departamento } },
  })

  if (existente) {
    await prisma.documentoCalidadAcceso.delete({ where: { id: existente.id } })
  } else {
    await prisma.documentoCalidadAcceso.create({ data: { documentoId, departamento } })
  }

  // Revalidar tanto la página de calidad como la vista de documentos de cada dept
  const doc = await prisma.documentoCalidad.findUnique({
    where: { id: documentoId },
    select: { categoria: true },
  })
  if (doc) revalidatePath(`/calidad/${doc.categoria.toLowerCase()}s`)
  revalidatePath('/documentos')
}
