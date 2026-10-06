import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { formatNumSET } from '@/lib/format'
import { labPorSlug, labPorArea, ROLES_ABREN_COUNTER } from '@/lib/counters'
import { CounterClient, type OdaCounter } from './counter-client'

export const dynamic = 'force-dynamic'

// Pantalla kiosco para la tablet del mostrador de un laboratorio. Vive fuera
// del layout (app) a propósito: sin menú ni cabecera, solo las dos acciones
// del counter. La sesión es la de la tablet; quien firma lo hace con su PIN.
export default async function CounterPage({ params }: { params: Promise<{ lab: string }> }) {
  const { lab: slug } = await params
  const lab = labPorSlug(slug)
  if (!lab) notFound()

  const session = await auth()
  if (!session) redirect('/login')
  const { rol, area } = session.user

  // La cuenta de tablet y los analistas solo abren el counter de su área.
  if (rol === 'COUNTER' || rol === 'ANALISTA') {
    const propio = labPorArea(area)
    if (!propio) redirect(rol === 'COUNTER' ? '/login' : '/oda')
    if (propio.slug !== lab.slug) redirect(`/counter/${propio.slug}`)
  } else if (!ROLES_ABREN_COUNTER.includes(rol) && rol !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  const odas = await prisma.oDA.findMany({
    where: { area: lab.area, estado: { in: ['EMITIDA', 'ENTREGADA_LAB'] }, set: { estado: { not: 'ANULADO' } } },
    orderBy: [{ estado: 'asc' }, { numero: 'asc' }],
    include: {
      set: { select: { numero: true, anio: true, nombreComercial: true, tipoMuestra: true, numeroMuestras: true, cliente: { select: { razonSocial: true } } } },
      items: { select: { ensayo: { select: { nombre: true } } } },
    },
  })

  const entregadores = [...new Set(odas.map(o => o.entregadaPorId).filter((x): x is string => Boolean(x)))]
  const nombres = entregadores.length
    ? await prisma.usuario.findMany({ where: { id: { in: entregadores } }, select: { id: true, nombre: true } })
    : []
  const nombreDe = new Map(nombres.map(u => [u.id, u.nombre]))

  const filas: OdaCounter[] = odas.map(o => ({
    id: o.id,
    codigo: formatNumSET(o.set.numero, o.set.anio),
    odaNumero: o.numero,
    estado: o.estado,
    nombreComercial: o.set.nombreComercial,
    cliente: o.set.cliente.razonSocial,
    tipoMuestra: o.set.tipoMuestra,
    numeroMuestras: o.set.numeroMuestras,
    ensayos: o.items.map(i => i.ensayo.nombre),
    fechaEntregaLab: o.fechaEntregaLab?.toISOString() ?? null,
    entregadaPor: o.entregadaPorId ? (nombreDe.get(o.entregadaPorId) ?? null) : null,
  }))

  return <CounterClient lab={lab} odas={filas} tablet={session.user.name ?? session.user.email ?? 'Counter'} />
}
