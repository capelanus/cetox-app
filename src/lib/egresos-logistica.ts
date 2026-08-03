import { prisma } from '@/lib/prisma'

// Egresos reales extraídos del módulo de Logística/compras, agregados por
// departamento (Requerimiento.areaSolicitante) y por mes.
//   comprometido = Órdenes de Compra emitidas (no canceladas)
//   facturado    = Facturas de proveedor (devengado) — criterio de "ejecutado"
//   pagado       = Pagos efectivamente realizados (caja)

const PAGOS_REALIZADOS = ['PAGADO', 'CONFIRMADO_PROVEEDOR']

export interface EgresoDepto {
  departamento: string
  comprometido: number
  facturado: number
  pagado: number
}

export interface SerieMensual {
  comprometido: number[] // 12 posiciones (índice 0 = enero)
  facturado: number[]
  pagado: number[]
}

export interface EgresosLogistica {
  anio: number
  porDepto: EgresoDepto[]
  totales: { comprometido: number; facturado: number; pagado: number }
  mensualPorDepto: Record<string, SerieMensual> // clave = departamento (areaSolicitante)
  mensualGlobal: SerieMensual
}

function nuevaSerie(): SerieMensual {
  return { comprometido: Array(12).fill(0), facturado: Array(12).fill(0), pagado: Array(12).fill(0) }
}

export async function obtenerEgresosLogistica(anio: number): Promise<EgresosLogistica> {
  const desde = new Date(anio, 0, 1)
  const hasta = new Date(anio + 1, 0, 1)

  const [ordenes, facturas, pagos] = await Promise.all([
    prisma.ordenCompra.findMany({
      where: { createdAt: { gte: desde, lt: hasta }, estado: { not: 'CANCELADA' } },
      select: { total: true, createdAt: true, requerimiento: { select: { areaSolicitante: true } } },
    }),
    prisma.factura.findMany({
      where: { fechaEmision: { gte: desde, lt: hasta } },
      select: { total: true, fechaEmision: true, ordenCompra: { select: { requerimiento: { select: { areaSolicitante: true } } } } },
    }),
    prisma.pago.findMany({
      where: { fechaPago: { gte: desde, lt: hasta }, estado: { in: PAGOS_REALIZADOS } },
      select: { monto: true, fechaPago: true, provision: { select: { factura: { select: { ordenCompra: { select: { requerimiento: { select: { areaSolicitante: true } } } } } } } } },
    }),
  ])

  const mensualPorDepto: Record<string, SerieMensual> = {}
  const mensualGlobal = nuevaSerie()
  const serie = (depto: string) => (mensualPorDepto[depto] ??= nuevaSerie())

  for (const o of ordenes) {
    const depto = o.requerimiento?.areaSolicitante ?? 'OTRA'
    const m = o.createdAt.getMonth()
    serie(depto).comprometido[m] += o.total
    mensualGlobal.comprometido[m] += o.total
  }
  for (const f of facturas) {
    const depto = f.ordenCompra?.requerimiento?.areaSolicitante ?? 'OTRA'
    const m = f.fechaEmision.getMonth()
    serie(depto).facturado[m] += f.total
    mensualGlobal.facturado[m] += f.total
  }
  for (const p of pagos) {
    const depto = p.provision?.factura?.ordenCompra?.requerimiento?.areaSolicitante ?? 'OTRA'
    const m = p.fechaPago.getMonth()
    serie(depto).pagado[m] += p.monto
    mensualGlobal.pagado[m] += p.monto
  }

  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
  const porDepto: EgresoDepto[] = Object.entries(mensualPorDepto)
    .map(([departamento, s]) => ({
      departamento,
      comprometido: sum(s.comprometido),
      facturado: sum(s.facturado),
      pagado: sum(s.pagado),
    }))
    .sort((a, b) => b.facturado - a.facturado)

  return {
    anio,
    porDepto,
    totales: {
      comprometido: sum(mensualGlobal.comprometido),
      facturado: sum(mensualGlobal.facturado),
      pagado: sum(mensualGlobal.pagado),
    },
    mensualPorDepto,
    mensualGlobal,
  }
}

// Facturado total de un departamento en el año (criterio de "presupuesto ejecutado")
export function facturadoDeDepto(egresos: EgresosLogistica, departamento: string): number {
  return egresos.porDepto.find((d) => d.departamento === departamento)?.facturado ?? 0
}
