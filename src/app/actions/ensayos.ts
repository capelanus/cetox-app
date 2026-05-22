'use server'

import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import z from 'zod'

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
  await requireRol(['DIRECTOR_CALIDAD', 'GERENTE_TECNICO', 'ADMINISTRACION'])
  const data = parseEnsayo(formData)
  await prisma.ensayo.create({ data })
  revalidatePath('/ensayos')
  redirect('/ensayos')
}

export async function actualizarEnsayo(id: string, formData: FormData) {
  await requireRol(['DIRECTOR_CALIDAD', 'GERENTE_TECNICO', 'ADMINISTRACION'])
  const data = parseEnsayo(formData)
  await prisma.ensayo.update({ where: { id }, data })
  revalidatePath('/ensayos')
  redirect('/ensayos')
}

export async function toggleEnsayoActivo(id: string, activo: boolean) {
  await requireRol(['DIRECTOR_CALIDAD', 'GERENTE_TECNICO', 'ADMINISTRACION'])
  await prisma.ensayo.update({ where: { id }, data: { activo } })
  revalidatePath('/ensayos')
}
