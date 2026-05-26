'use server'

import { prisma } from '@/lib/prisma'
import { requireOperaciones } from '@/lib/roles'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function trim(s: FormData, key: string): string | null {
  const v = (s.get(key) as string ?? '').trim()
  return v.length > 0 ? v : null
}

export async function crearProveedor(formData: FormData) {
  await requireOperaciones()

  const razonSocial = trim(formData, 'razonSocial')
  if (!razonSocial) throw new Error('Razón social es requerida')

  const proveedor = await prisma.proveedor.create({
    data: {
      razonSocial,
      ruc:            trim(formData, 'ruc'),
      especialidad:   trim(formData, 'especialidad'),
      direccion:      trim(formData, 'direccion'),
      contacto:       trim(formData, 'contacto'),
      telefono:       trim(formData, 'telefono'),
      telefono2:      trim(formData, 'telefono2'),
      telefono3:      trim(formData, 'telefono3'),
      email:          trim(formData, 'email'),
      email2:         trim(formData, 'email2'),
      email3:         trim(formData, 'email3'),
      cuentaBancaria: trim(formData, 'cuentaBancaria'),
    },
  })

  revalidatePath('/operaciones/proveedores')
  redirect(`/operaciones/proveedores/${proveedor.id}`)
}

export async function actualizarProveedor(id: string, formData: FormData) {
  await requireOperaciones()

  const razonSocial = trim(formData, 'razonSocial')
  if (!razonSocial) throw new Error('Razón social es requerida')

  await prisma.proveedor.update({
    where: { id },
    data: {
      razonSocial,
      ruc:            trim(formData, 'ruc'),
      especialidad:   trim(formData, 'especialidad'),
      direccion:      trim(formData, 'direccion'),
      contacto:       trim(formData, 'contacto'),
      telefono:       trim(formData, 'telefono'),
      telefono2:      trim(formData, 'telefono2'),
      telefono3:      trim(formData, 'telefono3'),
      email:          trim(formData, 'email'),
      email2:         trim(formData, 'email2'),
      email3:         trim(formData, 'email3'),
      cuentaBancaria: trim(formData, 'cuentaBancaria'),
    },
  })

  revalidatePath('/operaciones/proveedores')
  revalidatePath(`/operaciones/proveedores/${id}`)
  redirect(`/operaciones/proveedores/${id}`)
}

export async function toggleProveedorActivo(id: string, activo: boolean) {
  await requireOperaciones()
  await prisma.proveedor.update({ where: { id }, data: { activo } })
  revalidatePath('/operaciones/proveedores')
  revalidatePath(`/operaciones/proveedores/${id}`)
}
