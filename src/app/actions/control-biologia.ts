'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Roles que pueden EDITAR el control (Calidad solo visualiza)
const ROLES_EDIT = ['SUPER_ADMIN', 'GERENTE_GENERAL', 'GERENTE_TECNICO']

// Verifica permiso de edición: rol de gerencia, o jefe de laboratorio de Biología.
async function guard() {
  const session = await auth()
  if (!session) throw new Error('No autenticado')
  if (ROLES_EDIT.includes(session.user.rol)) return session
  const me = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: { esJefeLab: true, area: true },
  })
  if (me?.esJefeLab && me.area === 'B') return session
  throw new Error('No autorizado')
}

function optDate(v?: string | null): Date | null {
  return v ? new Date(v) : null
}

const R = () => revalidatePath('/biologia/control-odas')

export async function crearControlBio(data: {
  formulacion?: string; setNumero?: string; odaNumero?: string; prueba?: string
  entregado?: boolean; fechaEntrega?: string; observacion?: string; formato?: string; fechaRecepcion?: string
}) {
  await guard()
  const { fechaEntrega, fechaRecepcion, ...rest } = data
  await prisma.controlOdaBiologia.create({
    data: { ...rest, fechaEntrega: optDate(fechaEntrega), fechaRecepcion: optDate(fechaRecepcion) },
  })
  R()
}

export async function actualizarControlBio(id: string, data: {
  formulacion?: string | null; setNumero?: string | null; odaNumero?: string | null; prueba?: string | null
  entregado?: boolean; fechaEntrega?: string | null; observacion?: string | null; formato?: string | null; fechaRecepcion?: string | null
}) {
  await guard()
  const { fechaEntrega, fechaRecepcion, ...rest } = data
  await prisma.controlOdaBiologia.update({
    where: { id },
    data: {
      ...rest,
      ...(fechaEntrega !== undefined ? { fechaEntrega: optDate(fechaEntrega) } : {}),
      ...(fechaRecepcion !== undefined ? { fechaRecepcion: optDate(fechaRecepcion) } : {}),
    },
  })
  R()
}

export async function toggleEntregadoBio(id: string) {
  await guard()
  const row = await prisma.controlOdaBiologia.findUnique({ where: { id }, select: { entregado: true } })
  if (!row) throw new Error('No encontrado')
  await prisma.controlOdaBiologia.update({
    where: { id },
    data: { entregado: !row.entregado, ...(!row.entregado && { fechaEntrega: new Date() }) },
  })
  R()
}

export async function eliminarControlBio(id: string) {
  await guard()
  await prisma.controlOdaBiologia.delete({ where: { id } })
  R()
}
