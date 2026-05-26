import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cotizaciones = await prisma.cotizacionProveedor.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      items: { orderBy: { orden: 'asc' } },
    },
  })

  return NextResponse.json(cotizaciones)
}
