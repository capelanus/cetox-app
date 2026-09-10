import { prisma } from '@/lib/prisma'
import { obtenerEgresosLogistica } from '@/lib/egresos-logistica'
import { ESTADO_RECEPCION_LABELS } from '@/lib/constants'

// Capa de lectura para el módulo de Seguimiento de Órdenes de Compra.
// No introduce una nueva máquina de estados: el "estado de seguimiento" se
// DERIVA en cada consulta a partir de los campos reales que ya usan
// ordenes-compra.ts / recepciones.ts / facturas-proveedor.ts / pagos-proveedor.ts,
// incluyendo los dos caminos de pago que coexisten hoy (Factura→ProvisionPago→Pago
// formal, y el comprobantePagoUrl que Calidad sube directo sobre la OC).

const PAGOS_REALIZADOS = ['PAGADO', 'CONFIRMADO_PROVEEDOR']

export async function obtenerOrdenesSeguimiento() {
  return prisma.ordenCompra.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      proveedor: true,
      requerimiento: { select: { areaSolicitante: true, estado: true } },
      responsableActual: { select: { id: true, nombre: true } },
      emitidoPor: { select: { nombre: true } },
      items: { orderBy: { orden: 'asc' } },
      cotizacionesProveedor: {
        include: { cotizacionProveedor: { select: { numero: true, anio: true, archivoUrl: true } } },
      },
      recepciones: {
        include: { recibidoPor: { select: { nombre: true } } },
        orderBy: { fechaRecepcion: 'desc' },
      },
      facturas: {
        orderBy: { createdAt: 'desc' },
        include: {
          provision: {
            include: {
              pago: true,
              aprobadoPor: { select: { nombre: true } },
            },
          },
        },
      },
      historial: {
        include: { usuario: { select: { nombre: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export type OrdenCompraSeguimiento = Awaited<ReturnType<typeof obtenerOrdenesSeguimiento>>[number]

export type EstadoSeguimiento =
  | 'EMITIDA'
  | 'CONFIRMADA'
  | 'EN_TRANSITO'
  | 'ENTREGA_PARCIAL'
  | 'ENTREGADA'
  | 'FACTURADA'
  | 'PAGADA'
  | 'CANCELADA'

export const ESTADO_SEGUIMIENTO_LABELS: Record<EstadoSeguimiento, string> = {
  EMITIDA: 'Emitida',
  CONFIRMADA: 'Confirmada por proveedor',
  EN_TRANSITO: 'En tránsito',
  ENTREGA_PARCIAL: 'Entrega parcial',
  ENTREGADA: 'Entregada',
  FACTURADA: 'Facturada — pendiente de pago',
  PAGADA: 'Pagada / cerrada',
  CANCELADA: 'Cancelada',
}

// Paleta acordada con el usuario: verde=al día/completo, azul=en proceso,
// amarillo=pendiente de acción, rojo=vencida o cancelada.
export const ESTADO_SEGUIMIENTO_BADGE: Record<EstadoSeguimiento, string> = {
  EMITIDA: 'bg-amber-100 text-amber-700',
  CONFIRMADA: 'bg-blue-100 text-blue-700',
  EN_TRANSITO: 'bg-blue-100 text-blue-700',
  ENTREGA_PARCIAL: 'bg-amber-100 text-amber-700',
  ENTREGADA: 'bg-blue-100 text-blue-700',
  FACTURADA: 'bg-amber-100 text-amber-700',
  PAGADA: 'bg-green-100 text-green-700',
  CANCELADA: 'bg-red-100 text-red-700',
}

// Requiere que TODAS las facturas de la OC estén pagadas (no solo una) --
// una OC puede tener varias facturas (pagos en cuotas) y no debe leerse
// como pagada mientras quede un saldo pendiente en cualquiera de ellas.
function haySenalDePago(oc: OrdenCompraSeguimiento): boolean {
  if (oc.comprobantePagoUrl) return true
  if (oc.facturas.length === 0) return false
  return oc.facturas.every(f => f.provision?.pago && PAGOS_REALIZADOS.includes(f.provision.pago.estado))
}

export function calcularAvanceEntrega(oc: OrdenCompraSeguimiento): number {
  if (oc.items.length === 0) return 0
  const valorTotal = oc.items.reduce((s, i) => s + i.cantidad * i.precioUnitario, 0)
  if (valorTotal <= 0) return 0
  const valorRecibido = oc.items.reduce((s, i) => s + Math.min(i.cantidadRecibida, i.cantidad) * i.precioUnitario, 0)
  return Math.round((valorRecibido / valorTotal) * 100)
}

export function calcularEstadoSeguimiento(oc: OrdenCompraSeguimiento): EstadoSeguimiento {
  if (oc.estado === 'CANCELADA') return 'CANCELADA'

  if (haySenalDePago(oc)) return 'PAGADA'

  const facturada = oc.facturas.length > 0 || oc.estado === 'PENDIENTE_PAGO'
  if (facturada) return 'FACTURADA'

  const avance = calcularAvanceEntrega(oc)
  if (oc.items.length > 0 && avance >= 100) return 'ENTREGADA'
  if (avance > 0 || oc.recepciones.length > 0) return 'ENTREGA_PARCIAL'

  if (oc.estado === 'EN_TRANSITO') return 'EN_TRANSITO'
  if (oc.estado === 'CONFIRMADA_PROVEEDOR') return 'CONFIRMADA'
  return 'EMITIDA'
}

export function estaVencida(oc: OrdenCompraSeguimiento): boolean {
  const estado = calcularEstadoSeguimiento(oc)
  if (estado === 'PAGADA' || estado === 'CANCELADA') return false
  const hoy = new Date()
  const entregaVencida = Boolean(
    oc.fechaEntregaEstimada &&
    oc.fechaEntregaEstimada < hoy &&
    !['ENTREGADA', 'FACTURADA', 'PAGADA'].includes(estado)
  )
  const facturaVencida = oc.facturas.some(f => f.fechaVencimiento && f.fechaVencimiento < hoy && f.estado !== 'PAGADA')
  return entregaVencida || facturaVencida
}

export type EstadoItem = 'PENDIENTE' | 'PARCIAL' | 'ENTREGADO'

export function calcularEstadoItem(item: { cantidad: number; cantidadRecibida: number }): EstadoItem {
  if (item.cantidadRecibida <= 0) return 'PENDIENTE'
  if (item.cantidadRecibida >= item.cantidad) return 'ENTREGADO'
  return 'PARCIAL'
}

export const ESTADO_ITEM_LABELS: Record<EstadoItem, string> = {
  PENDIENTE: 'Pendiente',
  PARCIAL: 'Parcial',
  ENTREGADO: 'Entregado',
}

export const ESTADO_ITEM_BADGE: Record<EstadoItem, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700',
  PARCIAL: 'bg-blue-100 text-blue-700',
  ENTREGADO: 'bg-green-100 text-green-700',
}

export interface EventoTimeline {
  fecha: Date
  texto: string
  usuario?: string
}

export function construirTimeline(oc: OrdenCompraSeguimiento): EventoTimeline[] {
  const eventos: EventoTimeline[] = [
    { fecha: oc.createdAt, texto: `OC emitida a ${oc.proveedor.razonSocial}`, usuario: oc.emitidoPor?.nombre },
  ]

  if (oc.fechaConfirmacionProveedor) {
    eventos.push({ fecha: oc.fechaConfirmacionProveedor, texto: 'Confirmada por el proveedor' })
  }

  for (const r of oc.recepciones) {
    eventos.push({
      fecha: r.fechaRecepcion,
      texto: `Recepción registrada — ${ESTADO_RECEPCION_LABELS[r.estado] ?? r.estado}${r.areaDestino ? ` (destino: ${r.areaDestino})` : ''}`,
      usuario: r.recibidoPor?.nombre,
    })
    if (r.entregadoAlAreaFecha) {
      eventos.push({
        fecha: r.entregadoAlAreaFecha,
        texto: `Entregado al área${r.conformeArea === false ? ' — no conforme' : ''}`,
      })
    }
  }

  for (const f of oc.facturas) {
    eventos.push({ fecha: f.fechaEmision, texto: `Factura ${f.serie ? f.serie + '-' : ''}${f.numero} registrada` })
    if (f.provision) {
      eventos.push({ fecha: f.provision.fechaAprobacion, texto: 'Provisión de pago aprobada', usuario: f.provision.aprobadoPor?.nombre })
      if (f.provision.pago) {
        eventos.push({ fecha: f.provision.pago.fechaPago, texto: 'Pago realizado' })
        if (f.provision.pago.fechaConfirmacion) {
          eventos.push({ fecha: f.provision.pago.fechaConfirmacion, texto: 'Pago confirmado por el proveedor' })
        }
      }
    }
  }

  if (oc.comprobantePagoUrl) {
    eventos.push({ fecha: oc.updatedAt, texto: 'Comprobante de pago adjuntado' })
  }

  for (const h of oc.historial) {
    eventos.push({ fecha: h.createdAt, texto: h.descripcion, usuario: h.usuario?.nombre })
  }

  return eventos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
}

export interface KpisSeguimiento {
  abiertas: number
  cerradas: number
  vencidas: number
  pendientesEntrega: number
  pendientesFactura: number
  pendientesPago: number
  comprometido: number
  facturado: number
  pagado: number
  pendienteMonto: number
  porArea: { area: string; monto: number }[]
  porProveedor: { proveedor: string; monto: number }[]
}

export async function calcularKpisSeguimiento(ordenes: OrdenCompraSeguimiento[]): Promise<KpisSeguimiento> {
  const anio = new Date().getFullYear()
  const egresos = await obtenerEgresosLogistica(anio)

  let abiertas = 0, cerradas = 0, vencidas = 0, pendientesEntrega = 0, pendientesFactura = 0, pendientesPago = 0
  const porProveedorMap = new Map<string, number>()

  for (const oc of ordenes) {
    const estado = calcularEstadoSeguimiento(oc)
    if (estado === 'CANCELADA') continue
    if (estado === 'PAGADA') cerradas++
    else abiertas++
    if (estaVencida(oc)) vencidas++
    if (['EMITIDA', 'CONFIRMADA', 'EN_TRANSITO', 'ENTREGA_PARCIAL'].includes(estado)) pendientesEntrega++
    if (estado === 'ENTREGADA') pendientesFactura++
    if (estado === 'FACTURADA') pendientesPago++
    // Ranking acotado al año actual para no mezclar escalas con el panel de montos (que sí es anual).
    if (oc.createdAt.getFullYear() === anio) {
      porProveedorMap.set(oc.proveedor.razonSocial, (porProveedorMap.get(oc.proveedor.razonSocial) ?? 0) + oc.total)
    }
  }

  const porProveedor = [...porProveedorMap.entries()]
    .map(([proveedor, monto]) => ({ proveedor, monto }))
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 8)

  const porArea = egresos.porDepto.map(d => ({ area: d.departamento, monto: d.facturado }))

  return {
    abiertas,
    cerradas,
    vencidas,
    pendientesEntrega,
    pendientesFactura,
    pendientesPago,
    comprometido: egresos.totales.comprometido,
    facturado: egresos.totales.facturado,
    pagado: egresos.totales.pagado,
    pendienteMonto: Math.max(0, egresos.totales.comprometido - egresos.totales.pagado),
    porArea,
    porProveedor,
  }
}
