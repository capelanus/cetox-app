import { requireNotAnalista, hasRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, ClipboardList } from 'lucide-react'
import { SETTable } from '@/components/set-table'

export default async function SETPage() {
  const session = await requireNotAnalista()
  const sets = await prisma.sET.findMany({
    include: { cliente: true, creadoPor: true, odas: true },
    orderBy: [{ anio: 'desc' }, { numero: 'desc' }],
  })
  const canCreate = hasRol(session?.user.rol ?? '', 'ADMINISTRACION')

  // Serializar fechas para el cliente
  const setsSerialized = sets.map((s) => ({
    ...s,
    fechaIngreso:     s.fechaIngreso.toISOString(),
    fechaFabricacion: s.fechaFabricacion?.toISOString() ?? null,
    fechaVencimiento: s.fechaVencimiento?.toISOString() ?? null,
  }))

  return (
    <div>
      {/* Header */}
      <div className="cetox-page-header">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <ClipboardList className="h-5 w-5" style={{ color: '#4AC3B2' }} />
            <h1 className="cetox-page-title">Solicitudes de Ensayo (SET)</h1>
          </div>
          <p className="cetox-page-subtitle">
            Registro y seguimiento de solicitudes de ensayo acreditado
          </p>
        </div>

        {canCreate && (
          <div className="flex gap-2">
            <Link href="/set/nuevo-con-costo">
              <button className="cetox-btn-primary flex items-center gap-1.5 text-sm px-4 py-2">
                <Plus className="h-4 w-4" />
                SET con costo
              </button>
            </Link>
            <Link href="/set/nuevo-cero">
              <button
                className="cetox-btn-secondary flex items-center gap-1.5 text-sm px-4 py-2"
                style={{ borderStyle: 'dashed' }}
              >
                <Plus className="h-4 w-4" />
                SET sin costo
              </button>
            </Link>
          </div>
        )}
      </div>

      <SETTable sets={setsSerialized} />
    </div>
  )
}
