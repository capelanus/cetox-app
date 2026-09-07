import { prisma } from '@/lib/prisma'

// Traduce el estado interno del laboratorio (ODA.estado) a las 4 etapas que
// ve el cliente en el portal. No exponemos los estados internos tal cual
// (EMITIDA, EN_EJECUCION, etc.) porque son jerga operativa del laboratorio.
export type PortalEtapa = 'RECIBIDA' | 'EN_ANALISIS' | 'CONTROL_CALIDAD' | 'INFORME_DISPONIBLE'

export const ETAPAS: PortalEtapa[] = ['RECIBIDA', 'EN_ANALISIS', 'CONTROL_CALIDAD', 'INFORME_DISPONIBLE']

export const ETAPA_LABEL: Record<PortalEtapa, string> = {
  RECIBIDA: 'Muestra recibida',
  EN_ANALISIS: 'En análisis',
  CONTROL_CALIDAD: 'Control de calidad',
  INFORME_DISPONIBLE: 'Informe disponible',
}

export const ETAPA_PROGRESO: Record<PortalEtapa, number> = {
  RECIBIDA: 10,
  EN_ANALISIS: 45,
  CONTROL_CALIDAD: 75,
  INFORME_DISPONIBLE: 100,
}

function etapaDeODA(estadoODA: string): PortalEtapa {
  if (estadoODA === 'INFORME_EMITIDO') return 'INFORME_DISPONIBLE'
  if (estadoODA === 'CON_RESULTADO') return 'CONTROL_CALIDAD'
  if (estadoODA === 'EN_EJECUCION') return 'EN_ANALISIS'
  return 'RECIBIDA' // EMITIDA, RECIBIDA, ANULADO
}

export function etapaDeSet(odas: { estado: string }[]): PortalEtapa {
  const activas = odas.filter((o) => o.estado !== 'ANULADO')
  if (activas.length === 0) return 'RECIBIDA'
  const indices = activas.map((o) => ETAPAS.indexOf(etapaDeODA(o.estado)))
  return ETAPAS[Math.min(...indices)]
}

export async function getClientePortal(clienteId: string) {
  return prisma.cliente.findUnique({ where: { id: clienteId } })
}

export async function getMuestrasCliente(clienteId: string) {
  const sets = await prisma.sET.findMany({
    where: { clienteId },
    include: {
      odas: {
        where: { estado: { not: 'ANULADO' } },
        include: {
          items: { include: { ensayo: true } },
          informe: { include: { certificadoQR: true } },
        },
      },
    },
    orderBy: { fechaIngreso: 'desc' },
  })

  return sets.map((set) => ({
    ...set,
    etapa: etapaDeSet(set.odas),
  }))
}

export async function getMuestraCliente(clienteId: string, setId: string) {
  const set = await prisma.sET.findUnique({
    where: { id: setId },
    include: {
      odas: {
        where: { estado: { not: 'ANULADO' } },
        include: {
          items: { include: { ensayo: true } },
          informe: { include: { certificadoQR: true } },
        },
      },
    },
  })
  if (!set || set.clienteId !== clienteId) return null
  return { ...set, etapa: etapaDeSet(set.odas) }
}
