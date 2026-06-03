import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/chat/usuarios — list of users available to chat with
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const usuarios = await prisma.usuario.findMany({
    where: { activo: true, id: { not: session.user.id } },
    select: { id: true, nombre: true, rol: true },
    orderBy: { nombre: 'asc' },
  })

  return Response.json(usuarios)
}
