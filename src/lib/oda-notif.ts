import { prisma } from '@/lib/prisma'

const AREA_LABELS: Record<string, string> = { Q: 'Química', B: 'Biología', M: 'Microbiología' }

/**
 * Notifica a los jefes de laboratorio de cada área involucrada en un SET que
 * llegaron ODAs nuevas para repartir entre su equipo. Una notificación por
 * jefe/área (no una por ODA).
 */
export async function notificarJefesNuevasODAs(setId: string) {
  const odas = await prisma.oDA.findMany({
    where: { setId },
    select: { area: true, set: { select: { nombreComercial: true } } },
  })
  if (odas.length === 0) return

  const nombreMuestra = odas[0].set.nombreComercial ?? 'muestra sin nombre'
  const areas = [...new Set(odas.map((o) => o.area))]

  const jefes = await prisma.usuario.findMany({
    where: { esJefeLab: true, activo: true, area: { in: areas } },
    select: { id: true, area: true },
  })
  if (jefes.length === 0) return

  const conteoPorArea: Record<string, number> = {}
  for (const a of areas) conteoPorArea[a] = odas.filter((o) => o.area === a).length

  await prisma.notificacion.createMany({
    data: jefes.map((j) => ({
      usuarioId: j.id,
      tipo: 'ODA_NUEVA_AREA',
      titulo: `Nuevas ODAs en ${AREA_LABELS[j.area ?? ''] ?? j.area}`,
      mensaje: `Llegaron ${conteoPorArea[j.area ?? '']} ODA(s) de "${nombreMuestra}" para repartir entre tu equipo.`,
      enlace: '/oda',
    })),
  })
}
