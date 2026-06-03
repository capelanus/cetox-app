import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/chat/unread?<userId1>=ISO&<userId2>=ISO&...
// Returns { [otroUsuarioId]: count } — only messages from the other user after the given timestamp
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({}, { status: 401 })

  const userId = session.user.id
  const { searchParams } = new URL(request.url)

  const usuarios = await prisma.usuario.findMany({
    where: { activo: true, id: { not: userId } },
    select: { id: true },
  })

  const counts: Record<string, number> = {}

  await Promise.all(
    usuarios.map(async (u) => {
      const desde = searchParams.get(u.id)
      if (!desde) { counts[u.id] = 0; return }
      try {
        counts[u.id] = await prisma.mensajeDM.count({
          where: {
            autorId:   u.id,
            createdAt: { gt: new Date(desde) },
            conversacion: {
              OR: [
                { usuarioAId: userId, usuarioBId: u.id },
                { usuarioAId: u.id, usuarioBId: userId },
              ],
            },
          },
        })
      } catch { counts[u.id] = 0 }
    })
  )

  return Response.json(counts)
}
