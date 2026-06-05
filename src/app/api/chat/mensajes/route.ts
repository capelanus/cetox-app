import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NO_CACHE = { 'Cache-Control': 'no-store, max-age=0' }

function ordenarUsuarios(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a]
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'No autorizado' }, { status: 401, headers: NO_CACHE })
  }

  const userId = session.user.id
  const { searchParams } = new URL(request.url)
  const otroId = searchParams.get('usuario')
  const desde  = searchParams.get('desde')

  if (!otroId || otroId === userId) {
    return Response.json([], { headers: NO_CACHE })
  }

  const [usuarioAId, usuarioBId] = ordenarUsuarios(userId, otroId)

  // Auto-create conversation if first time
  const conv = await prisma.conversacionDM.upsert({
    where:  { usuarioAId_usuarioBId: { usuarioAId, usuarioBId } },
    create: { usuarioAId, usuarioBId },
    update: {},
  })

  const mensajes = await prisma.mensajeDM.findMany({
    where: {
      conversacionId: conv.id,
      ...(desde ? { createdAt: { gt: new Date(desde) } } : {}),
    },
    include: { autor: { select: { id: true, nombre: true, rol: true } } },
    orderBy: { createdAt: desde ? 'asc' : 'desc' },
    ...(desde ? {} : { take: 60 }),
  })

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
    })),
    { headers: NO_CACHE },
  )
}
