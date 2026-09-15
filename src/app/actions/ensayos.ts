'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client'
import { requireRol } from '@/lib/roles'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import z from 'zod'

function esCodigoDuplicado(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
}

const EnsayoSchema = z.object({
  codigo: z.string().min(2),
  nombre: z.string().min(2),
  prefijoInforme: z.string().min(1),
  area: z.string(),
  metodoNorma: z.string().min(2),
  costoUSD: z.number().optional(),
  costoPEN: z.number().optional(),
  tiempoEntregaDias: z.number().int().positive(),
  acreditadoINACAL: z.boolean(),
  tercerizado: z.boolean(),
  tipoMuestra: z.string().optional(),
  plantillaWord: z.string().optional(),
})

function parseEnsayo(formData: FormData) {
  return EnsayoSchema.parse({
    codigo: formData.get('codigo'),
    nombre: formData.get('nombre'),
    prefijoInforme: formData.get('prefijoInforme'),
    area: formData.get('area'),
    metodoNorma: formData.get('metodoNorma'),
    costoUSD: formData.get('costoUSD') ? Number(formData.get('costoUSD')) : undefined,
    costoPEN: formData.get('costoPEN') ? Number(formData.get('costoPEN')) : undefined,
    tiempoEntregaDias: Number(formData.get('tiempoEntregaDias')),
    acreditadoINACAL: formData.get('acreditadoINACAL') === 'true',
    tercerizado: formData.get('tercerizado') === 'true',
    tipoMuestra: formData.get('tipoMuestra') || undefined,
    plantillaWord: formData.get('plantillaWord') || undefined,
  })
}

export async function crearEnsayo(formData: FormData) {
  await requireRol(['DIRECTOR_CALIDAD', 'COORDINADOR_CALIDAD'])
  const data = parseEnsayo(formData)
  try {
    await prisma.ensayo.create({ data })
  } catch (e) {
    if (esCodigoDuplicado(e)) throw new Error(`Ya existe un ensayo con el código "${data.codigo}". Usa otro código.`)
    throw e
  }
  revalidatePath('/ensayos')
  redirect('/ensayos')
}

export async function actualizarEnsayo(id: string, formData: FormData) {
  await requireRol(['DIRECTOR_CALIDAD', 'COORDINADOR_CALIDAD'])
  const data = parseEnsayo(formData)
  try {
    await prisma.ensayo.update({ where: { id }, data })
  } catch (e) {
    if (esCodigoDuplicado(e)) throw new Error(`Ya existe un ensayo con el código "${data.codigo}". Usa otro código.`)
    throw e
  }
  revalidatePath('/ensayos')
  redirect('/ensayos')
}

export async function toggleEnsayoActivo(id: string, activo: boolean) {
  await requireRol(['DIRECTOR_CALIDAD', 'COORDINADOR_CALIDAD'])
  await prisma.ensayo.update({ where: { id }, data: { activo } })
  revalidatePath('/ensayos')
}
