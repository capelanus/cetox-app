'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export interface MensajeEnviado {
  id:            string
  contenido:     string
  archivoUrl:    string | null
  archivoNombre: string | null
  archivoTipo:   string | null
  createdAt:     string
  autorId:       string
  autor:         { nombre: string; rol: string }
}

function ordenarUsuarios(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a]
}

async function obtenerConversacion(userId: string, otroUsuarioId: string) {
  const [usuarioAId, usuarioBId] = ordenarUsuarios(userId, otroUsuarioId)
  return prisma.conversacionDM.upsert({
    where:  { usuarioAId_usuarioBId: { usuarioAId, usuarioBId } },
    create: { usuarioAId, usuarioBId },
    update: {},
  })
}

export async function enviarMensaje(
  destinatarioId: string,
  contenido:     string,
  archivoUrl?:   string | null,
  archivoNombre?: string | null,
  archivoTipo?:  string | null,
): Promise<MensajeEnviado> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')
  if (destinatarioId === session.user.id) throw new Error('No puedes enviarte mensajes a ti mismo')

  const text = contenido.trim()
  if (!archivoUrl && (!text || text.length > 2000)) throw new Error('Mensaje inválido')

  const conv = await obtenerConversacion(session.user.id, destinatarioId)

  const msg = await prisma.mensajeDM.create({
    data: {
      conversacionId: conv.id,
      autorId:        session.user.id,
      contenido:      text,
      archivoUrl:     archivoUrl    ?? null,
      archivoNombre:  archivoNombre ?? null,
      archivoTipo:    archivoTipo   ?? null,
    },
    include: { autor: { select: { nombre: true, rol: true } } },
  })

  return {
    id:            msg.id,
    contenido:     msg.contenido,
    archivoUrl:    msg.archivoUrl,
    archivoNombre: msg.archivoNombre,
    archivoTipo:   msg.archivoTipo,
    createdAt:     msg.createdAt.toISOString(),
    autorId:       msg.autorId,
    autor:         msg.autor,
  }
}
