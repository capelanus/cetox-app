import { requireNotAnalista, hasRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
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
    fechaIngreso: s.fechaIngreso.toISOString(),
    fechaFabricacion: s.fechaFabricacion?.toISOString() ?? null,
    fechaVencimiento: s.fechaVencimiento?.toISOString() ?? null,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Solicitudes de Ensayo (SET)</h1>
        {canCreate && (
          <div className="flex gap-2">
            <Link href="/set/nuevo-con-costo">
              <Button style={{ backgroundColor: '#1F4E79' }}>
                <Plus className="h-4 w-4 mr-2" />
                SET con costo
              </Button>
            </Link>
            <Link href="/set/nuevo-cero">
              <Button variant="outline" className="border-dashed" style={{ borderColor: '#4AC3B2', color: '#13602C' }}>
                <Plus className="h-4 w-4 mr-2" />
                SET sin costo
              </Button>
            </Link>
          </div>
        )}
      </div>
      <SETTable sets={setsSerialized} />
    </div>
  )
}
