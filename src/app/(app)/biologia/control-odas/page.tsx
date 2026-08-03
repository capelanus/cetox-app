import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ControlBiologiaClient } from './control-biologia-client'

export const dynamic = 'force-dynamic'

// Editan: Gerencia/Super + jefe de laboratorio de Biología. Visualizan además:
// Calidad (Dra Risco) y los analistas del área de Biología.
const ROLES_EDIT = ['SUPER_ADMIN', 'GERENTE_GENERAL', 'GERENTE_TECNICO']
const ROLES_VIEW = [...ROLES_EDIT, 'DIRECTOR_CALIDAD', 'COORDINADOR_CALIDAD']

export default async function ControlOdasBiologiaPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const me = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: { esJefeLab: true, area: true },
  })
  const esJefeBio = (me?.esJefeLab ?? false) && me?.area === 'B'
  const esAnalistaBio = session.user.rol === 'ANALISTA' && me?.area === 'B'

  const puedeVer = ROLES_VIEW.includes(session.user.rol) || esAnalistaBio || esJefeBio
  if (!puedeVer) redirect('/dashboard')

  const puedeEditar = ROLES_EDIT.includes(session.user.rol) || esJefeBio

  const filas = await prisma.controlOdaBiologia.findMany({ orderBy: { createdAt: 'asc' } })

  const filasSer = filas.map((f) => ({
    ...f,
    fechaEntrega: f.fechaEntrega?.toISOString() ?? null,
    fechaRecepcion: f.fechaRecepcion?.toISOString() ?? null,
    createdAt: f.createdAt.toISOString(),
  }))

  return <ControlBiologiaClient filas={filasSer} puedeEditar={puedeEditar} />
}
