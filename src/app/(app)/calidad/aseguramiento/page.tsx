import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { AseguramientoClient } from './aseguramiento-client'

export default async function AseguramientoPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const { rol } = session.user
  const esCalidad = rol === 'DIRECTOR_CALIDAD' || rol === 'COORDINADOR_CALIDAD' || rol === 'SUPER_ADMIN'
  if (!esCalidad) redirect('/dashboard')

  const [items, ensayos] = await Promise.all([
    prisma.aseguramientoItem.findMany({
      include: { ensayo: { select: { id: true, nombre: true, codigo: true } } },
      orderBy: { fechaInicio: 'desc' },
    }),
    prisma.ensayo.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, codigo: true, area: true },
      orderBy: { nombre: 'asc' },
    }),
  ])

  return <AseguramientoClient items={items} ensayos={ensayos} />
}
