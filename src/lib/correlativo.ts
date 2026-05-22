import { prisma } from './prisma'

export async function siguienteCorrelativo(
  modelo: 'cotizacion' | 'set' | 'oda' | 'informe' | 'cargo',
  anio: number,
  prefijo?: string
): Promise<number> {
  if (modelo === 'cotizacion') {
    const last = await prisma.cotizacion.findFirst({
      where: { anio },
      orderBy: { numero: 'desc' },
    })
    return (last?.numero ?? 0) + 1
  }
  if (modelo === 'set') {
    const last = await prisma.sET.findFirst({
      where: { anio },
      orderBy: { numero: 'desc' },
    })
    return (last?.numero ?? 0) + 1
  }
  if (modelo === 'oda') {
    const last = await prisma.oDA.findFirst({
      where: { anio },
      orderBy: { numero: 'desc' },
    })
    return (last?.numero ?? 0) + 1
  }
  if (modelo === 'informe') {
    const last = await prisma.informe.findFirst({
      where: { anio, prefijo: prefijo ?? '' },
      orderBy: { numero: 'desc' },
    })
    return (last?.numero ?? 0) + 1
  }
  if (modelo === 'cargo') {
    const last = await prisma.cargoEntrega.findFirst({
      where: { anio },
      orderBy: { numero: 'desc' },
    })
    return (last?.numero ?? 0) + 1
  }
  return 1
}
