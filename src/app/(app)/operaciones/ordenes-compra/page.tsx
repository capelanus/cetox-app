import { requireRol, hasRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { formatNumOrdenCompra, formatFecha } from '@/lib/format'
import { ESTADO_OC_LABELS } from '@/lib/constants'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import OCListClient from './oc-list-client'

export default async function OrdenesCompraPage() {
  const session = await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA', 'DIRECTOR_CALIDAD'])
  const esCalidad = hasRol(session.user.rol, 'DIRECTOR_CALIDAD')

  // Calidad only sees OCs explicitly sent for payment (PENDIENTE_PAGO) or already paid (comprobante uploaded)
  const ocs = await prisma.ordenCompra.findMany({
    where: esCalidad
      ? { OR: [{ estado: 'PENDIENTE_PAGO' }, { comprobantePagoUrl: { not: null } }] }
      : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      proveedor: true,
      requerimiento: true,
      emitidoPor: true,
      items: true,
    },
  })

  const rows = ocs.map(oc => ({
    id: oc.id,
    numero: formatNumOrdenCompra(oc.numero, oc.anio),
    proveedor: oc.proveedor.razonSocial,
    requerimiento: oc.requerimiento.descripcion,
    total: `${oc.moneda} ${oc.total.toFixed(2)}`,
    estado: oc.estado,
    fecha: formatFecha(oc.createdAt),
    productos: oc.items.map(i => i.descripcion).join(' '),
  }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>Órdenes de Compra</h1>
          <p className="text-gray-500 text-sm">
            {esCalidad ? `${ocs.length} orden(es) pendiente(s) de pago` : `${ocs.length} orden(es)`}
          </p>
        </div>
        {!esCalidad && (
          <Link href="/operaciones/ordenes-compra/nueva">
            <Button className="bg-[#13602C] hover:bg-[#0e4a21] text-white">
              <Plus className="w-4 h-4 mr-2" />Nueva OC
            </Button>
          </Link>
        )}
      </div>
      <OCListClient rows={rows} estadoLabels={ESTADO_OC_LABELS} />
    </div>
  )
}
