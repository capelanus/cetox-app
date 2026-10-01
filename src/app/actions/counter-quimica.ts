'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { compare } from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { formatNumSET } from '@/lib/format'

// Counter de Química: la tablet del mostrador queda con una sesión fija y cada
// acto (dejar / recepcionar) lo firma una persona distinta con su PIN. Por eso
// las acciones no confían en la sesión para saber QUIÉN actúa: solo la usan
// para comprobar que la tablet está autenticada.
//
// Devuelven { ok, error } en vez de lanzar: en producción Next oculta el
// mensaje de los errores lanzados en server actions, y aquí el mensaje
// ("PIN incorrecto", "ya fue recepcionada") es justo lo que la persona
// necesita leer en la tablet.

const AREA = 'Q'
const ROLES_ENTREGAN = ['ADMINISTRACION', 'DIRECTOR_CALIDAD', 'COORDINADOR_CALIDAD', 'SUPER_ADMIN']
const ROLES_TABLET = [...ROLES_ENTREGAN, 'ANALISTA', 'GERENTE_TECNICO', 'GERENTE_GENERAL']

// Bloqueo tras intentos fallidos. Un PIN de 4 dígitos se adivina en segundos
// sin esto. Proceso único (1 réplica), así que un Map en memoria basta.
const MAX_INTENTOS = 5
const BLOQUEO_MS = 60_000
const intentos = new Map<string, { fallos: number; bloqueadoHasta: number }>()

export interface Firmante { id: string; nombre: string }
export type ResultadoCounter = { ok: true; firmante: Firmante } | { ok: false; error: string }

class CounterError extends Error {}

async function sesionTablet() {
  const session = await auth()
  if (!session?.user?.id) throw new CounterError('La tablet no tiene sesión iniciada.')
  if (!ROLES_TABLET.includes(session.user.rol)) throw new CounterError('Esta cuenta no puede operar el counter.')
  return session
}

async function firmarConPin(
  pin: string,
  quien: { roles?: string[]; area?: string },
  claveBloqueo: string,
): Promise<Firmante> {
  if (!/^\d{4}$/.test(pin)) throw new CounterError('El PIN son 4 dígitos.')

  const ahora = Date.now()
  const estado = intentos.get(claveBloqueo)
  if (estado && estado.bloqueadoHasta > ahora) {
    const seg = Math.ceil((estado.bloqueadoHasta - ahora) / 1000)
    throw new CounterError(`Demasiados intentos. Espera ${seg} segundos.`)
  }

  const candidatos = await prisma.usuario.findMany({
    where: {
      activo: true,
      pinHash: { not: null },
      ...(quien.roles ? { rol: { in: quien.roles } } : {}),
      ...(quien.area ? { area: quien.area } : {}),
    },
    select: { id: true, nombre: true, pinHash: true },
  })

  for (const u of candidatos) {
    if (u.pinHash && (await compare(pin, u.pinHash))) {
      intentos.delete(claveBloqueo)
      return { id: u.id, nombre: u.nombre }
    }
  }

  const fallos = (estado?.fallos ?? 0) + 1
  intentos.set(claveBloqueo, {
    fallos,
    bloqueadoHasta: fallos >= MAX_INTENTOS ? ahora + BLOQUEO_MS : 0,
  })
  throw new CounterError(
    fallos >= MAX_INTENTOS
      ? 'PIN incorrecto. Counter bloqueado un minuto.'
      : `PIN incorrecto (${MAX_INTENTOS - fallos} intento(s) más).`,
  )
}

async function conResultado(fn: () => Promise<Firmante>): Promise<ResultadoCounter> {
  try {
    return { ok: true, firmante: await fn() }
  } catch (e) {
    if (e instanceof CounterError) return { ok: false, error: e.message }
    console.error('[counter-quimica]', e)
    return { ok: false, error: 'No se pudo registrar. Inténtalo de nuevo.' }
  }
}

// Acepta lo que lee la cámara ("SET-0012-2026") o lo que tipea alguien ("12").
function parsearCodigo(texto: string): { numero: number; anio?: number } | null {
  const limpio = texto.trim().toUpperCase()
  const completo = limpio.match(/^SET-?0*(\d+)-(\d{4})$/)
  if (completo) return { numero: parseInt(completo[1]), anio: parseInt(completo[2]) }
  const solo = limpio.match(/^(?:MU-?)?0*(\d+)$/)
  if (solo) return { numero: parseInt(solo[1]) }
  return null
}

export async function buscarMuestraPorCodigo(codigo: string) {
  try {
    await sesionTablet()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Sin sesión.' }
  }
  const parsed = parsearCodigo(codigo)
  if (!parsed) return { error: 'Código no reconocido. Debe ser el código de la etiqueta (p. ej. SET-0012-2026).' }

  const sets = await prisma.sET.findMany({
    where: {
      numero: parsed.numero,
      ...(parsed.anio ? { anio: parsed.anio } : {}),
      estado: { not: 'ANULADO' },
    },
    orderBy: { anio: 'desc' },
    take: 1,
    include: {
      cliente: { select: { razonSocial: true } },
      odas: { where: { area: AREA }, include: { items: { include: { ensayo: { select: { nombre: true } } } } } },
    },
  })
  const set = sets[0]
  if (!set) return { error: `No existe la muestra ${codigo.trim()}.` }
  if (set.odas.length === 0) return { error: `${formatNumSET(set.numero, set.anio)} no tiene ensayos de Química.` }

  return {
    set: {
      id: set.id,
      codigo: formatNumSET(set.numero, set.anio),
      nombreComercial: set.nombreComercial,
      tipoMuestra: set.tipoMuestra,
      numeroMuestras: set.numeroMuestras,
      cliente: set.cliente.razonSocial,
    },
    odas: set.odas.map(o => ({
      id: o.id,
      numero: o.numero,
      anio: o.anio,
      estado: o.estado,
      ensayos: o.items.map(i => i.ensayo.nombre),
      fechaEntregaLab: o.fechaEntregaLab?.toISOString() ?? null,
      fechaRecepcion: o.fechaRecepcion?.toISOString() ?? null,
    })),
  }
}

export async function dejarMuestraEnCounter(odaId: string, pin: string): Promise<ResultadoCounter> {
  return conResultado(async () => {
    const session = await sesionTablet()
    const firmante = await firmarConPin(pin, { roles: ROLES_ENTREGAN }, `dejar:${session.user.id}`)

    const oda = await prisma.oDA.findUnique({
      where: { id: odaId },
      select: { area: true, estado: true, set: { select: { numero: true, anio: true, nombreComercial: true } } },
    })
    if (!oda) throw new CounterError('La ODA no existe.')
    if (oda.area !== AREA) throw new CounterError('Esta ODA no es de Química.')
    if (oda.estado !== 'EMITIDA') throw new CounterError('Esta muestra ya fue dejada o recepcionada.')

    await prisma.oDA.update({
      where: { id: odaId },
      data: { estado: 'ENTREGADA_LAB', fechaEntregaLab: new Date(), entregadaPorId: firmante.id },
    })

    // Aviso a Química de que hay muestra esperando en el mostrador.
    const analistas = await prisma.usuario.findMany({
      where: { rol: 'ANALISTA', area: AREA, activo: true },
      select: { id: true },
    })
    if (analistas.length > 0) {
      const codigo = formatNumSET(oda.set.numero, oda.set.anio)
      await prisma.notificacion.createMany({
        data: analistas.map(a => ({
          usuarioId: a.id,
          tipo: 'MUESTRA_EN_COUNTER',
          titulo: `Muestra ${codigo} en el counter`,
          mensaje: `${firmante.nombre} dejó "${oda.set.nombreComercial ?? codigo}" para recepcionar.`,
          enlace: `/oda/${odaId}`,
        })),
      })
    }

    revalidatePath('/oda')
    revalidatePath(`/oda/${odaId}`)
    revalidatePath('/counter/quimica')
    revalidatePath('/quimica/entregas')
    return firmante
  })
}

export async function recepcionarMuestraEnCounter(odaId: string, pin: string): Promise<ResultadoCounter> {
  return conResultado(async () => {
    const session = await sesionTablet()
    const firmante = await firmarConPin(pin, { roles: ['ANALISTA'], area: AREA }, `recibir:${session.user.id}`)

    const oda = await prisma.oDA.findUnique({ where: { id: odaId }, select: { area: true, estado: true } })
    if (!oda) throw new CounterError('La ODA no existe.')
    if (oda.area !== AREA) throw new CounterError('Esta ODA no es de Química.')
    if (oda.estado === 'EMITIDA') throw new CounterError('Administración todavía no dejó esta muestra en el counter.')
    if (oda.estado !== 'ENTREGADA_LAB') throw new CounterError('Esta muestra ya fue recepcionada.')

    await prisma.oDA.update({
      where: { id: odaId },
      data: { estado: 'RECIBIDA', fechaRecepcion: new Date(), recibidaPorId: firmante.id },
    })

    revalidatePath('/oda')
    revalidatePath(`/oda/${odaId}`)
    revalidatePath('/counter/quimica')
    revalidatePath('/quimica/entregas')
    return firmante
  })
}
