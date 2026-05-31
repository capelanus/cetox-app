'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ExternalLink, Receipt, X, TrendingUp, TrendingDown, Wallet, Pencil,
} from 'lucide-react'
import { EliminarGastoBtn } from './eliminar-gasto-btn'
import { EliminarIngresoBtn } from './eliminar-ingreso-btn'
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns'
import { es } from 'date-fns/locale'

// ── Types ────────────────────────────────────────────────────────────────────

export interface GastoRow {
  id: string
  fecha: string
  concepto: string
  monto: number
  moneda: string
  categoria: string | null
  proveedorNombre: string | null
  proveedorRuc: string | null
  numeroFactura: string | null
  comprobante: string | null
  notas: string | null
}

export interface IngresoRow {
  id: string
  fecha: string
  descripcion: string
  monto: number
  moneda: string
}

type Movimiento =
  | ({ tipo: 'GASTO' } & GastoRow)
  | ({ tipo: 'INGRESO' } & IngresoRow)

interface Props {
  gastos:    GastoRow[]
  ingresos:  IngresoRow[]
  readonly?: boolean
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORIA_COLORS: Record<string, string> = {
  'Útiles':        'bg-blue-100 text-blue-700',
  'Limpieza':      'bg-green-100 text-green-700',
  'Transporte':    'bg-yellow-100 text-yellow-700',
  'Alimentación':  'bg-orange-100 text-orange-700',
  'Otro':          'bg-slate-100 text-slate-600',
}

function fmt(monto: number, moneda: string) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency', currency: moneda, minimumFractionDigits: 2,
  }).format(monto)
}

function toISO(d: Date) { return d.toISOString().split('T')[0] }

function getPeriodo(key: string): { desde: string; hasta: string } {
  const now = new Date()
  switch (key) {
    case 'mes':  return { desde: toISO(startOfMonth(now)),              hasta: toISO(endOfMonth(now)) }
    case 'prev': return { desde: toISO(startOfMonth(subMonths(now,1))), hasta: toISO(endOfMonth(subMonths(now,1))) }
    case 'anio': return { desde: toISO(startOfYear(now)),               hasta: toISO(endOfMonth(now)) }
    default:     return { desde: '', hasta: '' }
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CajaChicaView({ gastos, ingresos, readonly = false }: Props) {
  const [desde,      setDesde]      = useState('')
  const [hasta,      setHasta]      = useState('')
  const [catFiltro,  setCatFiltro]  = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [monFiltro,  setMonFiltro]  = useState('')
  const [busqueda,   setBusqueda]   = useState('')

  const categorias = useMemo(
    () => [...new Set(gastos.map((g) => g.categoria).filter(Boolean))] as string[],
    [gastos]
  )

  // Merge gastos + ingresos, ordered by date desc
  const movimientos = useMemo((): Movimiento[] => {
    const g: Movimiento[] = gastos.map(g => ({ tipo: 'GASTO' as const, ...g }))
    const i: Movimiento[] = ingresos.map(i => ({ tipo: 'INGRESO' as const, ...i }))
    return [...g, ...i].sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [gastos, ingresos])

  // Filter
  const filtrados = useMemo(() => {
    return movimientos.filter((m) => {
      const fechaM = m.fecha.slice(0, 10)
      if (desde && fechaM < desde) return false
      if (hasta && fechaM > hasta) return false
      if (tipoFiltro && m.tipo !== tipoFiltro) return false
      if (monFiltro && m.moneda !== monFiltro) return false
      if (catFiltro) {
        if (m.tipo === 'INGRESO') return false
        if (m.tipo === 'GASTO' && m.categoria !== catFiltro) return false
      }
      if (busqueda) {
        const q = busqueda.toLowerCase()
        if (m.tipo === 'GASTO') {
          const ok =
            m.concepto.toLowerCase().includes(q) ||
            (m.proveedorNombre?.toLowerCase().includes(q) ?? false) ||
            (m.proveedorRuc?.toLowerCase().includes(q) ?? false) ||
            (m.numeroFactura?.toLowerCase().includes(q) ?? false)
          if (!ok) return false
        } else {
          if (!m.descripcion.toLowerCase().includes(q)) return false
        }
      }
      return true
    })
  }, [movimientos, desde, hasta, catFiltro, tipoFiltro, monFiltro, busqueda])

  const hayFiltros = desde || hasta || catFiltro || tipoFiltro || monFiltro || busqueda

  // Totals
  const totalIngresosPEN = filtrados.filter(m => m.tipo === 'INGRESO' && m.moneda === 'PEN').reduce((s, m) => s + m.monto, 0)
  const totalGastosPEN   = filtrados.filter(m => m.tipo === 'GASTO'   && m.moneda === 'PEN').reduce((s, m) => s + m.monto, 0)
  const saldoPEN         = totalIngresosPEN - totalGastosPEN

  const totalIngresosUSD = filtrados.filter(m => m.tipo === 'INGRESO' && m.moneda === 'USD').reduce((s, m) => s + m.monto, 0)
  const totalGastosUSD   = filtrados.filter(m => m.tipo === 'GASTO'   && m.moneda === 'USD').reduce((s, m) => s + m.monto, 0)
  const saldoUSD         = totalIngresosUSD - totalGastosUSD
  const hayUSD           = movimientos.some(m => m.moneda === 'USD')

  function aplicarPeriodo(key: string) {
    const { desde: d, hasta: h } = getPeriodo(key)
    setDesde(d); setHasta(h)
  }

  function limpiar() {
    setDesde(''); setHasta(''); setCatFiltro(''); setTipoFiltro(''); setMonFiltro(''); setBusqueda('')
  }

  return (
    <div className="space-y-5">

      {/* ── Readonly badge ── */}
      {readonly && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
          style={{ backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}
        >
          <span
            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: '#94a3b8' }}
          />
          Vista de solo lectura — no se pueden registrar ni modificar movimientos desde esta cuenta
        </div>
      )}

      {/* ── Balance summary ── */}
      <div className={`grid gap-4 ${hayUSD ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>

        {/* Saldo PEN */}
        <div className={`rounded-xl border shadow-sm p-5 col-span-1 ${saldoPEN >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <Wallet className={`h-4 w-4 ${saldoPEN >= 0 ? 'text-emerald-500' : 'text-red-400'}`} />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Saldo disponible{hayFiltros ? ' (filtrado)' : ''}
            </p>
          </div>
          <p className={`text-2xl font-bold ${saldoPEN >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            {fmt(saldoPEN, 'PEN')}
          </p>
        </div>

        {/* Ingresos PEN */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ingresos PEN</p>
          </div>
          <p className="text-xl font-bold text-emerald-600">{fmt(totalIngresosPEN, 'PEN')}</p>
          <p className="text-xs text-slate-400 mt-1">
            {filtrados.filter(m => m.tipo === 'INGRESO' && m.moneda === 'PEN').length} entrada(s)
          </p>
        </div>

        {/* Gastos PEN */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="h-4 w-4 text-rose-400" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gastos PEN</p>
          </div>
          <p className="text-xl font-bold text-rose-600">{fmt(totalGastosPEN, 'PEN')}</p>
          <p className="text-xs text-slate-400 mt-1">
            {filtrados.filter(m => m.tipo === 'GASTO' && m.moneda === 'PEN').length} movimiento(s)
          </p>
        </div>

        {/* USD column (only when there are USD movements) */}
        {hayUSD && (
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <div className="flex items-center gap-1.5 mb-1">
              <Wallet className="h-4 w-4 text-slate-400" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo USD</p>
            </div>
            <p className={`text-xl font-bold ${saldoUSD >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {fmt(saldoUSD, 'USD')}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              ↑ {fmt(totalIngresosUSD, 'USD')} / ↓ {fmt(totalGastosUSD, 'USD')}
            </p>
          </div>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtros</p>
          {hayFiltros && (
            <button onClick={limpiar} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors">
              <X className="h-3 w-3" /> Limpiar filtros
            </button>
          )}
        </div>

        {/* Quick periods */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'mes',  label: 'Este mes' },
            { key: 'prev', label: 'Mes anterior' },
            { key: 'anio', label: 'Este año' },
          ].map(({ key, label }) => {
            const p = getPeriodo(key)
            const activo = desde === p.desde && hasta === p.hasta
            return (
              <button
                key={key}
                onClick={() => activo ? limpiar() : aplicarPeriodo(key)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  activo
                    ? 'bg-[#13602C] text-white border-[#13602C]'
                    : 'text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Desde</label>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Hasta</label>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Tipo</label>
            <select value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm">
              <option value="">Todos</option>
              <option value="INGRESO">Solo ingresos</option>
              <option value="GASTO">Solo gastos</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Categoría</label>
            <select value={catFiltro} onChange={e => setCatFiltro(e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm">
              <option value="">Todas</option>
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Moneda</label>
            <select value={monFiltro} onChange={e => setMonFiltro(e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm">
              <option value="">Todas</option>
              <option value="PEN">Soles (PEN)</option>
              <option value="USD">Dólares (USD)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">Buscar concepto / proveedor / factura</label>
          <input
            type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Ej. limpieza, F001-00123, Sodimac…"
            className="w-full h-8 rounded-md border border-input bg-background px-3 text-xs shadow-sm"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Receipt className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              {hayFiltros ? 'Sin resultados para los filtros aplicados' : 'Sin movimientos registrados'}
            </p>
            {!hayFiltros && !readonly && (
              <Link href="/caja-chica/nuevo" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
                Registrar el primer gasto
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="px-4 py-2 border-b bg-slate-50 text-xs text-slate-500 flex items-center gap-3">
              <span>
                {filtrados.length} movimiento{filtrados.length !== 1 ? 's' : ''}
                {hayFiltros && movimientos.length !== filtrados.length && ` de ${movimientos.length} total`}
              </span>
              <span className="text-emerald-600 font-medium">
                ↑ {filtrados.filter(m => m.tipo === 'INGRESO').length} ingresos
              </span>
              <span className="text-slate-500">
                ↓ {filtrados.filter(m => m.tipo === 'GASTO').length} gastos
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Fecha</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Tipo</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Descripción / Concepto</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Proveedor</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Factura</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Categoría</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs">Monto</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs">Comprobante</th>
                    {!readonly && <th className="px-4 py-3 w-20" />}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtrados.map((m) =>
                    m.tipo === 'INGRESO' ? (
                      /* ── Ingreso row (green) ── */
                      <tr key={`i-${m.id}`} className="bg-emerald-50/70 hover:bg-emerald-50 transition-colors">
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">
                          {format(new Date(m.fecha), 'dd/MM/yyyy', { locale: es })}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <TrendingUp className="h-3 w-3" /> Ingreso
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-emerald-800">{m.descripcion}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-300 text-xs">—</td>
                        <td className="px-4 py-3 text-slate-300 text-xs">—</td>
                        <td className="px-4 py-3 text-slate-300 text-xs">—</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                          +{fmt(m.monto, m.moneda)}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-300 text-xs">—</td>
                        {!readonly && (
                          <td className="px-4 py-3">
                            <EliminarIngresoBtn id={m.id} />
                          </td>
                        )}
                      </tr>
                    ) : (
                      /* ── Gasto row ── */
                      <tr key={`g-${m.id}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">
                          {format(new Date(m.fecha), 'dd/MM/yyyy', { locale: es })}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            <TrendingDown className="h-3 w-3" /> Gasto
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{m.concepto}</p>
                          {m.notas && <p className="text-xs text-slate-400 mt-0.5">{m.notas}</p>}
                        </td>
                        <td className="px-4 py-3">
                          {m.proveedorNombre ? (
                            <div>
                              <p className="text-slate-700 text-xs font-medium">{m.proveedorNombre}</p>
                              {m.proveedorRuc && <p className="text-slate-400 text-xs">{m.proveedorRuc}</p>}
                            </div>
                          ) : <span className="text-slate-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {m.numeroFactura ?? <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {m.categoria ? (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORIA_COLORS[m.categoria] ?? 'bg-slate-100 text-slate-600'}`}>
                              {m.categoria}
                            </span>
                          ) : <span className="text-slate-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                          {fmt(m.monto, m.moneda)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {m.comprobante ? (
                            <a href={m.comprobante} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs">
                              Ver <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : <span className="text-slate-300 text-xs">—</span>}
                        </td>
                        {!readonly && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/caja-chica/${m.id}/editar`}
                                title="Editar gasto"
                                className="text-slate-300 hover:text-blue-500 transition-colors"
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                              <EliminarGastoBtn id={m.id} />
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
