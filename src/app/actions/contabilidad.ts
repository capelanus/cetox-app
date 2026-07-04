'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const ROLES_GESTION = [
  'SUPER_ADMIN', 'GERENTE_GENERAL', 'GERENTE_TECNICO',
  'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION',
]

async function guard() {
  const session = await auth()
  if (!session) throw new Error('No autenticado')
  if (!ROLES_GESTION.includes(session.user.rol)) throw new Error('No autorizado')
  return session
}

const R = (p: string) => revalidatePath(p)
function revalTodo() {
  R('/gerencia/contabilidad')
  R('/gerencia/contabilidad/presupuesto')
  R('/gerencia/contabilidad/flujo-caja')
  R('/gerencia/contabilidad/centros-costo')
}

// ── Centros de costo ──────────────────────────────────────────────────────────

export async function crearCentroCosto(data: {
  codigo: string; nombre: string; departamento?: string; responsableId?: string
}) {
  await guard()
  await prisma.centroCosto.create({ data })
  R('/gerencia/contabilidad/centros-costo')
}

export async function actualizarCentroCosto(id: string, data: {
  codigo?: string; nombre?: string; departamento?: string | null; responsableId?: string | null; activo?: boolean
}) {
  await guard()
  await prisma.centroCosto.update({ where: { id }, data })
  R('/gerencia/contabilidad/centros-costo')
}

export async function eliminarCentroCosto(id: string) {
  await guard()
  await prisma.centroCosto.delete({ where: { id } })
  revalTodo()
}

// ── Partidas presupuestales ───────────────────────────────────────────────────

export async function crearPartida(data: {
  anio: number; tipo: string; categoria: string; concepto: string; centroCostoId?: string
}) {
  await guard()
  await prisma.partidaPresupuestal.create({ data })
  revalTodo()
}

export async function actualizarPartida(id: string, data: {
  categoria?: string; concepto?: string; centroCostoId?: string | null; tipo?: string
}) {
  await guard()
  await prisma.partidaPresupuestal.update({ where: { id }, data })
  revalTodo()
}

export async function eliminarPartida(id: string) {
  await guard()
  await prisma.partidaPresupuestal.delete({ where: { id } })
  revalTodo()
}

export async function guardarLinea(data: {
  partidaId: string; periodo: number; planificado: number; ejecutado: number
}) {
  await guard()
  await prisma.lineaPresupuesto.upsert({
    where: { partidaId_periodo: { partidaId: data.partidaId, periodo: data.periodo } },
    create: data,
    update: { planificado: data.planificado, ejecutado: data.ejecutado },
  })
  revalTodo()
}

// ── Rentabilidad ──────────────────────────────────────────────────────────────

export async function crearRentabilidad(data: {
  anio: number; periodo: number; clienteNombre: string; servicio: string
  clienteId?: string; ingreso: number; costoDirecto: number; costoIndirecto: number; comentario?: string
}) {
  await guard()
  await prisma.registroRentabilidad.create({ data })
  R('/gerencia/contabilidad/rentabilidad')
  R('/gerencia/contabilidad')
}

export async function actualizarRentabilidad(id: string, data: {
  anio?: number; periodo?: number; clienteNombre?: string; servicio?: string
  clienteId?: string | null; ingreso?: number; costoDirecto?: number; costoIndirecto?: number; comentario?: string
}) {
  await guard()
  await prisma.registroRentabilidad.update({ where: { id }, data })
  R('/gerencia/contabilidad/rentabilidad')
  R('/gerencia/contabilidad')
}

export async function eliminarRentabilidad(id: string) {
  await guard()
  await prisma.registroRentabilidad.delete({ where: { id } })
  R('/gerencia/contabilidad/rentabilidad')
  R('/gerencia/contabilidad')
}

// ── Documentos financieros ────────────────────────────────────────────────────

export async function registrarDocumento(data: {
  nombre: string; url: string; categoria?: string; tamano?: number
  centroCostoId?: string; anio?: number; periodo?: number
}) {
  const session = await guard()
  await prisma.documentoFinanciero.create({ data: { ...data, subidoPorId: session.user.id } })
  R('/gerencia/contabilidad/documentos')
  R('/gerencia/contabilidad')
}

export async function eliminarDocumento(id: string) {
  await guard()
  await prisma.documentoFinanciero.delete({ where: { id } })
  R('/gerencia/contabilidad/documentos')
  R('/gerencia/contabilidad')
}
