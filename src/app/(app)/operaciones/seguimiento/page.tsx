import { requireOperaciones, hasRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { formatFecha, formatNumOrdenCompra } from '@/lib/format'
import { AREA_SOLICITANTE_LABELS } from '@/lib/constants'
import {
  obtenerOrdenesSeguimiento,
  calcularKpisSeguimiento,
  calcularEstadoSeguimiento,
  calcularAvanceEntrega,
  calcularEstadoItem,
  construirTimeline,
  estaVencida,
  ESTADO_SEGUIMIENTO_LABELS,
  ESTADO_SEGUIMIENTO_BADGE,
  ESTADO_ITEM_LABELS,
  ESTADO_ITEM_BADGE,
} from '@/lib/seguimiento-oc'
import SeguimientoClient from './seguimiento-client'

export default async function SeguimientoPage() {
  const session = await requireOperaciones()
  // Documentos de pago (comprobante/voucher) se restringen a Calidad, igual que
  // en /operaciones/ordenes-compra/[id] y /operaciones/pagos — logística ve el
  // estatus de pago pero no el comprobante bancario en sí.
  const esCalidad = hasRol(session.user.rol, 'DIRECTOR_CALIDAD')

  const [ordenes, responsables] = await Promise.all([
    obtenerOrdenesSeguimiento(),
    prisma.usuario.findMany({
      where: { rol: { in: ['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA', 'DIRECTOR_CALIDAD', 'COORDINADOR_CALIDAD'] }, activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    }),
  ])

  const kpis = await calcularKpisSeguimiento(ordenes)

  const filas = ordenes.map(oc => {
    const estado = calcularEstadoSeguimiento(oc)
    const documentos: { label: string; url: string }[] = []
    if (oc.facturaOcUrl) documentos.push({ label: 'Factura de la OC', url: oc.facturaOcUrl })
    if (esCalidad && oc.comprobantePagoUrl) documentos.push({ label: 'Comprobante de pago', url: oc.comprobantePagoUrl })
    for (const f of oc.facturas) {
      if (f.archivoUrl) documentos.push({ label: `Factura ${f.serie ? f.serie + '-' : ''}${f.numero}`, url: f.archivoUrl })
      if (esCalidad && f.provision?.pago?.voucherUrl) documentos.push({ label: 'Voucher de pago', url: f.provision.pago.voucherUrl })
    }
    for (const c of oc.cotizacionesProveedor) {
      if (c.cotizacionProveedor.archivoUrl) {
        documentos.push({
          label: `Cotización COTP-${String(c.cotizacionProveedor.numero).padStart(4, '0')}-${c.cotizacionProveedor.anio}`,
          url: c.cotizacionProveedor.archivoUrl,
        })
      }
    }

    return {
      id: oc.id,
      numero: formatNumOrdenCompra(oc.numero, oc.anio),
      proveedor: oc.proveedor.razonSocial,
      tipo: oc.tipo,
      area: AREA_SOLICITANTE_LABELS[oc.requerimiento.areaSolicitante] ?? oc.requerimiento.areaSolicitante,
      responsable: oc.responsableActual ? { id: oc.responsableActual.id, nombre: oc.responsableActual.nombre } : null,
      estado,
      estadoLabel: ESTADO_SEGUIMIENTO_LABELS[estado],
      estadoBadge: ESTADO_SEGUIMIENTO_BADGE[estado],
      vencida: estaVencida(oc),
      avance: calcularAvanceEntrega(oc),
      moneda: oc.moneda,
      total: oc.total,
      emitidoPor: oc.emitidoPor?.nombre ?? '—',
      fechaEmision: formatFecha(oc.createdAt),
      fechaEntregaEstimada: oc.fechaEntregaEstimada ? formatFecha(oc.fechaEntregaEstimada) : null,
      observaciones: oc.observaciones,
      items: oc.items.map(item => {
        const estadoItem = calcularEstadoItem(item)
        return {
          id: item.id,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          cantidadRecibida: item.cantidadRecibida,
          unidad: item.unidad,
          precioUnitario: item.precioUnitario,
          estado: estadoItem,
          estadoLabel: ESTADO_ITEM_LABELS[estadoItem],
          estadoBadge: ESTADO_ITEM_BADGE[estadoItem],
          facturaUrl: item.facturaUrl,
        }
      }),
      documentos,
      timeline: construirTimeline(oc).map(ev => ({
        fecha: formatFecha(ev.fecha),
        texto: ev.texto,
        usuario: ev.usuario,
      })),
    }
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
          Seguimiento de Órdenes e Ítems
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Estado en tiempo real de cada orden de compra: entrega, facturación, pago y responsable.
        </p>
      </div>

      <SeguimientoClient ordenes={filas} kpis={kpis} responsables={responsables} />
    </div>
  )
}
