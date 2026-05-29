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

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const slug  = searchParams.get('canal') || 'general'
  const desde = searchParams.get('desde')  // ISO timestamp

  // Auto-create channel if first time
  const canal = await prisma.canalChat.upsert({
    where:  { slug },
    create: { slug, nombre: CANALES_NOMBRES[slug] ?? slug },
    update: {},
  })

  const mensajes = await prisma.mensajeChat.findMany({
    where: {
      canalId: canal.id,
      ...(desde ? { createdAt: { gt: new Date(desde) } } : {}),
    },
    include: { autor: { select: { id: true, nombre: true, rol: true } } },
    orderBy: { createdAt: desde ? 'asc' : 'desc' },
    ...(desde ? {} : { take: 60 }),
  })

  // Initial load comes desc → reverse to asc for display
  const result = desde ? mensajes : [...mensajes].reverse()

  return Response.json(
    result.map((m) => ({
      id:            m.id,
      contenido:     m.contenido,
      archivoUrl:    m.archivoUrl,
      archivoNombre: m.archivoNombre,
      archivoTipo:   m.archivoTipo,
      createdAt:     m.createdAt.toISOString(),
      autorId:       m.autorId,
      autor:         { nombre: m.autor.nombre, rol: m.autor.rol },
    }))
  )
}
