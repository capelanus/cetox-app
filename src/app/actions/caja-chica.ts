'use server'

import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { put } from '@vercel/blob'

// ── Gastos ────────────────────────────────────────────────────────────────────

export async function registrarGasto(formData: FormData) {
  const session = await requireRol(['DIRECTOR_CALIDAD'])

  const concepto      = (formData.get('concepto')      as string).trim()
  const monto         = parseFloat(formData.get('monto') as string)
  const moneda        = (formData.get('moneda')        as string) || 'PEN'
  const categoria     = (formData.get('categoria')     as string) || null
  const notas         = (formData.get('notas')         as string) || null
  const fechaStr      = (formData.get('fecha')         as string)
  const fecha         = fechaStr ? new Date(fechaStr) : new Date()
  const numeroFactura = (formData.get('numeroFactura') as string) || null

  const { proveedorId, proveedorNombre, proveedorRuc } = await resolverProveedor(formData)

  let comprob: string | null = null
  const file = formData.get('comprobante') as File | null
  if (file && file.size > 0) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const blob = await put(`caja-chica/${Date.now()}-${safeName}`, file, { access: 'public' })
    comprob = blob.url
  }

  await prisma.cajaChicaGasto.create({
    data: {
      concepto, monto, moneda, categoria, notas, fecha, numeroFactura,
      proveedorId, proveedorNombre, proveedorRuc,
      comprobante: comprob,
      creadoPorId: session.user.id,
    },
  })

  revalidatePath('/caja-chica')
  redirect('/caja-chica')
}

export async function editarGasto(id: string, formData: FormData) {
  await requireRol(['DIRECTOR_CALIDAD'])

  const concepto      = (formData.get('concepto')      as string).trim()
  const monto         = parseFloat(formData.get('monto') as string)
  const moneda        = (formData.get('moneda')        as string) || 'PEN'
  const categoria     = (formData.get('categoria')     as string) || null
  const notas         = (formData.get('notas')         as string) || null
  const fechaStr      = (formData.get('fecha')         as string)
  const fecha         = fechaStr ? new Date(fechaStr) : new Date()
  const numeroFactura = (formData.get('numeroFactura') as string) || null

  const { proveedorId, proveedorNombre, proveedorRuc } = await resolverProveedor(formData)

  // Solo reemplaza comprobante si se sube un archivo nuevo
  const file = formData.get('comprobante') as File | null
  let comprob: string | undefined = undefined
  if (file && file.size > 0) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const blob = await put(`caja-chica/${Date.now()}-${safeName}`, file, { access: 'public' })
    comprob = blob.url
  }

  await prisma.cajaChicaGasto.update({
    where: { id },
    data: {
      concepto, monto, moneda, categoria, notas, fecha, numeroFactura,
      proveedorId, proveedorNombre, proveedorRuc,
      ...(comprob !== undefined ? { comprobante: comprob } : {}),
    },
  })

  revalidatePath('/caja-chica')
  redirect('/caja-chica')
}

export async function eliminarGasto(id: string) {
  await requireRol(['DIRECTOR_CALIDAD'])
  await prisma.cajaChicaGasto.delete({ where: { id } })
  revalidatePath('/caja-chica')
}

// ── Ingresos ──────────────────────────────────────────────────────────────────

export async function registrarIngreso(formData: FormData) {
  const session = await requireRol(['DIRECTOR_CALIDAD'])

  const descripcion = (formData.get('descripcion') as string).trim()
  const monto       = parseFloat(formData.get('monto') as string)
  const moneda      = (formData.get('moneda')      as string) || 'PEN'
  const fechaStr    = (formData.get('fecha')        as string)
  const fecha       = fechaStr ? new Date(fechaStr) : new Date()

  await prisma.cajaChicaIngreso.create({
    data: { descripcion, monto, moneda, fecha, creadoPorId: session.user.id },
  })

  revalidatePath('/caja-chica')
  redirect('/caja-chica')
}

export async function eliminarIngreso(id: string) {
  await requireRol(['DIRECTOR_CALIDAD'])
  await prisma.cajaChicaIngreso.delete({ where: { id } })
  revalidatePath('/caja-chica')
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function resolverProveedor(formData: FormData) {
  const sel = (formData.get('proveedorSeleccionado') as string) || ''
  let proveedorId:     string | null = null
  let proveedorNombre: string | null = null
  let proveedorRuc:    string | null = null

  if (sel && sel !== 'otro') {
    const prov = await prisma.proveedor.findUnique({
      where: { id: sel },
      select: { razonSocial: true, ruc: true },
    })
    if (prov) {
      proveedorId     = sel
      proveedorNombre = prov.razonSocial
      proveedorRuc    = prov.ruc ?? null
    }
  } else if (sel === 'otro') {
    proveedorNombre = (formData.get('otroProveedorNombre') as string) || null
    proveedorRuc    = (formData.get('otroProveedorRuc')    as string) || null
  }

  return { proveedorId, proveedorNombre, proveedorRuc }
}
