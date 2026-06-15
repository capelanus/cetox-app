/**
 * Banners y tarjeta de alertas de vencimiento.
 * Usado en /facturacion, /operaciones/facturas, /oda y /dashboard.
 */
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Alerta, ResumenAlertas } from '@/lib/alertas'

// ── Banner para una página específica ───────────────────────────────────────
// Filtra las alertas al tipo correspondiente y muestra resumen.

interface BannerProps {
  alertas: Alerta[]
  tipo:    'FACTURA_CLIENTE' | 'FACTURA_PROVEEDOR' | 'ODA'
}

const TIPO_LABELS = {
  FACTURA_CLIENTE:   { sing: 'factura por cobrar',  plur: 'facturas por cobrar' },
  FACTURA_PROVEEDOR: { sing: 'factura por pagar',   plur: 'facturas por pagar' },
  ODA:               { sing: 'ODA con entrega',     plur: 'ODAs con entrega' },
}

export function AlertasVencimientoBanner({ alertas, tipo }: BannerProps) {
  const propias  = alertas.filter(a => a.tipo === tipo)
  if (propias.length === 0) return null

  const vencidas = propias.filter(a => a.sev === 'VENCIDA').length
  const hoy      = propias.filter(a => a.sev === 'HOY').length
  const prox     = propias.filter(a => a.sev === 'PROXIMA').length
  const total    = propias.length
  const labels   = TIPO_LABELS[tipo]

  // Color: rojo si hay vencidas, ámbar si solo hoy/próximas
  const haveVencidas = vencidas > 0
  const bg     = haveVencidas ? 'rgba(239,68,68,0.07)' : 'rgba(245,158,11,0.08)'
  const border = haveVencidas ? 'rgba(239,68,68,0.30)' : 'rgba(245,158,11,0.30)'
  const color  = haveVencidas ? '#b91c1c' : '#92400e'

  return (
    <div
      className="rounded-xl p-4 mb-5 flex items-start gap-3"
      style={{ backgroundColor: bg, border: `1px solid ${border}` }}
    >
      <div
        className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
        style={{ backgroundColor: haveVencidas ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.18)' }}
      >
        {haveVencidas
          ? <AlertTriangle className="w-4.5 h-4.5" style={{ color }} />
          : <Clock className="w-4.5 h-4.5" style={{ color }} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color }}>
          {total === 1
            ? `1 ${labels.sing} requiere atención`
            : `${total} ${labels.plur} requieren atención`}
        </p>
        <p className="text-xs mt-1" style={{ color }}>
          {[
            vencidas > 0 ? `${vencidas} vencida${vencidas !== 1 ? 's' : ''}` : null,
            hoy > 0      ? `${hoy} vence${hoy !== 1 ? 'n' : ''} hoy` : null,
            prox > 0     ? `${prox} en los próximos 3 días` : null,
          ].filter(Boolean).join(' · ')}
        </p>
      </div>
    </div>
  )
}

// ── Tarjeta para el dashboard ──────────────────────────────────────────────

interface CardProps {
  resumen: ResumenAlertas
}

export function AlertasVencimientoCard({ resumen }: CardProps) {
  if (resumen.total === 0) return null

  const haveCritical = resumen.totalVencidas + resumen.totalHoy > 0
  const bg     = haveCritical ? '#fef2f2' : '#fffbeb'
  const border = haveCritical ? '#fecaca' : '#fde68a'
  const color  = haveCritical ? '#b91c1c' : '#92400e'
  const accent = haveCritical ? '#ef4444' : '#f59e0b'

  return (
    <div
      className="cetox-card p-5 flex flex-col gap-3"
      style={{ backgroundColor: bg, border: `1px solid ${border}` }}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" style={{ color: accent }} />
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color }}>
          Alertas de vencimiento
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Cell label="Vencidas"    value={resumen.totalVencidas} color="#ef4444" />
        <Cell label="Vencen hoy"  value={resumen.totalHoy}      color="#f59e0b" />
        <Cell label="Próximas 3d" value={resumen.totalProximas} color="#a3a3a3" />
      </div>

      <div className="border-t pt-3 grid grid-cols-1 gap-1.5 text-xs" style={{ borderColor: border }}>
        <Row
          n={resumen.facturasClienteCount}
          label="Facturas por cobrar"
          href="/facturacion"
          color={color}
        />
        <Row
          n={resumen.facturasProveedorCount}
          label="Facturas por pagar"
          href="/operaciones/facturas"
          color={color}
        />
        <Row
          n={resumen.odaCount}
          label="ODAs con entrega"
          href="/oda"
          color={color}
        />
      </div>
    </div>
  )
}

function Cell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold leading-none" style={{ color, fontFamily: 'var(--font-oswald)' }}>
        {value}
      </p>
      <p className="text-[10px] mt-1 font-medium text-slate-500">{label}</p>
    </div>
  )
}

function Row({ n, label, href, color }: { n: number; label: string; href: string; color: string }) {
  if (n === 0) return null
  return (
    <Link
      href={href}
      className="flex items-center justify-between hover:bg-white/40 rounded px-1.5 py-1 transition-colors"
      style={{ color }}
    >
      <span><strong>{n}</strong> {label}</span>
      <ArrowRight className="w-3 h-3 opacity-60" />
    </Link>
  )
}
