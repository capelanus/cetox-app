import { requireRol } from '@/lib/roles'
import NuevaSolicitudForm from './form'

const TODOS_LOS_ROLES = ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION', 'ANALISTA'] as const

function deducirArea(rol: string, area?: string | null): string {
  if (area === 'Q') return 'QUIMICA'
  if (area === 'B') return 'BIOLOGIA'
  if (area === 'M') return 'MICROBIOLOGIA'
  if (rol === 'DIRECTOR_CALIDAD') return 'CALIDAD'
  if (rol === 'GERENTE_TECNICO')  return 'GERENCIA'
  if (rol === 'ADMINISTRACION')   return 'ADMINISTRACION'
  return 'OTRA'
}

export default async function NuevaSolicitudPage() {
  const session = await requireRol([...TODOS_LOS_ROLES])
  const areaDeducida = deducirArea(session.user.rol, session.user.area ?? null)

  return <NuevaSolicitudForm areaDeducida={areaDeducida} />
}
