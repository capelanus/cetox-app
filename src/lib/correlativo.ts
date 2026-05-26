import { prisma } from './prisma'

export async function siguienteCorrelativo(
  modelo: 'cotizacion' | 'set' | 'oda' | 'informe' | 'cargo' | 'requerimiento' | 'cotizacion_proveedor' | 'orden_compra' | 'recepcion' | 'devolucion' | 'pago',
  anio: number,
  prefijo?: string
): Promise<number> {
  if (modelo === 'cotizacion') {
    const last = await prisma.cotizacion.findFirst({ where: { anio }, orderBy: { numero: 'desc' } })
    return (last?.numero ?? 0) + 1
  }
  if (modelo === 'set') {
    const last = await prisma.sET.findFirst({ where: { anio }, orderBy: { numero: 'desc' } })
    return (last?.numero ?? 0) + 1
  }
  if (modelo === 'oda') {
    const last = await prisma.oDA.findFirst({ where: { anio }, orderBy: { numero: 'desc' } })
    return (last?.numero ?? 0) + 1
  }
  if (modelo === 'informe') {
    const last = await prisma.informe.findFirst({ where: { anio, prefijo: prefijo ?? '' }, orderBy: { numero: 'desc' } })
    return (last?.numero ?? 0) + 1
  }
  if (modelo === 'cargo') {
    const last = await prisma.cargoEntrega.findFirst({ where: { anio }, orderBy: { numero: 'desc' } })
    return (last?.numero ?? 0) + 1
  }
  if (modelo === 'requerimiento') {
    const last = await prisma.requerimiento.findFirst({ where: { anio }, orderBy: { numero: 'desc' } })
    return (last?.numero ?? 0) + 1
  }
  if (modelo === 'cotizacion_proveedor') {
    const last = await prisma.cotizacionProveedor.findFirst({ where: { anio }, orderBy: { numero: 'desc' } })
    return (last?.numero ?? 0) + 1
  }
  if (modelo === 'orden_compra') {
    const last = await prisma.ordenCompra.findFirst({ where: { anio }, orderBy: { numero: 'desc' } })
    return (last?.numero ?? 0) + 1
  }
  if (modelo === 'recepcion') {
    const last = await prisma.recepcion.findFirst({ where: { anio }, orderBy: { numero: 'desc' } })
    return (last?.numero ?? 0) + 1
  }
  if (modelo === 'devolucion') {
    const last = await prisma.devolucion.findFirst({ where: { anio }, orderBy: { numero: 'desc' } })
    return (last?.numero ?? 0) + 1
  }
  if (modelo === 'pago') {
    const last = await prisma.pago.findFirst({ where: { anio }, orderBy: { numero: 'desc' } })
    return (last?.numero ?? 0) + 1
  }
  return 1
}
