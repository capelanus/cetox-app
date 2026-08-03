import { requireRol } from '@/lib/roles'
import { obtenerEgresosLogistica } from '@/lib/egresos-logistica'
import { AREA_SOLICITANTE_LABELS } from '@/lib/constants'
import { EgresosClient } from './egresos-client'

export const dynamic = 'force-dynamic'

const ROLES = ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION'] as const

export default async function EgresosPage({ searchParams }: { searchParams: Promise<{ anio?: string }> }) {
  await requireRol([...ROLES])
  const sp = await searchParams
  const anio = sp.anio ? parseInt(sp.anio) : new Date().getFullYear()

  const egresos = await obtenerEgresosLogistica(anio)

  const porDepto = egresos.porDepto.map((d) => ({
    ...d,
    label: AREA_SOLICITANTE_LABELS[d.departamento] ?? d.departamento,
  }))

  return (
    <EgresosClient
      anio={anio}
      porDepto={porDepto}
      totales={egresos.totales}
      mensualGlobal={egresos.mensualGlobal}
    />
  )
}
