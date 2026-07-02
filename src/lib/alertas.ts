/**
 * Sistema de alertas de vencimiento para FacturaCliente (ventas pendientes),
 * Factura (pagos a proveedor pendientes) y ODA (entrega de informe).
 *
 * Umbrales: avisar desde 3 días antes hasta indefinidamente vencido.
 *
 * Usado por:
 *  - /api/alertas/sync (genera Notificacion en BD)
 *  - Banners en páginas correspondientes
 *  - Tarjeta resumen en /dashboard
 */
import { prisma } from './prisma'

export const DIAS_ANTICIPACION = 3

// ── Cálculo de fechas frontera ──────────────────────────────────────────────
function rangoFronteraVencimiento(): { hasta: Date; hoyMidnight: Date } {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const hasta = new Date(hoy)
  hasta.setDate(hasta.getDate() + DIAS_ANTICIPACION)
  hasta.setHours(23, 59, 59, 999)
  return { hasta, hoyMidnight: hoy }
}

export type Severidad = 'VENCIDA' | 'HOY' | 'PROXIMA'

export function severidad(fechaVencimiento: Date | null | undefined, hoy: Date): { sev: Severidad; dias: number } {
  if (!fechaVencimiento) return { sev: 'PROXIMA', dias: 0 }
  const f = new Date(fechaVencimiento)
  f.setHours(0, 0, 0, 0)
  const diff = Math.round((f.getTime() - hoy.getTime()) / 86_400_000)
  if (diff < 0)  return { sev: 'VENCIDA', dias: Math.abs(diff) }
  if (diff === 0) return { sev: 'HOY', dias: 0 }
  return { sev: 'PROXIMA', dias: diff }
}

// ── Tipos de salida ─────────────────────────────────────────────────────────
export interface AlertaFacturaCliente {
  tipo: 'FACTURA_CLIENTE'
  id: string
  serie: string
  numero: number
  anio: number
  cliente: string
  total: number
  moneda: string
  fechaVencimiento: Date
  sev: Severidad
  dias: number
}

export interface AlertaFacturaProveedor {
  tipo: 'FACTURA_PROVEEDOR'
  id: string
  serie: string | null
  numero: string
  proveedor: string
  total: number
  moneda: string
  fechaVencimiento: Date
  sev: Severidad
  dias: number
}

export interface AlertaODA {
  tipo: 'ODA'
  id: string
  numero: number
  anio: number
  area: string
  cliente: string
  fechaEntregaCompromiso: Date
  estado: string
  sev: Severidad
  dias: number
}

export type Alerta = AlertaFacturaCliente | AlertaFacturaProveedor | AlertaODA

// ── Estados que cuentan como "pendiente" ────────────────────────────────────
const FACT_CLIENTE_PENDIENTE = ['PENDIENTE']                   // PAGADA/ANULADA quedan fuera
const FACT_PROV_PENDIENTE    = ['REGISTRADA', 'APROBADA']      // PAGADA/ANULADA quedan fuera
const ODA_PENDIENTE_INFORME  = ['EMITIDA', 'EN_EJECUCION']     // sin informe emitido aún

// ── Query unificada ─────────────────────────────────────────────────────────
export async function obtenerAlertasVencimiento(): Promise<Alerta[]> {
  const { hasta, hoyMidnight } = rangoFronteraVencimiento()

  // Vencimiento ≤ hasta(+3d) → incluye próximas, hoy y vencidas
  const [facsCliente, facsProveedor, odas] = await Promise.all([
    prisma.facturaCliente.findMany({
      where: {
        estado:           { in: FACT_CLIENTE_PENDIENTE },
        fechaVencimiento: { lte: hasta, not: null },
      },
      include: { cliente: { select: { razonSocial: true } } },
      orderBy: { fechaVencimiento: 'asc' },
    }),
    prisma.factura.findMany({
      where: {
        estado:           { in: FACT_PROV_PENDIENTE },
        fechaVencimiento: { lte: hasta, not: null },
      },
      include: {
        ordenCompra: { include: { proveedor: { select: { razonSocial: true } } } },
      },
      orderBy: { fechaVencimiento: 'asc' },
    }),
    prisma.oDA.findMany({
      where: {
        estado:                 { in: ODA_PENDIENTE_INFORME },
        fechaEntregaCompromiso: { lte: hasta },
      },
      include: { set: { include: { cliente: { select: { razonSocial: true } } } } },
      orderBy: { fechaEntregaCompromiso: 'asc' },
    }),
  ])

  const alertas: Alerta[] = []

  for (const f of facsCliente) {
    if (!f.fechaVencimiento) continue
    const { sev, dias } = severidad(f.fechaVencimiento, hoyMidnight)
    alertas.push({
      tipo: 'FACTURA_CLIENTE',
      id: f.id, serie: f.serie, numero: f.numero, anio: f.anio,
      cliente: f.cliente.razonSocial,
      total: f.total, moneda: f.moneda,
      fechaVencimiento: f.fechaVencimiento,
      sev, dias,
    })
  }

  for (const f of facsProveedor) {
    if (!f.fechaVencimiento) continue
    const { sev, dias } = severidad(f.fechaVencimiento, hoyMidnight)
    alertas.push({
      tipo: 'FACTURA_PROVEEDOR',
      id: f.id, serie: f.serie, numero: f.numero,
      proveedor: f.ordenCompra.proveedor?.razonSocial ?? '—',
      total: f.total, moneda: f.moneda,
      fechaVencimiento: f.fechaVencimiento,
      sev, dias,
    })
  }

  for (const o of odas) {
    const { sev, dias } = severidad(o.fechaEntregaCompromiso, hoyMidnight)
    alertas.push({
      tipo: 'ODA',
      id: o.id, numero: o.numero, anio: o.anio, area: o.area,
      cliente: o.set?.cliente?.razonSocial ?? '—',
      fechaEntregaCompromiso: o.fechaEntregaCompromiso,
      estado: o.estado,
      sev, dias,
    })
  }

  return alertas
}

// ── Sincronizar notificaciones (idempotente por día) ────────────────────────
// Crea filas en Notificacion para usuarios destinatarios. Llamado desde el
// dashboard al cargar (best-effort) y desde /api/alertas/sync (manual/cron).
const ROLES_DESTINATARIOS = [
  'ADMINISTRACION',
  'DIRECTOR_ADMINISTRACION',
  'SUPER_ADMIN',
  'DIRECTOR_CALIDAD',
  'COORDINADOR_CALIDAD',
]

export async function sincronizarNotificacionesAlertas(): Promise<{ creadas: number }> {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const [alertas, destinatarios] = await Promise.all([
    obtenerAlertasVencimiento(),
    prisma.usuario.findMany({
      where: { activo: true, rol: { in: ROLES_DESTINATARIOS } },
      select: { id: true },
    }),
  ])
  if (alertas.length === 0) return { creadas: 0 }

  const counts = {
    facCliVencidas:  alertas.filter(a => a.tipo === 'FACTURA_CLIENTE'   && a.sev === 'VENCIDA').length,
    facCliHoy:       alertas.filter(a => a.tipo === 'FACTURA_CLIENTE'   && a.sev === 'HOY').length,
    facProvVencidas: alertas.filter(a => a.tipo === 'FACTURA_PROVEEDOR' && a.sev === 'VENCIDA').length,
    facProvHoy:      alertas.filter(a => a.tipo === 'FACTURA_PROVEEDOR' && a.sev === 'HOY').length,
    odaVencidas:     alertas.filter(a => a.tipo === 'ODA' && a.sev === 'VENCIDA').length,
    odaHoy:          alertas.filter(a => a.tipo === 'ODA' && a.sev === 'HOY').length,
  }

  type NotifPayload = { tipo: string; titulo: string; mensaje: string; enlace: string }
  const payloads: NotifPayload[] = []

  if (counts.facCliVencidas + counts.facCliHoy > 0) {
    payloads.push({
      tipo: 'FACTURA_CLIENTE_VENCE',
      titulo: 'Facturas a clientes por cobrar',
      mensaje: [
        counts.facCliVencidas ? `${counts.facCliVencidas} vencida${counts.facCliVencidas !== 1 ? 's' : ''}` : null,
        counts.facCliHoy      ? `${counts.facCliHoy} vence${counts.facCliHoy !== 1 ? 'n' : ''} hoy` : null,
      ].filter(Boolean).join(' · '),
      enlace: '/facturacion',
    })
  }
  if (counts.facProvVencidas + counts.facProvHoy > 0) {
    payloads.push({
      tipo: 'FACTURA_PROVEEDOR_VENCE',
      titulo: 'Facturas de proveedor por pagar',
      mensaje: [
        counts.facProvVencidas ? `${counts.facProvVencidas} vencida${counts.facProvVencidas !== 1 ? 's' : ''}` : null,
        counts.facProvHoy      ? `${counts.facProvHoy} vence${counts.facProvHoy !== 1 ? 'n' : ''} hoy` : null,
      ].filter(Boolean).join(' · '),
      enlace: '/operaciones/facturas',
    })
  }
  if (counts.odaVencidas + counts.odaHoy > 0) {
    payloads.push({
      tipo: 'ODA_VENCE',
      titulo: 'ODAs próximas a vencer entrega',
      mensaje: [
        counts.odaVencidas ? `${counts.odaVencidas} con entrega vencida` : null,
        counts.odaHoy      ? `${counts.odaHoy} vence${counts.odaHoy !== 1 ? 'n' : ''} hoy` : null,
      ].filter(Boolean).join(' · '),
      enlace: '/oda',
    })
  }

  let creadas = 0
  for (const dest of destinatarios) {
    for (const p of payloads) {
      const existe = await prisma.notificacion.findFirst({
        where: { usuarioId: dest.id, tipo: p.tipo, createdAt: { gte: hoy } },
        select: { id: true },
      })
      if (existe) continue
      await prisma.notificacion.create({ data: { usuarioId: dest.id, ...p } })
      creadas++
    }
  }
  return { creadas }
}

// ── Notificaciones de inicio de aseguramiento (2 días antes) ───────────────
const ROLES_CALIDAD = ['DIRECTOR_CALIDAD', 'COORDINADOR_CALIDAD', 'SUPER_ADMIN']

export async function sincronizarNotificacionesAseguramiento(): Promise<{ creadas: number }> {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  // Objetivo: fechaInicio exactamente en 2 días
  const en2dias = new Date(hoy)
  en2dias.setDate(en2dias.getDate() + 2)
  const en2diasFin = new Date(en2dias)
  en2diasFin.setHours(23, 59, 59, 999)

  const [items, destinatarios] = await Promise.all([
    prisma.aseguramientoItem.findMany({
      where: { fechaInicio: { gte: en2dias, lte: en2diasFin } },
      include: { ensayo: { select: { nombre: true } } },
    }),
    prisma.usuario.findMany({
      where: { activo: true, rol: { in: ROLES_CALIDAD } },
      select: { id: true },
    }),
  ])
  if (items.length === 0) return { creadas: 0 }

  const fecha = en2dias.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })

  let creadas = 0
  for (const dest of destinatarios) {
    for (const item of items) {
      const tipo = 'ASEGURAMIENTO_INICIO'
      const existe = await prisma.notificacion.findFirst({
        where: { usuarioId: dest.id, tipo, enlace: `/calidad/aseguramiento#${item.id}`, createdAt: { gte: hoy } },
        select: { id: true },
      })
      if (existe) continue
      await prisma.notificacion.create({
        data: {
          usuarioId: dest.id,
          tipo,
          titulo: 'Análisis próximo a iniciar',
          mensaje: `${item.muestra} – ${item.ensayo.nombre} inicia el ${fecha}`,
          enlace: `/calidad/aseguramiento#${item.id}`,
        },
      })
      creadas++
    }
  }
  return { creadas }
}

// ── Conteos agrupados (para tarjetas resumen) ───────────────────────────────
export interface ResumenAlertas {
  totalVencidas:        number
  totalHoy:             number
  totalProximas:        number
  facturasClienteCount: number
  facturasProveedorCount: number
  odaCount:             number
  total:                number
}

export async function obtenerResumenAlertas(): Promise<ResumenAlertas> {
  const alertas = await obtenerAlertasVencimiento()
  return {
    totalVencidas:          alertas.filter(a => a.sev === 'VENCIDA').length,
    totalHoy:               alertas.filter(a => a.sev === 'HOY').length,
    totalProximas:          alertas.filter(a => a.sev === 'PROXIMA').length,
    facturasClienteCount:   alertas.filter(a => a.tipo === 'FACTURA_CLIENTE').length,
    facturasProveedorCount: alertas.filter(a => a.tipo === 'FACTURA_PROVEEDOR').length,
    odaCount:               alertas.filter(a => a.tipo === 'ODA').length,
    total:                  alertas.length,
  }
}
