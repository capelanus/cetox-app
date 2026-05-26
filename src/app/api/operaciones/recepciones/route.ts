import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const recepciones = await prisma.recepcion.findMany({
    orderBy: { fechaRecepcion: 'desc' },
    include: {
      ordenCompra: { include: { proveedor: true } },
      items: true,
    },
  })

  return NextResponse.json(recepciones)
}
