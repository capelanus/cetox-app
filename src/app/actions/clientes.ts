'use server'

import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import z from 'zod'

const ClienteSchema = z.object({
  razonSocial: z.string().min(2),
  ruc: z.string().min(8).max(11),
  direccion: z.string().min(2),
  contacto: z.string().optional(),
  email: z.string().optional(),
  telefono: z.string().optional(),
  modalidadPago: z.string(),
})

export async function crearCliente(formData: FormData) {
  await requireRol(['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'])

  const data = ClienteSchema.parse({
    razonSocial: formData.get('razonSocial'),
    ruc: formData.get('ruc'),
    direccion: formData.get('direccion'),
    contacto: formData.get('contacto') || undefined,
    email: formData.get('email') || undefined,
    telefono: formData.get('telefono') || undefined,
    modalidadPago: formData.get('modalidadPago'),
  })

  await prisma.cliente.create({ data })
  revalidatePath('/clientes')
  redirect('/clientes')
}

export async function actualizarCliente(id: string, formData: FormData) {
  await requireRol(['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'])

  const data = ClienteSchema.parse({
    razonSocial: formData.get('razonSocial'),
    ruc: formData.get('ruc'),
    direccion: formData.get('direccion'),
    contacto: formData.get('contacto') || undefined,
    email: formData.get('email') || undefined,
    telefono: formData.get('telefono') || undefined,
    modalidadPago: formData.get('modalidadPago'),
  })

  await prisma.cliente.update({ where: { id }, data })
  revalidatePath('/clientes')
  redirect('/clientes')
}

export async function toggleClienteActivo(id: string, activo: boolean) {
  await requireRol(['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'])
  await prisma.cliente.update({ where: { id }, data: { activo } })
  revalidatePath('/clientes')
}

export async function eliminarCliente(id: string) {
  await requireRol(['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'])
  await prisma.cliente.delete({ where: { id } })
  revalidatePath('/clientes')
  redirect('/clientes')
}
