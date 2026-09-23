import { prisma } from '@/lib/prisma'
import { obtenerEgresosLogistica } from '@/lib/egresos-logistica'
import { ESTADO_RECEPCION_LABELS } from '@/lib/constants'
import { formatNumRequerimiento } from '@/lib/format'

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
      requerimiento: {
        select: {
          id: true,
          numero: true,
          anio: true,
          areaSolicitante: true,
          estado: true,
          fechaRequerida: true,
          createdAt: true,
          creadoPor: { select: { nombre: true } },
        },
      },
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
      documentos: { orderBy: { createdAt: 'asc' } },
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
  | 'CERRADA'
  | 'CANCELADA'

export const ESTADO_SEGUIMIENTO_LABELS: Record<EstadoSeguimiento, string> = {
  EMITIDA: 'Emitida',
  CONFIRMADA: 'Confirmada por proveedor',
  EN_TRANSITO: 'En tránsito',
  ENTREGA_PARCIAL: 'Entrega parcial',
  ENTREGADA: 'Entregada',
  FACTURADA: 'Facturada — pendiente de pago',
  PAGADA: 'Pagada',
  CERRADA: 'Cerrada',
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
  CERRADA: 'bg-green-100 text-green-700',
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

// Avance sobre el ciclo completo de la orden, no solo la entrega: una OC
// entregada pero sin factura ni pago no está terminada, y la grilla debe
// mostrarlo. La entrega pesa más porque es la etapa con avance granular.
const PESO_EMITIDA = 25, PESO_ENTREGA = 35, PESO_FACTURA = 20, PESO_PAGO = 20

export function calcularAvanceOC(oc: OrdenCompraSeguimiento): number {
  const hitos = calcularHitos(oc)
  let avance = PESO_EMITIDA
  avance += (calcularAvanceEntrega(oc) / 100) * PESO_ENTREGA
  if (hitos.factura.ok) avance += PESO_FACTURA
  if (hitos.pagado.ok) avance += PESO_PAGO
  return Math.round(avance)
}

export function calcularEstadoSeguimiento(oc: OrdenCompraSeguimiento): EstadoSeguimiento {
  if (oc.estado === 'CANCELADA') return 'CANCELADA'
  // Cierre formal: lo marca logística a mano desde la OC y es terminal, por eso
  // gana sobre las señales derivadas (una OC puede cerrarse sin haberse pagado
  // por este sistema, p.ej. si el pago se gestionó fuera).
  if (oc.estado === 'CERRADA') return 'CERRADA'

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

const ESTADOS_TERMINALES: EstadoSeguimiento[] = ['PAGADA', 'CERRADA', 'CANCELADA']

// Preaviso: una OC pasa a "por vencer" (ámbar) estos días antes de la fecha
// comprometida, para que logística actúe antes de que se ponga en rojo.
export const DIAS_PREAVISO_VENCIMIENTO = 7

// Fechas que la OC todavía debe cumplir: la de entrega solo cuenta mientras no
// se haya recibido, y la de cada factura mientras siga impaga.
function fechasCompromisoPendientes(oc: OrdenCompraSeguimiento, estado: EstadoSeguimiento): Date[] {
  const fechas: Date[] = []
  if (oc.fechaEntregaEstimada && !['ENTREGADA', 'FACTURADA'].includes(estado)) {
    fechas.push(oc.fechaEntregaEstimada)
  }
  for (const f of oc.facturas) {
    if (f.fechaVencimiento && f.estado !== 'PAGADA') fechas.push(f.fechaVencimiento)
  }
  return fechas
}

export function estaVencida(oc: OrdenCompraSeguimiento): boolean {
  const estado = calcularEstadoSeguimiento(oc)
  if (ESTADOS_TERMINALES.includes(estado)) return false
  const hoy = new Date()
  return fechasCompromisoPendientes(oc, estado).some(f => f < hoy)
}

export function estaPorVencer(oc: OrdenCompraSeguimiento): boolean {
  const estado = calcularEstadoSeguimiento(oc)
  if (ESTADOS_TERMINALES.includes(estado)) return false
  const hoy = new Date()
  const limite = new Date(hoy)
  limite.setDate(limite.getDate() + DIAS_PREAVISO_VENCIMIENTO)
  const fechas = fechasCompromisoPendientes(oc, estado)
  // Si ya hay algo vencido manda el rojo, no el ámbar.
  if (fechas.some(f => f < hoy)) return false
  return fechas.some(f => f <= limite)
}

// Qué falta por hacer, en términos de la acción concreta que destraba la orden.
export function proximaAccion(oc: OrdenCompraSeguimiento): string {
  const estado = calcularEstadoSeguimiento(oc)
  switch (estado) {
    case 'CANCELADA': return 'Ninguna — orden cancelada'
    case 'CERRADA':   return 'Ninguna — orden cerrada'
    case 'PAGADA':    return 'Cerrar la orden'
    case 'FACTURADA': return 'Gestionar el pago al proveedor'
    case 'ENTREGADA': return 'Registrar la factura del proveedor'
    case 'ENTREGA_PARCIAL': {
      const faltan = oc.items.filter(i => i.cantidadRecibida < i.cantidad).length
      return `Completar la recepción — ${faltan} ítem(s) pendiente(s)`
    }
    case 'EN_TRANSITO': return 'Recibir la mercadería y registrar la recepción'
    case 'CONFIRMADA':  return 'Hacer seguimiento del despacho del proveedor'
    default:            return 'Confirmar la orden con el proveedor'
  }
}

export type EstadoItem = 'PENDIENTE' | 'PROGRAMADO' | 'EN_TRANSITO' | 'PARCIAL' | 'ENTREGADO'

// El estado del ítem mezcla lo recibido con la etapa de la orden: un ítem sin
// recibir se lee distinto según la OC esté recién emitida, en tránsito o —si es
// un servicio— ya agendado con el proveedor.
export function calcularEstadoItem(
  item: { cantidad: number; cantidadRecibida: number; fechaProgramada?: Date | null; fechaRealizada?: Date | null },
  oc?: { estado: string },
): EstadoItem {
  if (item.fechaRealizada) return 'ENTREGADO'
  if (item.cantidadRecibida >= item.cantidad && item.cantidad > 0) return 'ENTREGADO'
  if (item.cantidadRecibida > 0) return 'PARCIAL'
  if (item.fechaProgramada) return 'PROGRAMADO'
  if (oc?.estado === 'EN_TRANSITO') return 'EN_TRANSITO'
  return 'PENDIENTE'
}

export const ESTADO_ITEM_LABELS: Record<EstadoItem, string> = {
  PENDIENTE: 'Pendiente',
  PROGRAMADO: 'Programado',
  EN_TRANSITO: 'En tránsito',
  PARCIAL: 'Parcial',
  ENTREGADO: 'Entregado',
}

export const ESTADO_ITEM_BADGE: Record<EstadoItem, string> = {
  PENDIENTE: 'bg-gray-100 text-gray-500',
  PROGRAMADO: 'bg-blue-100 text-blue-700',
  EN_TRANSITO: 'bg-orange-100 text-orange-700',
  PARCIAL: 'bg-amber-100 text-amber-700',
  ENTREGADO: 'bg-green-100 text-green-700',
}

export interface Hito {
  ok: boolean
  fecha: Date | null
  nota?: string
}

// Los cuatro hitos que logística revisa en la grilla: envío de la OC, entrega,
// recepción de la factura y pago.
export function calcularHitos(oc: OrdenCompraSeguimiento): {
  enviada: Hito
  entregado: Hito
  factura: Hito
  pagado: Hito
} {
  const entregaCompleta = oc.items.length > 0 && oc.items.every(i => i.fechaRealizada || i.cantidadRecibida >= i.cantidad)
  const fechasEntrega = [
    ...oc.items.map(i => i.fechaRealizada ?? i.fechaEntregado).filter((f): f is Date => Boolean(f)),
    ...oc.recepciones.map(r => r.fechaRecepcion),
  ]

  const facturas = [...oc.facturas].sort((a, b) => a.fechaEmision.getTime() - b.fechaEmision.getTime())
  const pagos = oc.facturas.map(f => f.provision?.pago).filter(p => p && PAGOS_REALIZADOS.includes(p.estado))

  return {
    enviada: { ok: true, fecha: oc.createdAt },
    entregado: {
      ok: entregaCompleta,
      fecha: fechasEntrega.length > 0 ? new Date(Math.max(...fechasEntrega.map(f => f.getTime()))) : null,
    },
    factura: {
      ok: facturas.length > 0 || Boolean(oc.facturaOcUrl),
      fecha: facturas[0]?.fechaEmision ?? null,
    },
    pagado: {
      ok: haySenalDePago(oc),
      fecha: pagos[0]?.fechaPago ?? (oc.comprobantePagoUrl ? oc.updatedAt : null),
    },
  }
}

// Días que faltan para la fecha comprometida más próxima; negativo si ya pasó.
export function diasParaCompromiso(oc: OrdenCompraSeguimiento): number | null {
  const estado = calcularEstadoSeguimiento(oc)
  if (ESTADOS_TERMINALES.includes(estado)) return null
  const fechas = fechasCompromisoPendientes(oc, estado)
  if (fechas.length === 0) return null
  const proxima = Math.min(...fechas.map(f => f.getTime()))
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.round((proxima - hoy.getTime()) / 86400000)
}

export interface EventoTimeline {
  fecha: Date
  texto: string
  usuario?: string
}

export function construirTimeline(oc: OrdenCompraSeguimiento): EventoTimeline[] {
  const eventos: EventoTimeline[] = [
    {
      fecha: oc.requerimiento.createdAt,
      texto: `Solicitud ${formatNumRequerimiento(oc.requerimiento.numero, oc.requerimiento.anio)} registrada`,
      usuario: oc.requerimiento.creadoPor?.nombre,
    },
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
  total: number
  enProceso: number
  enTransito: number
  entregadas: number
  abiertas: number
  cerradas: number
  vencidas: number
  porVencer: number
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

  let abiertas = 0, cerradas = 0, vencidas = 0, porVencer = 0, pendientesEntrega = 0, pendientesFactura = 0, pendientesPago = 0
  let total = 0, enProceso = 0, enTransito = 0, entregadas = 0
  const porProveedorMap = new Map<string, number>()

  for (const oc of ordenes) {
    const estado = calcularEstadoSeguimiento(oc)
    if (estado === 'CANCELADA') continue
    total++
    const hitos = calcularHitos(oc)
    if (hitos.entregado.ok) entregadas++
    else enProceso++
    if (estado === 'EN_TRANSITO') enTransito++
    // Una OC pagada ya no exige acción de logística, así que cuenta como cerrada
    // aunque todavía no tenga el cierre formal marcado sobre la orden.
    if (estado === 'PAGADA' || estado === 'CERRADA') cerradas++
    else abiertas++
    if (estaVencida(oc)) vencidas++
    if (estaPorVencer(oc)) porVencer++
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
    total,
    enProceso,
    enTransito,
    entregadas,
    abiertas,
    cerradas,
    vencidas,
    porVencer,
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
