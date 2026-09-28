import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import {
  DollarSign, TrendingUp, TrendingDown, Clock,
  CheckCircle, AlertCircle, CreditCard,
} from 'lucide-react'
import Link from 'next/link'
import { FinanzasCharts } from './finanzas-charts'

function moneda(n: number) {
  return new Intl.NumberFormat('es-PE', {
    style:    'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export default async function FinanzasPage() {
  await requireRol(['DIRECTOR_CALIDAD', 'ADMINISTRACION', 'DIRECTOR_ADMINISTRACION', 'COORDINADOR_CALIDAD'])

  const hoy      = new Date()
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const inicio6m  = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1)

  const [
    facturas,
    pagos,
    provisionesActivas,
    facturasMes,
    pagosMes,
  ] = await Promise.all([
    // All facturas
    prisma.factura.findMany({
      orderBy:  { fechaEmision: 'desc' },
      take:     200,
      select:   { id: true, total: true, estado: true, fechaEmision: true, fechaVencimiento: true, numero: true, serie: true },
    }),
    // All pagos
    prisma.pago.findMany({
      orderBy: { createdAt: 'desc' },
      take:    200,
      select:  { id: true, monto: true, estado: true, fechaPago: true, medioPago: true },
    }),
    // Provisiones pendientes de pago
    prisma.provisionPago.findMany({
      where: { pago: null },
      select: { monto: true, concepto: true, condicionPago: true, factura: { select: { numero: true, serie: true, total: true } } },
    }),
    // This month's facturas
    prisma.factura.findMany({
      where:  { fechaEmision: { gte: inicioMes } },
      select: { total: true, estado: true },
    }),
    // This month's pagos
    prisma.pago.findMany({
      where:  { fechaPago: { gte: inicioMes } },
      select: { monto: true, estado: true },
    }),
  ])

  // ── KPI calculations ──────────────────────────────────────────────────────
  const totalFacturado    = facturas.reduce((s, f) => s + f.total, 0)
  const totalPagado       = pagos.filter(p => p.estado === 'PAGADO').reduce((s, p) => s + p.monto, 0)
  const cuentasPorPagar   = provisionesActivas.reduce((s, p) => s + p.monto, 0)
  const facturasMesTotal  = facturasMes.reduce((s, f) => s + f.total, 0)
  const pagosMesTotal     = pagosMes.filter(p => p.estado === 'PAGADO').reduce((s, p) => s + p.monto, 0)

  // Vencidas (factura vencida sin pago)
  const vencidas = facturas.filter(f => {
    if (!f.fechaVencimiento) return false
    return new Date(f.fechaVencimiento) < hoy && f.estado !== 'PAGADA'
  })
  const totalVencido = vencidas.reduce((s, f) => s + f.total, 0)

  // ── Monthly chart data ────────────────────────────────────────────────────
  const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - 5 + i, 1)
    return { year: d.getFullYear(), month: d.getMonth(), label: MESES_CORTOS[d.getMonth()] }
  })

  const chartData = months.map(m => {
    const fTotal = facturas
      .filter(f => {
        const d = new Date(f.fechaEmision)
        return d.getFullYear() === m.year && d.getMonth() === m.month
      })
      .reduce((s, f) => s + f.total, 0)

    const pTotal = pagos
      .filter(p => p.estado === 'PAGADO' && (() => {
        const d = new Date(p.fechaPago)
        return d.getFullYear() === m.year && d.getMonth() === m.month
      })())
      .reduce((s, p) => s + p.monto, 0)

    return { mes: m.label, facturado: Math.round(fTotal), pagado: Math.round(pTotal) }
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-5 w-5" style={{ color: '#4AC3B2' }} />
            <h1 className="text-2xl font-bold uppercase tracking-wide" style={{ color: '#13602C', fontFamily: 'var(--font-oswald)' }}>
              Dashboard Financiero
            </h1>
          </div>
          <p className="text-sm" style={{ color: '#808080' }}>
            Resumen de facturas, pagos y cuentas por pagar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/operaciones/facturas" className="text-xs font-semibold px-3 py-2 rounded-lg" style={{ backgroundColor: '#e2e8f0', color: '#475569' }}>
            Facturas
          </Link>
          <Link href="/operaciones/pagos" className="text-xs font-semibold px-3 py-2 rounded-lg" style={{ backgroundColor: '#13602C', color: 'white' }}>
            Pagos
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label:    'Facturado total',
            value:    moneda(totalFacturado),
            sub:      `${moneda(facturasMesTotal)} este mes`,
            icon:     <TrendingUp className="h-5 w-5" />,
            color:    '#13602C',
            bg:       '#dcfce7',
          },
          {
            label:    'Pagado total',
            value:    moneda(totalPagado),
            sub:      `${moneda(pagosMesTotal)} este mes`,
            icon:     <CheckCircle className="h-5 w-5" />,
            color:    '#4AC3B2',
            bg:       '#ccefe9',
          },
          {
            label:    'Cuentas por pagar',
            value:    moneda(cuentasPorPagar),
            sub:      `${provisionesActivas.length} facturas pendientes`,
            icon:     <Clock className="h-5 w-5" />,
            color:    '#d97706',
            bg:       '#fef3c7',
          },
          {
            label:    'Facturas vencidas',
            value:    moneda(totalVencido),
            sub:      `${vencidas.length} facturas vencidas`,
            icon:     <AlertCircle className="h-5 w-5" />,
            color:    vencidas.length > 0 ? '#dc2626' : '#10b981',
            bg:       vencidas.length > 0 ? '#fee2e2' : '#dcfce7',
          },
        ].map(kpi => (
          <div key={kpi.label} className="cetox-card p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#808080' }}>{kpi.label}</p>
              <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ backgroundColor: kpi.bg }}>
                <span style={{ color: kpi.color }}>{kpi.icon}</span>
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: kpi.color, fontFamily: 'var(--font-oswald)' }}>{kpi.value}</p>
            <p className="text-xs mt-1" style={{ color: '#808080' }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <FinanzasCharts data={chartData} />

      {/* Pending provisions table */}
      {provisionesActivas.length > 0 && (
        <div className="cetox-card overflow-hidden mt-6">
          <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
            <CreditCard className="h-4 w-4" style={{ color: '#4AC3B2' }} />
            <span className="text-sm font-bold" style={{ color: '#13602C' }}>Provisiones pendientes de pago</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-1" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
              {provisionesActivas.length}
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {provisionesActivas.slice(0, 10).map((p, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {p.factura.serie ? `${p.factura.serie}-` : ''}{p.factura.numero}
                  </p>
                  <p className="text-xs text-slate-400">{p.concepto ?? p.condicionPago}</p>
                </div>
                <p className="text-sm font-bold" style={{ color: '#d97706' }}>
                  {moneda(p.monto)}
                </p>
              </div>
            ))}
          </div>
          {provisionesActivas.length > 10 && (
            <div className="px-5 py-3 text-xs text-slate-400 text-center" style={{ borderTop: '1px solid #f1f5f9' }}>
              +{provisionesActivas.length - 10} más · <Link href="/operaciones/pagos" className="text-blue-500 hover:underline">Ver todas</Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
