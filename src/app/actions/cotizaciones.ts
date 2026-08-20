'use server'

import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/roles'
import { siguienteCorrelativo } from '@/lib/correlativo'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { addDays } from 'date-fns'

interface ItemRaw { ensayoId: string; costo: number; tiempoEntregaDias: number }
interface MuestraRaw {
  nombre: string
  indicacionQ: string | null
  indicacionB: string | null
  indicacionM: string | null
  items: ItemRaw[]
}

function parseMuestras(formData: FormData): MuestraRaw[] {
  const muestras: MuestraRaw[] = []
  let mi = 0
  while (formData.get(`muestras[${mi}][nombre]`) !== null) {
    const items: ItemRaw[] = []
    let ii = 0
    while (formData.get(`muestras[${mi}][items][${ii}][ensayoId]`)) {
      items.push({
        ensayoId: formData.get(`muestras[${mi}][items][${ii}][ensayoId]`) as string,
        costo: Number(formData.get(`muestras[${mi}][items][${ii}][costo]`)),
        tiempoEntregaDias: Number(formData.get(`muestras[${mi}][items][${ii}][tiempoEntregaDias]`)),
      })
      ii++
    }
    const g = (k: string) => (formData.get(`muestras[${mi}][${k}]`) as string) || null
    muestras.push({
      nombre: formData.get(`muestras[${mi}][nombre]`) as string,
      indicacionQ: g('indicacionQ'),
      indicacionB: g('indicacionB'),
      indicacionM: g('indicacionM'),
      items,
    })
    mi++
  }
  return muestras
}

function parseContacto(formData: FormData) {
  const s = (k: string) => (formData.get(k) as string) || null
  return {
    contactoNombre: s('contactoNombre'),
    contactoNombre2: s('contactoNombre2'),
    contactoNombre3: s('contactoNombre3'),
    contactoEmail: s('contactoEmail'),
    contactoEmail2: s('contactoEmail2'),
    contactoEmail3: s('contactoEmail3'),
    contactoTelefono: s('contactoTelefono'),
    contactoTelefono2: s('contactoTelefono2'),
    contactoTelefono3: s('contactoTelefono3'),
    contactoRuc: s('contactoRuc'),
    formaContacto: s('formaContacto'),
    fechaContacto: s('fechaContacto'),
    horaContacto: s('horaContacto'),
    paisOrigen: s('paisOrigen'),
  }
}

async function crearMuestrasConItems(cotizacionId: string, muestras: MuestraRaw[]) {
  for (const [orden, m] of muestras.entries()) {
    const muestra = await prisma.cotizacionMuestra.create({
      data: {
        cotizacionId,
        nombre: m.nombre,
        orden,
        indicacionQ: m.indicacionQ,
        indicacionB: m.indicacionB,
        indicacionM: m.indicacionM,
      },
    })
    if (m.items.length > 0) {
      await prisma.cotizacionItem.createMany({
        data: m.items.map((it) => ({
          cotizacionId,
          muestraId: muestra.id,
          ensayoId: it.ensayoId,
          costo: it.costo,
          tiempoEntregaDias: it.tiempoEntregaDias,
        })),
      })
    }
  }
}

export async function crearCotizacion(formData: FormData) {
  const session = await requireRol(['ADMINISTRACION', 'DIRECTOR_CALIDAD'])
  const anio = new Date().getFullYear()
  const numero = await siguienteCorrelativo('cotizacion', anio)

  const muestras = parseMuestras(formData)
  const allItems = muestras.flatMap((m) => m.items)
  const subtotal = allItems.reduce((s, it) => s + it.costo, 0)
  const igv = subtotal * 0.18
  const total = subtotal + igv

  const clienteId = formData.get('clienteId') as string
  const tipo = (formData.get('tipo') as string) || 'NORMAL'
  const estado = 'BORRADOR'

  const cot = await prisma.cotizacion.create({
    data: {
      numero,
      anio,
      sufijo: '',
      tipo,
      estado,
      moneda:        formData.get('moneda') as string,
      modalidadPago: (formData.get('modalidadPago') as string) || 'ANTICIPO_50_50',
      clienteId,
      observaciones: (formData.get('observaciones') as string) || null,
      ...parseContacto(formData),
      vigenciaHasta: addDays(new Date(), 30),
      creadoPorId:   session.user.id,
      subtotal,
      igv,
      total,
    },
  })

  await crearMuestrasConItems(cot.id, muestras)

  // ── Notificar a DIRECTOR_CALIDAD solo si la creó ADMINISTRACION ──
  if (session.user.rol === 'ADMINISTRACION') {
    const [cliente, directores] = await Promise.all([
      prisma.cliente.findUnique({ where: { id: clienteId }, select: { razonSocial: true } }),
      prisma.usuario.findMany({ where: { rol: 'DIRECTOR_CALIDAD', activo: true }, select: { id: true } }),
    ])
    if (directores.length > 0 && cliente) {
      const numFmt = `${String(numero).padStart(5, '0')}-${anio}`
      await prisma.notificacion.createMany({
        data: directores.map((u) => ({
          usuarioId: u.id,
          tipo:      'COTIZACION_NUEVA',
          titulo:    `Nueva cotización N° ${numFmt}`,
          mensaje:   `Administración registró la cotización N° ${numFmt} para ${cliente.razonSocial}.`,
          enlace:    `/cotizaciones/${cot.id}`,
        })),
      })
    }
  }

  revalidatePath('/cotizaciones')
  redirect(`/cotizaciones/${cot.id}`)
}

export async function editarCotizacion(id: string, formData: FormData) {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_CALIDAD'])

  const muestras = parseMuestras(formData)
  const allItems = muestras.flatMap((m) => m.items)
  const subtotal = allItems.reduce((s, it) => s + it.costo, 0)
  const igv = subtotal * 0.18
  const total = subtotal + igv

  // Delete existing items and muestras, then recreate
  await prisma.cotizacionItem.deleteMany({ where: { cotizacionId: id } })
  await prisma.cotizacionMuestra.deleteMany({ where: { cotizacionId: id } })

  await prisma.cotizacion.update({
    where: { id },
    data: {
      moneda:        formData.get('moneda') as string,
      modalidadPago: (formData.get('modalidadPago') as string) || 'ANTICIPO_50_50',
      clienteId:     formData.get('clienteId') as string,
      observaciones: (formData.get('observaciones') as string) || null,
      ...parseContacto(formData),
      subtotal,
      igv,
      total,
    },
  })

  await crearMuestrasConItems(id, muestras)

  revalidatePath('/cotizaciones')
  revalidatePath(`/cotizaciones/${id}`)
  redirect(`/cotizaciones/${id}`)
}

export async function cambiarEstadoCotizacion(
  id: string,
  estado: 'EN_REVISION' | 'ENVIADA' | 'REVISADO' | 'RECHAZADA'
) {
  const roles: Record<string, ('GERENTE_TECNICO' | 'DIRECTOR_CALIDAD' | 'ADMINISTRACION' | 'ANALISTA')[]> = {
    EN_REVISION: ['ADMINISTRACION', 'DIRECTOR_CALIDAD'],
    ENVIADA: ['DIRECTOR_CALIDAD'],
    REVISADO: ['DIRECTOR_CALIDAD'],
    RECHAZADA: ['DIRECTOR_CALIDAD'],
  }
  await requireRol(roles[estado])
  await prisma.cotizacion.update({ where: { id }, data: { estado } })
  revalidatePath('/cotizaciones')
  revalidatePath(`/cotizaciones/${id}`)
}

async function copiarCotizacion(
  original: { id: string; numero: number; anio: number; sufijo: string; moneda: string; clienteId: string; observaciones: string | null; contactoNombre: string | null; contactoNombre2: string | null; contactoNombre3: string | null; contactoEmail: string | null; contactoEmail2: string | null; contactoEmail3: string | null; contactoTelefono: string | null; contactoTelefono2: string | null; contactoTelefono3: string | null; contactoRuc: string | null; formaContacto: string | null; fechaContacto: string | null; horaContacto: string | null; paisOrigen: string | null; subtotal: number; igv: number; total: number },
  overrides: { numero?: number; sufijo?: string },
  creadoPorId: string
) {
  const muestras = await prisma.cotizacionMuestra.findMany({
    where: { cotizacionId: original.id },
    include: { items: true },
    orderBy: { orden: 'asc' },
  })

  const nueva = await prisma.cotizacion.create({
    data: {
      numero: overrides.numero ?? original.numero,
      anio: original.anio,
      sufijo: overrides.sufijo ?? original.sufijo,
      cotizacionPadre: original.id,
      moneda: original.moneda,
      clienteId: original.clienteId,
      observaciones: original.observaciones,
      contactoNombre: original.contactoNombre,
      contactoNombre2: original.contactoNombre2,
      contactoNombre3: original.contactoNombre3,
      contactoEmail: original.contactoEmail,
      contactoEmail2: original.contactoEmail2,
      contactoEmail3: original.contactoEmail3,
      contactoTelefono: original.contactoTelefono,
      contactoTelefono2: original.contactoTelefono2,
      contactoTelefono3: original.contactoTelefono3,
      contactoRuc: original.contactoRuc,
      formaContacto: original.formaContacto,
      fechaContacto: original.fechaContacto,
      horaContacto: original.horaContacto,
      paisOrigen: original.paisOrigen,
      vigenciaHasta: addDays(new Date(), 30),
      creadoPorId,
      subtotal: original.subtotal,
      igv: original.igv,
      total: original.total,
      estado: 'BORRADOR',
    },
  })

  if (muestras.length > 0) {
    await crearMuestrasConItems(
      nueva.id,
      muestras.map((m) => ({
        nombre: m.nombre,
        indicacionQ: m.indicacionQ,
        indicacionB: m.indicacionB,
        indicacionM: m.indicacionM,
        items: m.items.map((it) => ({
          ensayoId: it.ensayoId,
          costo: it.costo,
          tiempoEntregaDias: it.tiempoEntregaDias,
        })),
      }))
    )
  } else {
    // old cotizacion without muestras — copy flat items
    const items = await prisma.cotizacionItem.findMany({ where: { cotizacionId: original.id } })
    if (items.length > 0) {
      await prisma.cotizacionItem.createMany({
        data: items.map((it) => ({
          cotizacionId: nueva.id,
          ensayoId: it.ensayoId,
          costo: it.costo,
          tiempoEntregaDias: it.tiempoEntregaDias,
        })),
      })
    }
  }

  return nueva
}

export async function duplicarCotizacion(id: string) {
  const session = await requireRol(['ADMINISTRACION', 'DIRECTOR_CALIDAD'])
  const original = await prisma.cotizacion.findUniqueOrThrow({ where: { id } })

  const SUFIJOS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const existentes = await prisma.cotizacion.findMany({
    where: { numero: original.numero, anio: original.anio, sufijo: { not: '' } },
    select: { sufijo: true },
  })
  const usados = existentes.map((c) => c.sufijo)
  const siguienteSufijo = SUFIJOS.find((s) => !usados.includes(s))
  if (!siguienteSufijo) throw new Error('Se alcanzó el límite de duplicaciones')

  const nueva = await copiarCotizacion(original, { sufijo: siguienteSufijo }, session.user.id)
  revalidatePath('/cotizaciones')
  redirect(`/cotizaciones/${nueva.id}`)
}

/**
 * Crea una cotización completamente nueva (número consecutivo, sufijo vacío)
 * copiando todos los datos de la cotización original.
 */
export async function nuevaCotizacionDesde(id: string) {
  const session = await requireRol(['ADMINISTRACION', 'DIRECTOR_CALIDAD'])
  const original = await prisma.cotizacion.findUniqueOrThrow({ where: { id } })

  const anio = new Date().getFullYear()
  const numero = await siguienteCorrelativo('cotizacion', anio)

  const nueva = await copiarCotizacion(original, { numero, sufijo: '' }, session.user.id)
  revalidatePath('/cotizaciones')
  redirect(`/cotizaciones/${nueva.id}`)
}

export async function eliminarCotizacion(id: string) {
  const session = await requireRol(['ADMINISTRACION', 'DIRECTOR_CALIDAD'])

  const sets = await prisma.sET.count({ where: { cotizacionId: id } })
  if (sets > 0) throw new Error('No se puede eliminar: la cotización tiene SETs asociados.')

  await prisma.cotizacion.update({ where: { id }, data: { deletedAt: new Date(), deletedById: session.user.id } })

  revalidatePath('/cotizaciones')
  revalidatePath('/cotizaciones/papelera')
  redirect('/cotizaciones')
}

export async function restaurarCotizacion(id: string) {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_CALIDAD'])
  await prisma.cotizacion.update({ where: { id }, data: { deletedAt: null, deletedById: null } })
  revalidatePath('/cotizaciones')
  revalidatePath('/cotizaciones/papelera')
  redirect(`/cotizaciones/${id}`)
}

export async function eliminarDefinitivamente(id: string) {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_CALIDAD'])
  await prisma.cotizacionItem.deleteMany({ where: { cotizacionId: id } })
  await prisma.cotizacionMuestra.deleteMany({ where: { cotizacionId: id } })
  await prisma.cotizacion.delete({ where: { id } })
  revalidatePath('/cotizaciones/papelera')
  redirect('/cotizaciones/papelera')
}

export async function modificarCotizacionAceptada(id: string) {
  const session = await requireRol(['ADMINISTRACION', 'DIRECTOR_CALIDAD'])
  const original = await prisma.cotizacion.findUniqueOrThrow({ where: { id } })

  const SUFIJOS = ['A', 'B', 'C', 'D', 'E', 'F']
  const existentes = await prisma.cotizacion.findMany({
    where: { numero: original.numero, anio: original.anio, sufijo: { not: '' } },
    select: { sufijo: true },
  })
  const usados = existentes.map((c) => c.sufijo)
  const siguienteSufijo = SUFIJOS.find((s) => !usados.includes(s))
  if (!siguienteSufijo) throw new Error('Se alcanzó el límite de modificaciones')

  const nueva = await copiarCotizacion(original, { sufijo: siguienteSufijo }, session.user.id)
  revalidatePath('/cotizaciones')
  redirect(`/cotizaciones/${nueva.id}`)
}


export async function toggleInformeEnviado(cotizacionId: string) {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_CALIDAD'])
  const cot = await prisma.cotizacion.findUniqueOrThrow({
    where: { id: cotizacionId },
    select: { informeEnviado: true },
  })
  await prisma.cotizacion.update({
    where: { id: cotizacionId },
    data: { informeEnviado: !cot.informeEnviado },
  })
  revalidatePath('/cotizaciones')
}
