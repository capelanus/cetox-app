import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  FileText, CheckCircle2, Clock, XCircle,
  Download, Eye, TrendingUp,
} from 'lucide-react'
import { formatFecha, formatMoneda, formatNumFacturaCliente, formatNumCotizacion } from '@/lib/format'

// ── Estado badges ─────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PENDIENTE: { label: 'Pendiente',  color: '#92400e', bg: '#fef3c7', icon: Clock         },
  PAGADA:    { label: 'Pagada',     color: '#065f46', bg: '#d1fae5', icon: CheckCircle2   },
  ANULADA:   { label: 'Anulada',    color: '#7f1d1d', bg: '#fee2e2', icon: XCircle        },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.PENDIENTE
  const Icon = cfg.icon
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function FacturacionPage() {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_CALIDAD', 'GERENTE_TECNICO', 'DIRECTOR_ADMINISTRACION', 'COORDINADOR_CALIDAD'])

  const facturas = await prisma.facturaCliente.findMany({
    include: {
      cliente:    true,
      cotizacion: true,
      creadoPor:  { select: { nombre: true } },
    },
    orderBy: [{ anio: 'desc' }, { numero: 'desc' }],
  })

  // KPIs
  const totalPendiente = facturas.filter(f => f.estado === 'PENDIENTE').reduce((s, f) => s + f.total, 0)
  const totalPagado    = facturas.filter(f => f.estado === 'PAGADA').reduce((s, f) => s + f.total, 0)
  const countPendiente = facturas.filter(f => f.estado === 'PENDIENTE').length
  const countPagada    = facturas.filter(f => f.estado === 'PAGADA').length

  return (
    <div>
      {/* ── Header ── */}
      <div className="cetox-page-header">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <FileText className="h-5 w-5" style={{ color: '#4AC3B2' }} />
            <h1 className="cetox-page-title">Facturación</h1>
          </div>
          <p className="cetox-page-subtitle">
            Facturas emitidas a clientes generadas desde cotizaciones aceptadas
          </p>
        </div>
        <Link href="/cotizaciones">
          <button className="cetox-btn-secondary flex items-center gap-1.5 text-sm px-4 py-2">
            <FileText className="h-4 w-4" />
            Ver Cotizaciones
          </button>
        </Link>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="cetox-stat">
          <p className="cetox-stat-label">Total Facturas</p>
          <p className="cetox-stat-value">{facturas.length}</p>
        </div>
        <div className="cetox-stat">
          <p className="cetox-stat-label">Pendientes de cobro</p>
          <p className="cetox-stat-value" style={{ color: '#92400e' }}>{countPendiente}</p>
          <p className="text-xs" style={{ color: '#808080' }}>
            {totalPendiente > 0 ? `≈ ${new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(totalPendiente)}` : '—'}
          </p>
        </div>
        <div className="cetox-stat">
          <p className="cetox-stat-label">Cobradas</p>
          <p className="cetox-stat-value" style={{ color: '#065f46' }}>{countPagada}</p>
          <p className="text-xs" style={{ color: '#808080' }}>
            {totalPagado > 0 ? `≈ ${new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(totalPagado)}` : '—'}
          </p>
        </div>
        <div className="cetox-stat">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" style={{ color: '#4AC3B2' }} />
            <p className="cetox-stat-label">Cobrado total</p>
          </div>
          <p className="cetox-stat-value text-2xl">
            {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(totalPagado)}
          </p>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="cetox-card overflow-hidden">
        {facturas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <FileText className="h-12 w-12" style={{ color: '#e2e8f0' }} />
            <p className="font-semibold" style={{ color: '#94a3b8' }}>Sin facturas emitidas aún</p>
            <p className="text-sm" style={{ color: '#cbd5e1' }}>
              Genera una factura desde el detalle de una cotización ACEPTADA
            </p>
            <Link href="/cotizaciones">
              <button className="cetox-btn-primary mt-2 flex items-center gap-1.5 text-sm px-4 py-2">
                Ir a Cotizaciones
              </button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="cetox-table">
              <thead>
                <tr>
                  <th>N° Factura</th>
                  <th>Cliente</th>
                  <th>Cotización</th>
                  <th>Emisión</th>
                  <th>Vencimiento</th>
                  <th>Moneda</th>
                  <th className="text-right">Total</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {facturas.map(f => (
                  <tr key={f.id}>
                    <td>
                      <span className="font-mono font-bold text-xs" style={{ color: '#13602C' }}>
                        {formatNumFacturaCliente(f.serie, f.numero, f.anio)}
                      </span>
                    </td>
                    <td>
                      <p className="font-semibold text-sm" style={{ color: '#1e293b' }}>
                        {f.cliente.razonSocial}
                      </p>
                      <p className="text-xs" style={{ color: '#94a3b8' }}>{f.cliente.ruc}</p>
                    </td>
                    <td>
                      <Link
                        href={`/cotizaciones/${f.cotizacionId}`}
                        className="text-xs font-medium hover:underline"
                        style={{ color: '#4AC3B2' }}
                      >
                        {formatNumCotizacion(f.cotizacion.numero, f.cotizacion.anio, f.cotizacion.sufijo)}
                      </Link>
                    </td>
                    <td className="text-sm">{formatFecha(f.fechaEmision)}</td>
                    <td className="text-sm">
                      {f.fechaVencimiento ? (
                        <span style={{ color: new Date(f.fechaVencimiento) < new Date() && f.estado === 'PENDIENTE' ? '#dc2626' : 'inherit' }}>
                          {formatFecha(f.fechaVencimiento)}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: '#EAF4F4', color: '#13602C' }}>
                        {f.moneda}
                      </span>
                    </td>
                    <td className="text-right font-bold text-sm" style={{ color: '#1e293b' }}>
                      {formatMoneda(f.total, f.moneda as 'USD' | 'PEN')}
                    </td>
                    <td>
                      <EstadoBadge estado={f.estado} />
                    </td>
                    <td>
                      <div className="flex items-center gap-1 justify-end">
                        <Link href={`/facturacion/${f.id}`} title="Ver detalle">
                          <button
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: '#64748b' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </Link>
                        <a href={`/api/facturacion/${f.id}/generar-pdf`} target="_blank" rel="noreferrer" title="Descargar PDF">
                          <button
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: '#13602C' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#dcfce7')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
