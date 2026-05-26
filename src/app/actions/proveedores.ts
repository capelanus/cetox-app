'use server'

import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function crearProveedor(formData: FormData) {
  await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  const razonSocial = formData.get('razonSocial') as string
  const ruc = formData.get('ruc') as string
  const direccion = formData.get('direccion') as string
  const contacto = formData.get('contacto') as string
  const email = formData.get('email') as string
  const telefono = formData.get('telefono') as string
  const rubro = formData.get('rubro') as string

  if (!razonSocial || !ruc) throw new Error('Razón social y RUC son requeridos')

  const proveedor = await prisma.proveedor.create({
    data: { razonSocial, ruc, direccion: direccion || null, contacto: contacto || null, email: email || null, telefono: telefono || null, rubro: rubro || null },
  })
  revalidatePath('/operaciones/proveedores')
  redirect(`/operaciones/proveedores/${proveedor.id}`)
}

export async function actualizarProveedor(id: string, formData: FormData) {
  await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  const razonSocial = formData.get('razonSocial') as string
  const ruc = formData.get('ruc') as string
  const direccion = formData.get('direccion') as string
  const contacto = formData.get('contacto') as string
  const email = formData.get('email') as string
  const telefono = formData.get('telefono') as string
  const rubro = formData.get('rubro') as string

  await prisma.proveedor.update({
    where: { id },
    data: { razonSocial, ruc, direccion: direccion || null, contacto: contacto || null, email: email || null, telefono: telefono || null, rubro: rubro || null },
  })
  revalidatePath('/operaciones/proveedores')
  revalidatePath(`/operaciones/proveedores/${id}`)
  redirect(`/operaciones/proveedores/${id}`)
}

export async function toggleProveedorActivo(id: string, activo: boolean) {
  await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  await prisma.proveedor.update({ where: { id }, data: { activo } })
  revalidatePath('/operaciones/proveedores')
}
