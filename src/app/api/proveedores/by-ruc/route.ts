import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/proveedores/by-ruc?ruc=20XXXXXXXXX
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const ruc = (searchParams.get('ruc') || '').trim()
  if (!ruc) return Response.json({ proveedor: null })

  const proveedor = await prisma.proveedor.findFirst({
    where: { ruc },
    select: { id: true, razonSocial: true, ruc: true },
  })

  return Response.json({ proveedor })
}
