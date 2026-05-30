import { requireRol } from '@/lib/roles'
import { notFound } from 'next/navigation'
import type { TipoContrato } from '@/lib/contratos/types'
import { NuevoContratoForm } from './nuevo-contrato-form'

const TIPOS_VALIDOS: TipoContrato[] = [
  'INDETERMINADO',
  'INDETERMINADO_ALTA_DIR',
  'PLAZO_FIJO',
  'LOCACION_SERVICIOS',
]

export default async function NuevoContratoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>
}) {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_ADMINISTRACION', 'GERENTE_TECNICO'])

  const { tipo } = await searchParams

  if (!tipo || !TIPOS_VALIDOS.includes(tipo as TipoContrato)) {
    notFound()
  }

  return <NuevoContratoForm tipo={tipo as TipoContrato} />
}
