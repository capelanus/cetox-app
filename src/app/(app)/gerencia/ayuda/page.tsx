import { requireRol } from '@/lib/roles'
import { AyudaClient } from './ayuda-client'

export const metadata = { title: 'Guía de Gerencia · CETOX' }

const ROLES = ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION'] as const

export default async function AyudaPage() {
  await requireRol([...ROLES])
  return <AyudaClient />
}
