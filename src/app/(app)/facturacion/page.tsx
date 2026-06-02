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
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ backgroundColor: '#13602C' }}>
                  {[
                    { label: 'FECHA',                 align: 'center' },
                    { label: 'CONCEPTO',              align: 'left'   },
                    { label: 'Nº OPERACIÓN',          align: 'center' },
                    { label: 'FACTURA',               align: 'center' },
                    { label: '% DETRACCIÓN',          align: 'center' },
                    { label: 'SUJETA A\nDETRACCIÓN', align: 'center' },
                    { label: 'OBSERVACIONES',         align: 'left'   },
                    { label: 'MONTO $\nINGRESADO',   align: 'right'  },
                    { label: 'ADELANTO\nSET',         align: 'right'  },
                    { label: 'SALDO\nSET',            align: 'right'  },
                    { label: '',                      align: 'center' },
                  ].map((col, i) => (
                    <th
                      key={i}
                      style={{
                        color: 'white',
                        padding: '10px 12px',
                        fontFamily: 'var(--font-montserrat)',
                        fontWeight: 700,
                        fontSize: 10,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        textAlign: col.align as 'left' | 'center' | 'right',
                        borderRight: i < 10 ? '1px solid rgba(255,255,255,0.18)' : 'none',
                        whiteSpace: 'pre-line',
                        lineHeight: 1.35,
                        verticalAlign: 'middle',
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {facturas.map((f, idx) => (
                  <tr
                    key={f.id}
                    style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f4faf7', borderBottom: '1px solid #e2e8f0' }}
                  >
                    {/* FECHA */}
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#475569', fontSize: 12, whiteSpace: 'nowrap', borderRight: '1px solid #e9eff5' }}>
                      {formatFecha(f.fechaEmision)}
                    </td>
                    {/* CONCEPTO */}
                    <td style={{ padding: '10px 12px', borderRight: '1px solid #e9eff5', maxWidth: 200 }}>
                      {f.concepto ? (
                        <p style={{ fontSize: 12, color: '#1e293b', fontWeight: 600 }}>{f.concepto}</p>
                      ) : (
                        <p style={{ fontSize: 12, color: '#1e293b', fontWeight: 600 }}>{f.cliente.razonSocial}</p>
                      )}
                    </td>
                    {/* Nº OPERACIÓN */}
                    <td style={{ padding: '10px 12px', textAlign: 'center', borderRight: '1px solid #e9eff5' }}>
                      {f.numeroOperacion ? (
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#334155' }}>{f.numeroOperacion}</span>
                      ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    {/* FACTURA */}
                    <td style={{ padding: '10px 12px', textAlign: 'center', borderRight: '1px solid #e9eff5' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11, color: '#13602C' }}>
                        {formatNumFacturaCliente(f.serie, f.numero, f.anio)}
                      </span>
                    </td>
                    {/* % DETRACCIÓN */}
                    <td style={{ padding: '10px 12px', textAlign: 'center', borderRight: '1px solid #e9eff5' }}>
                      {f.porcentajeDetraccion != null ? (
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{f.porcentajeDetraccion}%</span>
                      ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    {/* SUJETA A DETRACCIÓN */}
                    <td style={{ padding: '10px 12px', textAlign: 'center', borderRight: '1px solid #e9eff5' }}>
                      {f.sujetaDetraccion != null ? (
                        <span
                          style={{
                            fontSize: 11, fontWeight: 700,
                            padding: '2px 8px', borderRadius: 4,
                            backgroundColor: f.sujetaDetraccion ? '#dcfce7' : '#fee2e2',
                            color: f.sujetaDetraccion ? '#065f46' : '#7f1d1d',
                          }}
                        >
                          {f.sujetaDetraccion ? 'SI' : 'NO'}
                        </span>
                      ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    {/* OBSERVACIONES */}
                    <td style={{ padding: '10px 12px', borderRight: '1px solid #e9eff5', maxWidth: 220 }}>
                      <p style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                        {f.notas ?? '—'}
                      </p>
                    </td>
                    {/* MONTO $ INGRESADO */}
                    <td style={{ padding: '10px 12px', textAlign: 'right', borderRight: '1px solid #e9eff5' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#13602C' }}>
                        {f.montoIngresado != null
                          ? formatMoneda(f.montoIngresado, f.moneda as 'USD' | 'PEN')
                          : formatMoneda(f.total, f.moneda as 'USD' | 'PEN')}
                      </span>
                    </td>
                    {/* ADELANTO SET */}
                    <td style={{ padding: '10px 12px', textAlign: 'right', borderRight: '1px solid #e9eff5' }}>
                      {f.adelantoSet != null ? (
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>
                          {formatMoneda(f.adelantoSet, f.moneda as 'USD' | 'PEN')}
                        </span>
                      ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    {/* SALDO SET */}
                    <td style={{ padding: '10px 12px', textAlign: 'right', borderRight: '1px solid #e9eff5' }}>
                      {f.saldoSet != null ? (
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: f.saldoSet > 0 ? '#dc2626' : '#065f46', fontWeight: 700 }}>
                          {formatMoneda(f.saldoSet, f.moneda as 'USD' | 'PEN')}
                        </span>
                      ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    {/* ACCIONES */}
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                        <Link href={`/facturacion/${f.id}`} title="Ver detalle">
                          <button className="p-1.5 rounded-lg transition-colors hover:bg-slate-100" style={{ color: '#64748b' }}>
                            <Eye className="h-4 w-4" />
                          </button>
                        </Link>
                        <a href={`/api/facturacion/${f.id}/generar-pdf`} target="_blank" rel="noreferrer" title="Descargar PDF">
                          <button className="p-1.5 rounded-lg transition-colors hover:bg-green-100" style={{ color: '#13602C' }}>
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
