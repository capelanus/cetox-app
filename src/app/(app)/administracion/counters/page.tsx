import { requireRol, type Rol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { ScanBarcode } from 'lucide-react'
import { LAB_LIST, ROLES_ADMIN_COUNTERS, ROLES_ENTREGAN } from '@/lib/counters'
import { CountersClient, type CuentaCounter, type PersonaPin } from './counters-client'

export const dynamic = 'force-dynamic'

// Administración de counters: una tarjeta por laboratorio con su cuenta de
// tablet, y la lista de personas que firman con PIN (quienes dejan muestras
// y los analistas de cada laboratorio).
export default async function CountersAdminPage() {
  const session = await requireRol(ROLES_ADMIN_COUNTERS as Rol[])

  const [cuentas, personal] = await Promise.all([
    prisma.usuario.findMany({
      where: { rol: 'COUNTER' },
      select: { id: true, email: true, nombre: true, area: true, activo: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.usuario.findMany({
      where: {
        activo: true,
        OR: [
          { rol: { in: ROLES_ENTREGAN.filter(r => r !== 'SUPER_ADMIN') } },
          { rol: 'ANALISTA' },
        ],
      },
      select: { id: true, nombre: true, email: true, rol: true, area: true, pinHash: true, esJefeLab: true },
      orderBy: [{ rol: 'asc' }, { nombre: 'asc' }],
    }),
  ])

  const cuentasPorArea: Record<string, CuentaCounter | null> = {}
  for (const lab of LAB_LIST) {
    const c = cuentas.find(x => x.area === lab.area) ?? null
    cuentasPorArea[lab.area] = c
      ? { id: c.id, email: c.email, nombre: c.nombre, activo: c.activo, creada: c.createdAt.toISOString() }
      : null
  }

  const personas: PersonaPin[] = personal.map(p => ({
    id: p.id,
    nombre: p.nombre,
    email: p.email,
    rol: p.rol,
    area: p.area,
    esJefeLab: p.esJefeLab,
    tienePin: !!p.pinHash,
    esYo: p.id === session.user.id,
  }))

  return (
    <div className="max-w-[1100px]">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ScanBarcode className="h-5 w-5" style={{ color: '#4AC3B2' }} />
          <h1 className="text-2xl font-bold uppercase tracking-wide" style={{ color: '#13602C', fontFamily: 'var(--font-oswald)' }}>
            Counters y PIN
          </h1>
        </div>
        <p className="text-sm text-slate-500">
          Cuentas de las tablets de cada mostrador y PIN con el que cada persona firma al dejar o recepcionar muestras.
        </p>
      </div>

      <CountersClient labs={LAB_LIST} cuentas={cuentasPorArea} personas={personas} />
    </div>
  )
}
