import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NO_CACHE = { 'Cache-Control': 'no-store, max-age=0' }

// GET /api/chat/usuarios — list of users available to chat with
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'No autorizado' }, { status: 401, headers: NO_CACHE })
  }

  const usuarios = await prisma.usuario.findMany({
    where: { activo: true, id: { not: session.user.id } },
    select: { id: true, nombre: true, rol: true },
    orderBy: { nombre: 'asc' },
  })

  return Response.json(usuarios, { headers: NO_CACHE })
}
