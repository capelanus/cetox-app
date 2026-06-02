import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Download, CheckCircle2,
  FileText, Building2, Calendar, DollarSign, Edit3,
} from 'lucide-react'
import {
  formatFecha, formatMoneda,
  formatNumFacturaCliente, formatNumCotizacion,
} from '@/lib/format'
import { marcarFacturaPagada, anularFacturaCliente, actualizarFacturaCliente } from '@/app/actions/facturacion'
import { AnularBtn } from './anular-btn'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ── Estado badge ──────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDIENTE: { label: 'Pendiente de cobro', color: '#92400e', bg: '#fef3c7' },
  PAGADA:    { label: 'Pagada',             color: '#065f46', bg: '#d1fae5' },
  ANULADA:   { label: 'Anulada',            color: '#7f1d1d', bg: '#fee2e2' },
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function FacturaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }    = await params
  const session   = await requireRol(['ADMINISTRACION', 'DIRECTOR_CALIDAD', 'GERENTE_TECNICO', 'DIRECTOR_ADMINISTRACION', 'COORDINADOR_CALIDAD'])

  const factura = await prisma.facturaCliente.findUnique({
    where: { id },
    include: {
      cliente:    true,
      creadoPor:  { select: { nombre: true } },
      cotizacion: true,
    },
  })
  if (!factura) notFound()

  const rol       = session.user.rol
  const canManage = ['ADMINISTRACION', 'DIRECTOR_CALIDAD', 'GERENTE_TECNICO'].includes(rol)
  const estado    = ESTADO_CONFIG[factura.estado] ?? ESTADO_CONFIG.PENDIENTE
  const cot       = factura.cotizacion

  // Items — read from itemsJson (the exact subset that was invoiced)
  interface StoredItem { itemId: string; nombre: string; muestra: string | null; costo: number; moneda: string }
  const storedItems: StoredItem[] = JSON.parse(factura.itemsJson || '[]')
  const items = storedItems.map(it => ({ nombre: it.nombre, muestra: it.muestra, costo: it.costo }))

  // Server actions bound to this factura
  async function handleMarcarPagada() {
    'use server'
    await marcarFacturaPagada(id)
    redirect(`/facturacion/${id}`)
  }
  async function handleAnular() {
    'use server'
    await anularFacturaCliente(id)
    redirect(`/facturacion/${id}`)
  }
  async function handleActualizar(formData: FormData) {
    'use server'
    await actualizarFacturaCliente(id, formData)
    revalidatePath(`/facturacion/${id}`)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* ── Back + title ── */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/facturacion">
          <button
            className="p-2 rounded-lg transition-colors hover:bg-slate-100"
            style={{ color: '#64748b' }}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="cetox-page-title">
              {formatNumFacturaCliente(factura.serie, factura.numero, factura.anio)}
            </h1>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: estado.bg, color: estado.color }}
            >
              {estado.label}
            </span>
          </div>
          <p className="cetox-page-subtitle">
            Generada el {formatFecha(factura.createdAt)} por {factura.creadoPor.nombre}
          </p>
        </div>

        {/* PDF download */}
        <a href={`/api/facturacion/${id}/generar-pdf`} target="_blank" rel="noreferrer">
          <button className="cetox-btn-primary flex items-center gap-1.5 text-sm px-4 py-2">
            <Download className="h-4 w-4" />
            Descargar PDF
          </button>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left: main detail ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Client + cotizacion */}
          <div className="cetox-card p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <Building2 className="h-4 w-4" style={{ color: '#4AC3B2' }} />
              <h2 className="font-semibold text-sm" style={{ color: '#1e293b' }}>Cliente</h2>
            </div>
            <div className="space-y-1">
              <p className="font-bold" style={{ color: '#13602C' }}>{factura.cliente.razonSocial}</p>
              <p className="text-sm" style={{ color: '#64748b' }}>RUC: {factura.cliente.ruc}</p>
              {factura.cliente.direccion && (
                <p className="text-sm" style={{ color: '#64748b' }}>{factura.cliente.direccion}</p>
              )}
              {factura.cliente.email && (
                <p className="text-sm" style={{ color: '#64748b' }}>{factura.cliente.email}</p>
              )}
            </div>
            <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
              <FileText className="h-4 w-4" style={{ color: '#94a3b8' }} />
              <p className="text-sm" style={{ color: '#64748b' }}>
                Cotización:{' '}
                <Link
                  href={`/cotizaciones/${cot.id}`}
                  className="font-medium hover:underline"
                  style={{ color: '#4AC3B2' }}
                >
                  {formatNumCotizacion(cot.numero, cot.anio, cot.sufijo)}
                </Link>
              </p>
            </div>
          </div>

          {/* Services table */}
          <div className="cetox-card overflow-hidden">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <h2 className="font-semibold text-sm" style={{ color: '#1e293b' }}>Servicios facturados</h2>
            </div>
            <table className="cetox-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Servicio / Ensayo</th>
                  {items.some(i => i.muestra) && <th>Muestra</th>}
                  <th className="text-right">Importe ({factura.moneda})</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="text-xs" style={{ color: '#94a3b8' }}>{idx + 1}</td>
                    <td className="font-medium">{item.nombre}</td>
                    {items.some(i => i.muestra) && (
                      <td className="text-xs" style={{ color: '#64748b' }}>{item.muestra ?? '—'}</td>
                    )}
                    <td className="text-right font-mono text-sm">
                      {formatMoneda(item.costo, factura.moneda as 'USD' | 'PEN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="px-5 py-4 space-y-2" style={{ borderTop: '2px solid #f1f5f9' }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#64748b' }}>Subtotal</span>
                <span className="font-medium">{formatMoneda(factura.subtotal, factura.moneda as 'USD' | 'PEN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#64748b' }}>IGV (18%)</span>
                <span className="font-medium">{formatMoneda(factura.igv, factura.moneda as 'USD' | 'PEN')}</span>
              </div>
              <div
                className="flex justify-between py-2 px-3 rounded-lg"
                style={{ backgroundColor: '#13602C' }}
              >
                <span className="text-white font-bold">TOTAL</span>
                <span className="text-white font-bold text-lg">
                  {formatMoneda(factura.total, factura.moneda as 'USD' | 'PEN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: actions + metadata ── */}
        <div className="space-y-4">
          {/* Dates */}
          <div className="cetox-card p-4 space-y-3">
            <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#4AC3B2' }}>
              Fechas
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0" style={{ color: '#94a3b8' }} />
                <div>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>Emisión</p>
                  <p className="text-sm font-semibold">{formatFecha(factura.fechaEmision)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0" style={{ color: factura.fechaVencimiento && new Date(factura.fechaVencimiento) < new Date() && factura.estado === 'PENDIENTE' ? '#dc2626' : '#94a3b8' }} />
                <div>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>Vencimiento</p>
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color: factura.fechaVencimiento && new Date(factura.fechaVencimiento) < new Date() && factura.estado === 'PENDIENTE'
                        ? '#dc2626' : '#1e293b',
                    }}
                  >
                    {factura.fechaVencimiento ? formatFecha(factura.fechaVencimiento) : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Edit notas + vencimiento */}
          {canManage && factura.estado !== 'ANULADA' && (
            <div className="cetox-card p-4">
              <h2 className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#4AC3B2' }}>
                <Edit3 className="h-3.5 w-3.5 inline mr-1" />
                Editar
              </h2>
              <form action={handleActualizar} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#64748b' }}>Concepto</label>
                  <input
                    type="text"
                    name="concepto"
                    defaultValue={factura.concepto ?? ''}
                    className="cetox-input text-sm"
                    placeholder="Ej. De veterquimica peru s"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#64748b' }}>Nº Operación</label>
                  <input
                    type="text"
                    name="numeroOperacion"
                    defaultValue={factura.numeroOperacion ?? ''}
                    className="cetox-input text-sm font-mono"
                    placeholder="Número de operación bancaria"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#64748b' }}>% Detracción</label>
                    <input
                      type="number"
                      name="porcentajeDetraccion"
                      defaultValue={factura.porcentajeDetraccion ?? ''}
                      className="cetox-input text-sm"
                      placeholder="100"
                      min={0} max={100}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#64748b' }}>Sujeta a detracción</label>
                    <select name="sujetaDetraccion" defaultValue={factura.sujetaDetraccion == null ? '' : factura.sujetaDetraccion ? 'SI' : 'NO'} className="cetox-input text-sm">
                      <option value="">—</option>
                      <option value="SI">SI</option>
                      <option value="NO">NO</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#64748b' }}>Monto $ ingresado</label>
                  <input
                    type="number"
                    name="montoIngresado"
                    defaultValue={factura.montoIngresado ?? ''}
                    className="cetox-input text-sm font-mono"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#64748b' }}>Adelanto SET</label>
                    <input
                      type="number"
                      name="adelantoSet"
                      defaultValue={factura.adelantoSet ?? ''}
                      className="cetox-input text-sm font-mono"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#64748b' }}>Saldo SET</label>
                    <input
                      type="number"
                      name="saldoSet"
                      defaultValue={factura.saldoSet ?? ''}
                      className="cetox-input text-sm font-mono"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#64748b' }}>
                    Fecha de vencimiento
                  </label>
                  <input
                    type="date"
                    name="fechaVencimiento"
                    defaultValue={factura.fechaVencimiento ? new Date(factura.fechaVencimiento).toISOString().split('T')[0] : ''}
                    className="cetox-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#64748b' }}>
                    Observaciones
                  </label>
                  <textarea
                    name="notas"
                    defaultValue={factura.notas ?? ''}
                    rows={3}
                    className="cetox-input text-sm resize-none"
                    placeholder="Observaciones adicionales…"
                  />
                </div>
                <button type="submit" className="cetox-btn-secondary w-full text-sm py-2">
                  Guardar cambios
                </button>
              </form>
            </div>
          )}

          {/* Actions */}
          {canManage && (
            <div className="cetox-card p-4 space-y-2">
              <h2 className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#4AC3B2' }}>
                Acciones
              </h2>

              {factura.estado === 'PENDIENTE' && (
                <form action={handleMarcarPagada}>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all"
                    style={{
                      backgroundColor: '#d1fae5',
                      color: '#065f46',
                      border: '1.5px solid #a7f3d0',
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Marcar como pagada
                  </button>
                </form>
              )}

              {factura.estado !== 'ANULADA' && (
                <AnularBtn action={handleAnular} />
              )}

              <a href={`/api/facturacion/${id}/generar-pdf`} target="_blank" rel="noreferrer" className="block">
                <button
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    backgroundColor: '#EAF4F4',
                    color: '#13602C',
                    border: '1.5px solid #4AC3B2',
                  }}
                >
                  <Download className="h-4 w-4" />
                  Descargar PDF
                </button>
              </a>
            </div>
          )}

          {/* Summary */}
          <div className="cetox-card p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" style={{ color: '#4AC3B2' }} />
              <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#4AC3B2' }}>Importe</h2>
            </div>
            <div className="mt-3 text-center">
              <p className="font-heading font-bold text-3xl" style={{ color: '#13602C' }}>
                {formatMoneda(factura.total, factura.moneda as 'USD' | 'PEN')}
              </p>
              <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{factura.moneda}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
