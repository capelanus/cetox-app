import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatNumSET } from '@/lib/format'
import { CounterClient, type OdaCounter } from './counter-client'

export const dynamic = 'force-dynamic'

const ROLES_TABLET = [
  'COUNTER_QUIMICA',
  'ADMINISTRACION', 'DIRECTOR_CALIDAD', 'COORDINADOR_CALIDAD', 'SUPER_ADMIN',
  'ANALISTA', 'GERENTE_TECNICO', 'GERENTE_GENERAL',
]

// Pantalla kiosco para la tablet del mostrador de Química. Vive fuera del
// layout (app) a propósito: sin menú lateral ni cabecera, solo las dos
// acciones del counter. La sesión es la de la tablet; quien firma lo hace
// con su PIN en cada acción.
export default async function CounterQuimicaPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (!ROLES_TABLET.includes(session.user.rol)) redirect('/dashboard')
  if (session.user.rol === 'ANALISTA' && session.user.area && session.user.area !== 'Q') redirect('/oda')

  const odas = await prisma.oDA.findMany({
    where: { area: 'Q', estado: { in: ['EMITIDA', 'ENTREGADA_LAB'] }, set: { estado: { not: 'ANULADO' } } },
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

  return <CounterClient odas={filas} tablet={session.user.name ?? session.user.email ?? 'Counter'} />
}
