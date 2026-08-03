import { prisma } from '@/lib/prisma'

// Producción de laboratorio por departamento y mes: número de informes de ensayo
// emitidos por mes. Informe.prefijo = área de la ODA (Q/B/M) → departamento.

const AREA_A_DEPTO: Record<string, string> = {
  Q: 'QUIMICA',
  B: 'BIOLOGIA',
  M: 'MICROBIOLOGIA',
}

// Devuelve, por departamento, un arreglo de 12 posiciones con el conteo de
// informes producidos por mes (índice 0 = enero).
export async function obtenerProduccionLab(anio: number): Promise<Record<string, number[]>> {
  const desde = new Date(anio, 0, 1)
  const hasta = new Date(anio + 1, 0, 1)

  const informes = await prisma.informe.findMany({
    where: { createdAt: { gte: desde, lt: hasta } },
    select: { prefijo: true, createdAt: true },
  })

  const porDepto: Record<string, number[]> = {}
  for (const inf of informes) {
    const depto = AREA_A_DEPTO[inf.prefijo]
    if (!depto) continue
    ;(porDepto[depto] ??= Array(12).fill(0))[inf.createdAt.getMonth()]++
  }
  return porDepto
}
