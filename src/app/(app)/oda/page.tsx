import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ODATable } from '@/components/oda-table'
import { obtenerAlertasVencimiento } from '@/lib/alertas'
import { AlertasVencimientoBanner } from '@/components/alertas-vencimiento'

export default async function ODAPage() {
  const session = await auth()
  const userArea = session?.user.area ?? null
  const rol = session?.user.rol

  // ¿El usuario es jefe de laboratorio? (reparte ODAs de su área)
  const me = session?.user.id
    ? await prisma.usuario.findUnique({ where: { id: session.user.id }, select: { esJefeLab: true } })
    : null
  const esJefe = me?.esJefeLab ?? false
  const esAnalistaSimple = rol === 'ANALISTA' && !esJefe

  // Filtro de visibilidad:
  //  - Analista normal: solo sus ODAs asignadas
  //  - Jefe de laboratorio: todas las de su área (para repartir)
  //  - Otros roles: todas
  const baseWhere = esAnalistaSimple
    ? { asignadoAId: session!.user.id }
    : rol === 'ANALISTA' && userArea
      ? { area: userArea }
      : {}
  const where = { ...baseWhere, set: { estado: { not: 'ANULADO' } } }

  const [odas, alertas, analistasArea] = await Promise.all([
    prisma.oDA.findMany({
      where,
      include: {
        items: { include: { ensayo: true } },
        set: { include: { cliente: true } },
        informe: true,
      },
      orderBy: [{ anio: 'desc' }, { numero: 'desc' }],
    }),
    obtenerAlertasVencimiento(),
    // Científicos del área para el selector de asignación del jefe
    esJefe && userArea
      ? prisma.usuario.findMany({
          where: { rol: 'ANALISTA', activo: true, area: userArea },
          select: { id: true, nombre: true },
          orderBy: { nombre: 'asc' },
        })
      : Promise.resolve([]),
  ])

  // Resolver nombres de los científicos asignados (para la columna "Asignado a")
  const asignadoIds = [...new Set(odas.map((o) => o.asignadoAId).filter((v): v is string => !!v))]
  const asignados = asignadoIds.length
    ? await prisma.usuario.findMany({ where: { id: { in: asignadoIds } }, select: { id: true, nombre: true } })
    : []
  const nombrePorId = Object.fromEntries(asignados.map((u) => [u.id, u.nombre]))

  const odasSer = odas.map((o) => ({
    ...o,
    asignadoNombre: o.asignadoAId ? (nombrePorId[o.asignadoAId] ?? null) : null,
  }))

  return (
    <div>
      <AlertasVencimientoBanner alertas={alertas} tipo="ODA" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Órdenes de Análisis (ODA)</h1>
        {esJefe && (
          <p className="text-sm text-slate-500 mt-0.5">
            Reparte las ODAs de tu área entre los científicos de tu equipo.
          </p>
        )}
      </div>
      <ODATable
        odas={odasSer}
        userArea={userArea}
        isAnalista={rol === 'ANALISTA' || rol === 'SUPER_ADMIN'}
        esJefe={esJefe}
        analistas={analistasArea}
      />
    </div>
  )
}
