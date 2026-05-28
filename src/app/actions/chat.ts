'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const CANALES_NOMBRES: Record<string, string> = {
  general:        'General',
  gerencia:       'Gerencia',
  administracion: 'Administración',
  operaciones:    'Operaciones',
  calidad:        'Calidad',
  biologia:       'Biología',
  quimica:        'Química',
  microbiologia:  'Microbiología',
}

export interface MensajeEnviado {
  id:        string
  contenido: string
  createdAt: string
  autorId:   string
  autor:     { nombre: string; rol: string }
}

export async function enviarMensaje(canalSlug: string, contenido: string): Promise<MensajeEnviado> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const text = contenido.trim()
  if (!text || text.length > 1000) throw new Error('Mensaje inválido')

  const canal = await prisma.canalChat.upsert({
    where:  { slug: canalSlug },
    create: { slug: canalSlug, nombre: CANALES_NOMBRES[canalSlug] ?? canalSlug },
    update: {},
  })

  const msg = await prisma.mensajeChat.create({
    data: { canalId: canal.id, autorId: session.user.id, contenido: text },
    include: { autor: { select: { nombre: true, rol: true } } },
  })

  return {
    id:        msg.id,
    contenido: msg.contenido,
    createdAt: msg.createdAt.toISOString(),
    autorId:   msg.autorId,
    autor:     msg.autor,
  }
}
