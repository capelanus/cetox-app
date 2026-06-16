'use server'

import { prisma } from '@/lib/prisma'
import { requireOperaciones } from '@/lib/roles'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function crearInventarioItem(formData: FormData) {
  await requireOperaciones()

  const codOrden    = (formData.get('codOrden') as string)?.trim() || null
  const descripcion = (formData.get('descripcion') as string)?.trim()
  const unidad      = (formData.get('unidad') as string)?.trim() || null
  const categoria   = (formData.get('categoria') as string)?.trim() || null
  const stock       = parseFloat(formData.get('stock') as string) || 0
  const stockMinimo = formData.get('stockMinimo') ? parseFloat(formData.get('stockMinimo') as string) : null
  const notas       = (formData.get('notas') as string)?.trim() || null

  if (!descripcion) throw new Error('La descripción es requerida')

  const item = await prisma.inventarioItem.create({
    data: { codOrden, descripcion, unidad, categoria, stock, stockMinimo, notas },
  })

  revalidatePath('/operaciones/inventario')
  redirect(`/operaciones/inventario/${item.id}`)
}

export async function actualizarInventarioItem(id: string, formData: FormData) {
  await requireOperaciones()

  const codOrden    = (formData.get('codOrden') as string)?.trim() || null
  const descripcion = (formData.get('descripcion') as string)?.trim()
  const unidad      = (formData.get('unidad') as string)?.trim() || null
  const categoria   = (formData.get('categoria') as string)?.trim() || null
  const stock       = parseFloat(formData.get('stock') as string) || 0
  const stockMinimo = formData.get('stockMinimo') ? parseFloat(formData.get('stockMinimo') as string) : null
  const notas       = (formData.get('notas') as string)?.trim() || null
  const activo      = formData.get('activo') !== 'false'

  if (!descripcion) throw new Error('La descripción es requerida')

  await prisma.inventarioItem.update({
    where: { id },
    data: { codOrden, descripcion, unidad, categoria, stock, stockMinimo, notas, activo },
  })

  revalidatePath('/operaciones/inventario')
  revalidatePath(`/operaciones/inventario/${id}`)
  redirect(`/operaciones/inventario/${id}`)
}

export async function ajustarStock(id: string, formData: FormData) {
  const session = await requireOperaciones()

  const tipo        = formData.get('tipo') as 'ENTRADA' | 'SALIDA' | 'AJUSTE'
  const cantidad    = parseFloat(formData.get('cantidad') as string)
  const areaDestino = (formData.get('areaDestino') as string) || null
  const descripcion = (formData.get('descripcion') as string) || null

  if (!cantidad || cantidad <= 0) throw new Error('Cantidad inválida')

  const item = await prisma.inventarioItem.findUnique({ where: { id } })
  if (!item) throw new Error('Ítem no encontrado')

  const stockAnterior = item.stock
  let nuevoStock: number
  if (tipo === 'ENTRADA') {
    nuevoStock = item.stock + cantidad
  } else if (tipo === 'SALIDA') {
    nuevoStock = Math.max(0, item.stock - cantidad)
  } else {
    nuevoStock = cantidad // AJUSTE = set directo
  }

  await prisma.$transaction([
    prisma.inventarioItem.update({ where: { id }, data: { stock: nuevoStock } }),
    prisma.inventarioMovimiento.create({
      data: {
        inventarioItemId: id,
        tipo,
        cantidad,
        stockAnterior,
        stockNuevo: nuevoStock,
        areaDestino,
        descripcion,
        usuarioId: session.user.id,
      },
    }),
  ])

  revalidatePath('/operaciones/inventario')
  revalidatePath(`/operaciones/inventario/${id}`)
  redirect(`/operaciones/inventario/${id}`)
}

export async function eliminarInventarioItem(id: string) {
  await requireOperaciones()

  await prisma.inventarioItem.delete({ where: { id } })

  revalidatePath('/operaciones/inventario')
  redirect('/operaciones/inventario')
}
