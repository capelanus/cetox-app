import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { RentabilidadClient } from './rentabilidad-client'

export const dynamic = 'force-dynamic'

const ROLES = ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION'] as const

export default async function RentabilidadPage({ searchParams }: { searchParams: Promise<{ anio?: string }> }) {
  await requireRol([...ROLES])
  const sp = await searchParams
  const anio = sp.anio ? parseInt(sp.anio) : new Date().getFullYear()

  const [registros, clientes, ensayos] = await Promise.all([
    prisma.registroRentabilidad.findMany({ where: { anio }, orderBy: { createdAt: 'desc' } }),
    prisma.cliente.findMany({ select: { razonSocial: true }, orderBy: { razonSocial: 'asc' }, take: 500 }),
    prisma.ensayo.findMany({ select: { nombre: true }, orderBy: { nombre: 'asc' }, take: 500 }),
  ])

  return (
    <RentabilidadClient
      anio={anio}
      registros={registros}
      clientes={clientes.map(c => c.razonSocial)}
      servicios={[...new Set(ensayos.map(e => e.nombre))]}
    />
  )
}
