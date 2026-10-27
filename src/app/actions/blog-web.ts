'use server'

import { prisma } from '@/lib/prisma'
import { requireRol, ROLES_BLOG_WEB } from '@/lib/roles'
import { revalidatePath } from 'next/cache'

export interface DatosRevision {
  revisorNombre: string
  revisorCargo: string
  revisorColegiatura: string
  fechaRevision: string // yyyy-mm-dd o ''
  notaInterna: string
}

function limpiar(v: string | undefined): string | null {
  const s = (v ?? '').replace(/\s+/g, ' ').trim().slice(0, 200)
  return s || null
}

// Guarda la autoría científica de un artículo. El artículo pasa a REVISADO
// solo cuando nombre, cargo, colegiatura y fecha están completos; mientras
// falte algo queda PENDIENTE y la web sigue mostrando "revisión pendiente".
export async function guardarRevisionBlog(id: string, datos: DatosRevision) {
  const session = await requireRol(ROLES_BLOG_WEB)

  const revisorNombre = limpiar(datos.revisorNombre)
  const revisorCargo = limpiar(datos.revisorCargo)
  const revisorColegiatura = limpiar(datos.revisorColegiatura)
  const notaInterna = (datos.notaInterna ?? '').trim().slice(0, 2000) || null

  let fechaRevision: Date | null = null
  if (datos.fechaRevision) {
    const d = new Date(`${datos.fechaRevision}T12:00:00`)
    if (Number.isNaN(d.getTime())) return { ok: false as const, error: 'Fecha de revisión inválida.' }
    fechaRevision = d
  }

  const completo = Boolean(revisorNombre && revisorCargo && revisorColegiatura && fechaRevision)
  const estado = completo ? 'REVISADO' : 'PENDIENTE'

  await prisma.blogArticulo.update({
    where: { id },
    data: {
      revisorNombre, revisorCargo, revisorColegiatura, fechaRevision, notaInterna, estado,
      actualizadoPor: session.user.name ?? null,
    },
  })

  revalidatePath('/administracion/blog-web')
  return { ok: true as const, estado }
}
