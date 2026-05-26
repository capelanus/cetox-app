import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ordenesCompra = await prisma.ordenCompra.findMany({
    where: { estado: { in: ['EMITIDA', 'CONFIRMADA_PROVEEDOR', 'EN_TRANSITO', 'RECIBIDA'] } },
    orderBy: { createdAt: 'desc' },
    include: {
      proveedor: true,
      items: { orderBy: { orden: 'asc' } },
    },
  })

  return NextResponse.json(ordenesCompra)
}
