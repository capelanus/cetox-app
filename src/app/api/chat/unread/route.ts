import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/chat/unread?general=ISO&gerencia=ISO&...
// Returns { [slug]: count } — only messages from others after the given timestamp
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({}, { status: 401 })

  const { searchParams } = new URL(request.url)
  const userId = session.user.id

  const canales = await prisma.canalChat.findMany({ select: { id: true, slug: true } })
  const counts: Record<string, number> = {}

  await Promise.all(
    canales.map(async (canal) => {
      const desde = searchParams.get(canal.slug)
      if (!desde) { counts[canal.slug] = 0; return }
      try {
        counts[canal.slug] = await prisma.mensajeChat.count({
          where: {
            canalId:   canal.id,
            autorId:   { not: userId },          // no contar los propios
            createdAt: { gt: new Date(desde) },
          },
        })
      } catch { counts[canal.slug] = 0 }
    })
  )

  return Response.json(counts)
}
