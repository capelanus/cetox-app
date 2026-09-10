'use client'

import { useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  PackageOpen,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Receipt,
  Wallet,
  FileText,
  ExternalLink,
} from 'lucide-react'
import { asignarResponsableOC } from '@/app/actions/ordenes-compra'

interface ItemVM {
  id: string
  descripcion: string
  cantidad: number
  cantidadRecibida: number
  unidad: string
  precioUnitario: number
  estado: string
  estadoLabel: string
  estadoBadge: string
  facturaUrl: string | null
}

interface DocumentoVM {
  label: string
  url: string
}

interface EventoVM {
  fecha: string
  texto: string
  usuario?: string
}

interface OrdenVM {
  id: string
  numero: string
  proveedor: string
  tipo: string
  area: string
  responsable: { id: string; nombre: string } | null
  estado: string
  estadoLabel: string
  estadoBadge: string
  vencida: boolean
  avance: number
  moneda: string
  total: number
  emitidoPor: string
  fechaEmision: string
  fechaEntregaEstimada: string | null
  observaciones: string | null
  items: ItemVM[]
  documentos: DocumentoVM[]
  timeline: EventoVM[]
}

interface Kpis {
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

function formatMonto(n: number) {
  return new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

function Kpi({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3.5 shadow-sm">
      <div className="flex items-center gap-1.5 mb-1.5" style={{ color }}>
        {icon}
        <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

const selectClass = 'h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]'

export default function SeguimientoClient({ ordenes, kpis, responsables }: {
  ordenes: OrdenVM[]
  kpis: Kpis
  responsables: { id: string; nombre: string }[]
}) {
  const [busqueda, setBusqueda] = useState('')
  const [estatus, setEstatus] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [tipo, setTipo] = useState('')
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set())

  const estadosPresentes = useMemo(() => {
    const map = new Map<string, string>()
    ordenes.forEach(o => map.set(o.estado, o.estadoLabel))
    return [...map.entries()]
  }, [ordenes])

  const empresas = useMemo(() => [...new Set(ordenes.map(o => o.proveedor))].sort(), [ordenes])

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return ordenes.filter(o => {
      if (estatus && o.estado !== estatus) return false
      if (empresa && o.proveedor !== empresa) return false
      if (tipo && o.tipo !== tipo) return false
      if (q && !`${o.numero} ${o.proveedor}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [ordenes, busqueda, estatus, empresa, tipo])

  const limpiarFiltros = () => { setBusqueda(''); setEstatus(''); setEmpresa(''); setTipo('') }
  const hayFiltros = Boolean(busqueda || estatus || empresa || tipo)

  const toggle = (id: string) => {
    setAbiertas(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <Kpi icon={<PackageOpen className="w-4 h-4" />} label="Abiertas" value={kpis.abiertas} color="#2563eb" />
        <Kpi icon={<CheckCircle2 className="w-4 h-4" />} label="Cerradas" value={kpis.cerradas} color="#16a34a" />
        <Kpi icon={<AlertTriangle className="w-4 h-4" />} label="Vencidas" value={kpis.vencidas} color="#dc2626" />
        <Kpi icon={<Truck className="w-4 h-4" />} label="Pend. entrega" value={kpis.pendientesEntrega} color="#d97706" />
        <Kpi icon={<Receipt className="w-4 h-4" />} label="Pend. factura" value={kpis.pendientesFactura} color="#d97706" />
        <Kpi icon={<Wallet className="w-4 h-4" />} label="Pend. pago" value={kpis.pendientesPago} color="#d97706" />
      </div>

      {/* Money + rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:col-span-1">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Montos del año (S/. + USD combinados)</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Comprometido</span><span className="font-mono font-medium">{formatMonto(kpis.comprometido)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Facturado</span><span className="font-mono font-medium">{formatMonto(kpis.facturado)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Pagado</span><span className="font-mono font-medium text-green-700">{formatMonto(kpis.pagado)}</span></div>
            <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-700 font-medium">Pendiente de pago</span><span className="font-mono font-bold text-amber-700">{formatMonto(kpis.pendienteMonto)}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Compras por área (año actual)</h3>
          <div className="space-y-1.5">
            {kpis.porArea.length === 0 && <p className="text-sm text-gray-400">Sin datos este año</p>}
            {kpis.porArea.map(a => (
              <div key={a.area} className="flex justify-between text-sm">
                <span className="text-gray-600">{a.area}</span>
                <span className="font-mono text-gray-800">{formatMonto(a.monto)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Compras por proveedor (año actual)</h3>
          <div className="space-y-1.5">
            {kpis.porProveedor.length === 0 && <p className="text-sm text-gray-400">Sin datos</p>}
            {kpis.porProveedor.map(p => (
              <div key={p.proveedor} className="flex justify-between text-sm">
                <span className="text-gray-600 truncate pr-2">{p.proveedor}</span>
                <span className="font-mono text-gray-800 whitespace-nowrap">{formatMonto(p.monto)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters + legend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar OC o proveedor..."
            className={`${selectClass} w-56`}
          />
          <select value={estatus} onChange={e => setEstatus(e.target.value)} className={selectClass}>
            <option value="">Estatus: todos</option>
            {estadosPresentes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select value={empresa} onChange={e => setEmpresa(e.target.value)} className={selectClass}>
            <option value="">Empresa: todas</option>
            {empresas.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className={selectClass}>
            <option value="">Tipo: todos</option>
            <option value="PRODUCTO">Producto</option>
            <option value="SERVICIO">Servicio</option>
          </select>
          {hayFiltros && (
            <button onClick={limpiarFiltros} className="text-sm text-gray-500 hover:text-gray-800 underline">Limpiar</button>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" />Al día / completado</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" />En proceso</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />Pendiente de acción</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />Vencida / cancelada</span>
        </div>
      </div>

      {/* Table */}
      <div className="space-y-2">
        {filtradas.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
            No hay órdenes que coincidan con los filtros.
          </div>
        )}
        {filtradas.map(oc => {
          const abierta = abiertas.has(oc.id)
          const asignar = asignarResponsableOC.bind(null, oc.id)
          return (
            <div key={oc.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3">
                <div className="grid grid-cols-12 gap-3 items-center">
                  <button onClick={() => toggle(oc.id)} className="col-span-12 lg:col-span-1 flex items-center gap-2 text-left text-gray-400 hover:text-gray-600">
                    {abierta ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                    <span className="font-mono text-sm font-semibold text-[#13602C]">{oc.numero}</span>
                  </button>
                  <div className="col-span-6 lg:col-span-2 text-sm text-gray-700 truncate">{oc.proveedor}</div>
                  <div className="col-span-6 lg:col-span-1 text-xs text-gray-500">{oc.tipo === 'SERVICIO' ? 'Servicio' : 'Producto'}</div>
                  <form action={asignar} className="col-span-6 lg:col-span-2">
                    <select
                      key={oc.responsable?.id ?? 'none'}
                      name="responsableActualId"
                      defaultValue={oc.responsable?.id ?? ''}
                      onChange={e => e.currentTarget.form?.requestSubmit()}
                      className="w-full h-8 rounded-md border border-gray-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#13602C]"
                    >
                      <option value="">Sin responsable</option>
                      {responsables.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                  </form>
                  <div className="col-span-6 lg:col-span-2 flex items-center gap-1.5 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${oc.estadoBadge}`}>{oc.estadoLabel}</span>
                    {oc.vencida && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">Vencida</span>}
                  </div>
                  <div className="col-span-8 lg:col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#13602C]" style={{ width: `${Math.min(100, oc.avance)}%` }} />
                      </div>
                      <span className="text-[11px] text-gray-500 font-mono w-8 text-right">{oc.avance}%</span>
                    </div>
                    {oc.fechaEntregaEstimada && (
                      <p className={`text-[11px] mt-0.5 ${oc.vencida ? 'text-red-600 font-medium' : 'text-gray-400'}`}>Entrega: {oc.fechaEntregaEstimada}</p>
                    )}
                  </div>
                  <div className="col-span-4 lg:col-span-2 text-right">
                    <p className="text-sm font-mono font-semibold text-gray-800">{oc.moneda} {formatMonto(oc.total)}</p>
                    <p className="text-[11px] text-gray-400">{oc.fechaEmision}</p>
                  </div>
                </div>
              </div>

              {abierta && (
                <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-4 space-y-4">
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                    <span>Área: <span className="text-gray-700 font-medium">{oc.area}</span></span>
                    <span>Emitido por: <span className="text-gray-700 font-medium">{oc.emitidoPor}</span></span>
                    {oc.observaciones && <span>Obs.: <span className="text-gray-700">{oc.observaciones}</span></span>}
                  </div>

                  {/* Items */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-100 text-xs font-semibold text-gray-600">Ítems</div>
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-3 py-1.5 font-medium text-gray-500">Descripción</th>
                          <th className="text-right px-3 py-1.5 font-medium text-gray-500">Cant.</th>
                          <th className="text-right px-3 py-1.5 font-medium text-gray-500">Recibido</th>
                          <th className="text-left px-3 py-1.5 font-medium text-gray-500">Unidad</th>
                          <th className="text-left px-3 py-1.5 font-medium text-gray-500">Estado</th>
                          <th className="text-left px-3 py-1.5 font-medium text-gray-500">Doc.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {oc.items.map(item => (
                          <tr key={item.id}>
                            <td className="px-3 py-1.5 text-gray-700">{item.descripcion}</td>
                            <td className="px-3 py-1.5 text-right font-mono">{item.cantidad}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-gray-500">{item.cantidadRecibida}</td>
                            <td className="px-3 py-1.5 text-gray-500">{item.unidad}</td>
                            <td className="px-3 py-1.5">
                              <span className={`px-1.5 py-0.5 rounded-full ${item.estadoBadge}`}>{item.estadoLabel}</span>
                            </td>
                            <td className="px-3 py-1.5">
                              {item.facturaUrl && (
                                <a href={item.facturaUrl} target="_blank" rel="noopener noreferrer" className="text-[#13602C] hover:underline inline-flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Documentos */}
                    <div className="bg-white rounded-lg border border-gray-200 p-3">
                      <h4 className="text-xs font-semibold text-gray-600 mb-2">Documentos</h4>
                      {oc.documentos.length === 0
                        ? <p className="text-xs text-gray-400">Sin documentos adjuntos</p>
                        : (
                          <ul className="space-y-1">
                            {oc.documentos.map((d, i) => (
                              <li key={i}>
                                <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#13602C] hover:underline inline-flex items-center gap-1">
                                  <ExternalLink className="w-3 h-3" />{d.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                    </div>

                    {/* Historial */}
                    <div className="bg-white rounded-lg border border-gray-200 p-3">
                      <h4 className="text-xs font-semibold text-gray-600 mb-2">Historial</h4>
                      {oc.timeline.length === 0
                        ? <p className="text-xs text-gray-400">Sin eventos registrados</p>
                        : (
                          <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {oc.timeline.map((ev, i) => (
                              <li key={i} className="text-xs flex items-start gap-2">
                                <span className="text-gray-400 whitespace-nowrap">{ev.fecha}</span>
                                <span className="text-gray-700">{ev.texto}</span>
                                {ev.usuario && <span className="ml-auto text-gray-400 whitespace-nowrap">{ev.usuario}</span>}
                              </li>
                            ))}
                          </ul>
                        )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
