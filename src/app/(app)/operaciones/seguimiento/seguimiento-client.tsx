'use client'

import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  ListChecks,
  Truck,
  CheckCircle2,
  CalendarX2,
  CircleDollarSign,
  RefreshCw,
  ExternalLink,
  FileText,
} from 'lucide-react'
import { asignarResponsableOC, guardarObservacionSeguimiento, guardarSeguimientoItem } from '@/app/actions/ordenes-compra'

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
  fechaEntregado: string | null
  fechaProgramada: string | null
  fechaRealizada: string | null
  fechaProgramadaInput: string
  fechaRealizadaInput: string
  observaciones: string | null
}

interface HitoVM {
  ok: boolean
  fecha: string | null
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
  porVencer: boolean
  proximaAccion: string
  solicitud: { id: string; numero: string; solicitante: string; fechaRequerida: string | null }
  avance: number
  avanceEntrega: number
  moneda: string
  total: number
  emitidoPor: string
  fechaEmision: string
  fechaRequerimiento: string
  fechaEntregaEstimada: string | null
  diasCompromiso: number | null
  hitos: { enviada: HitoVM; entregado: HitoVM; factura: HitoVM; pagado: HitoVM }
  observaciones: string | null
  observacionesSeguimiento: string | null
  items: ItemVM[]
  documentos: { label: string; url: string }[]
  timeline: { fecha: string; texto: string; usuario?: string }[]
}

interface Kpis {
  total: number
  enProceso: number
  enTransito: number
  entregadas: number
  vencidas: number
  pendientesPago: number
  porVencer: number
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

function Kpi({ icon, label, value, total, color, bg }: {
  icon: React.ReactNode
  label: string
  value: number
  total: number
  color: string
  bg: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: bg, color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide truncate">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold" style={{ color }}>{value}</span>
          <span className="text-[11px] text-gray-400">{pct}%</span>
        </div>
      </div>
    </div>
  )
}

function SiNo({ hito }: { hito: HitoVM }) {
  return (
    <div className="space-y-0.5">
      <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded ${
        hito.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}>
        {hito.ok ? 'SÍ' : 'NO'}
      </span>
      {hito.fecha && <p className="text-[10px] text-gray-500">{hito.fecha}</p>}
    </div>
  )
}

const selectClass = 'h-9 rounded-md border border-gray-300 bg-white px-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]'
const thClass = 'px-2 py-2 text-left font-semibold text-white text-[10px] uppercase tracking-wide align-middle'
const notaClass = 'w-full text-[11px] bg-transparent border border-transparent hover:border-gray-200 focus:border-[#13602C] rounded px-1.5 py-1 focus:outline-none resize-none'

export default function SeguimientoClient({ ordenes, kpis, responsables }: {
  ordenes: OrdenVM[]
  kpis: Kpis
  responsables: { id: string; nombre: string }[]
}) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [estatus, setEstatus] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [tipo, setTipo] = useState('')
  const [area, setArea] = useState('')
  const [alerta, setAlerta] = useState('')
  const [colapsadas, setColapsadas] = useState<Set<string>>(new Set())
  const [detalles, setDetalles] = useState<Set<string>>(new Set())

  const estadosPresentes = useMemo(() => {
    const map = new Map<string, string>()
    ordenes.forEach(o => map.set(o.estado, o.estadoLabel))
    return [...map.entries()]
  }, [ordenes])

  const empresas = useMemo(() => [...new Set(ordenes.map(o => o.proveedor))].sort(), [ordenes])
  const areas = useMemo(() => [...new Set(ordenes.map(o => o.area))].sort(), [ordenes])

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return ordenes.filter(o => {
      if (estatus && o.estado !== estatus) return false
      if (empresa && o.proveedor !== empresa) return false
      if (tipo && o.tipo !== tipo) return false
      if (area && o.area !== area) return false
      if (alerta === 'VENCIDA' && !o.vencida) return false
      if (alerta === 'POR_VENCER' && !o.porVencer) return false
      if (q) {
        const texto = [
          o.numero, o.proveedor, o.area, o.solicitud.numero, o.solicitud.solicitante,
          o.responsable?.nombre ?? '',
          ...o.items.map(i => i.descripcion),
        ].join(' ').toLowerCase()
        if (!texto.includes(q)) return false
      }
      return true
    })
  }, [ordenes, busqueda, estatus, empresa, tipo, area, alerta])

  const limpiarFiltros = () => { setBusqueda(''); setEstatus(''); setEmpresa(''); setTipo(''); setArea(''); setAlerta('') }
  const hayFiltros = Boolean(busqueda || estatus || empresa || tipo || area || alerta)

  const toggleItems = (id: string) => setColapsadas(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  const toggleDetalle = (id: string) => setDetalles(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <Kpi icon={<ClipboardList className="w-5 h-5" />} label="Órdenes totales" value={kpis.total} total={kpis.total} color="#13602C" bg="#dcfce7" />
        <Kpi icon={<ListChecks className="w-5 h-5" />} label="En proceso" value={kpis.enProceso} total={kpis.total} color="#2563eb" bg="#dbeafe" />
        <Kpi icon={<Truck className="w-5 h-5" />} label="En tránsito" value={kpis.enTransito} total={kpis.total} color="#ea580c" bg="#ffedd5" />
        <Kpi icon={<CheckCircle2 className="w-5 h-5" />} label="Entregadas" value={kpis.entregadas} total={kpis.total} color="#16a34a" bg="#dcfce7" />
        <Kpi icon={<CalendarX2 className="w-5 h-5" />} label="Vencidas / alerta" value={kpis.vencidas} total={kpis.total} color="#dc2626" bg="#fee2e2" />
        <Kpi icon={<CircleDollarSign className="w-5 h-5" />} label="Pendiente pago" value={kpis.pendientesPago} total={kpis.total} color="#7c3aed" bg="#ede9fe" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar OC, producto, solicitante..."
          className={`${selectClass} w-60`}
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
        <select value={area} onChange={e => setArea(e.target.value)} className={selectClass}>
          <option value="">Área: todas</option>
          {areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={alerta} onChange={e => setAlerta(e.target.value)} className={selectClass}>
          <option value="">Alertas: todas</option>
          <option value="VENCIDA">Solo vencidas</option>
          <option value="POR_VENCER">Solo por vencer</option>
        </select>
        {hayFiltros && (
          <button onClick={limpiarFiltros} className="text-sm text-gray-500 hover:text-gray-800 underline">Limpiar</button>
        )}
        <button
          onClick={() => router.refresh()}
          title="Actualizar datos"
          className="ml-auto h-9 w-9 flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 hover:text-[#13602C] hover:border-[#13602C] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Grilla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-xs min-w-[1500px]">
          <thead style={{ backgroundColor: '#13602C' }}>
            <tr>
              <th className={thClass}>Orden de compra</th>
              <th className={thClass}>Área solicita</th>
              <th className={thClass}>Fecha requerimiento</th>
              <th className={thClass}>Descripción / ítems</th>
              <th className={thClass}>Empresa</th>
              <th className={thClass}>Tipo</th>
              <th className={thClass}>Plazo compromiso</th>
              <th className={thClass}>Estatus OC</th>
              <th className={thClass}>Entregado</th>
              <th className={thClass}>Entrega factura</th>
              <th className={thClass}>Pagado</th>
              <th className={thClass}>Observaciones</th>
              <th className={thClass}>Avance</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 && (
              <tr><td colSpan={13} className="text-center py-10 text-gray-400 text-sm">No hay órdenes que coincidan con los filtros.</td></tr>
            )}
            {filtradas.map(oc => {
              const itemsVisibles = !colapsadas.has(oc.id)
              const esServicio = oc.tipo === 'SERVICIO'
              const guardarNota = guardarObservacionSeguimiento.bind(null, oc.id)
              const asignar = asignarResponsableOC.bind(null, oc.id)

              return (
                <Fragment key={oc.id}>
                  <tr className="border-t-4 border-gray-100 align-top">
                    <td className="px-2 py-3">
                      <button onClick={() => toggleItems(oc.id)} className="flex items-center gap-1 text-left">
                        {itemsVisibles ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                        <span className="font-mono font-bold text-sm text-gray-800">{oc.numero}</span>
                      </button>
                    </td>
                    <td className="px-2 py-3 font-semibold text-gray-600 uppercase text-[11px]">{oc.area}</td>
                    <td className="px-2 py-3 text-gray-600 whitespace-nowrap">{oc.fechaRequerimiento}</td>
                    <td className="px-2 py-3 min-w-[260px]">
                      <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">
                        {oc.items.length} {esServicio ? 'servicios' : 'ítems'}
                      </p>
                      <ol className="space-y-0.5">
                        {oc.items.map((it, i) => (
                          <li key={it.id} className="flex gap-1.5 text-[11px] text-gray-700">
                            <span className="text-gray-400 shrink-0">{i + 1}</span>
                            <span className="truncate">{it.descripcion}</span>
                          </li>
                        ))}
                      </ol>
                    </td>
                    <td className="px-2 py-3 font-medium text-gray-700">{oc.proveedor}</td>
                    <td className="px-2 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${esServicio ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {esServicio ? 'SERVICIO' : 'PRODUCTO'}
                      </span>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <p className="font-medium text-gray-700">{oc.fechaEntregaEstimada ?? '—'}</p>
                      {oc.diasCompromiso !== null && (
                        <p className={`text-[11px] font-medium ${
                          oc.diasCompromiso < 0 ? 'text-red-600' : oc.diasCompromiso <= 7 ? 'text-orange-600' : 'text-gray-400'
                        }`}>
                          {oc.diasCompromiso < 0
                            ? `Vencida hace ${Math.abs(oc.diasCompromiso)} día${Math.abs(oc.diasCompromiso) === 1 ? '' : 's'}`
                            : oc.diasCompromiso === 0
                              ? 'Vence hoy'
                              : `En ${oc.diasCompromiso} día${oc.diasCompromiso === 1 ? '' : 's'}`}
                        </p>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${oc.estadoBadge}`}>
                        {oc.estadoLabel}
                      </span>
                      <p className="text-[10px] text-gray-500 mt-0.5">{oc.hitos.enviada.fecha}</p>
                    </td>
                    <td className="px-2 py-3"><SiNo hito={oc.hitos.entregado} /></td>
                    <td className="px-2 py-3"><SiNo hito={oc.hitos.factura} /></td>
                    <td className="px-2 py-3"><SiNo hito={oc.hitos.pagado} /></td>
                    <td className="px-2 py-3 min-w-[160px]">
                      {oc.vencida && (
                        <p className="text-[10px] font-bold px-2 py-1 rounded bg-red-100 text-red-700 mb-1">ALERTA: {oc.proximaAccion}</p>
                      )}
                      {!oc.vencida && oc.porVencer && (
                        <p className="text-[10px] font-bold px-2 py-1 rounded bg-amber-100 text-amber-700 mb-1">POR VENCER: {oc.proximaAccion}</p>
                      )}
                      {!oc.vencida && !oc.porVencer && (
                        <p className="text-[10px] text-gray-400 mb-1">{oc.proximaAccion}</p>
                      )}
                      <form action={guardarNota}>
                        <textarea
                          name="observacionesSeguimiento"
                          defaultValue={oc.observacionesSeguimiento ?? ''}
                          rows={2}
                          placeholder="Agregar nota..."
                          onBlur={e => e.currentTarget.form?.requestSubmit()}
                          className={notaClass}
                        />
                      </form>
                    </td>
                    <td className="px-2 py-3 w-24">
                      <p className="font-bold text-gray-800 text-sm">{oc.avance}%</p>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-[#13602C]" style={{ width: `${Math.min(100, oc.avance)}%` }} />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap">Entrega {oc.avanceEntrega}%</p>
                      <p className="text-[10px] text-gray-400 mt-1 whitespace-nowrap">{oc.moneda} {formatMonto(oc.total)}</p>
                    </td>
                  </tr>

                  {itemsVisibles && (
                    <tr className="bg-gray-50/70">
                      <td colSpan={13} className="px-4 py-3">
                        <table className="w-full text-[11px]">
                          <thead>
                            <tr className="text-gray-500 border-b border-gray-200">
                              <th className="text-left px-2 py-1 font-semibold uppercase text-[10px]">Ítem</th>
                              <th className="text-left px-2 py-1 font-semibold uppercase text-[10px]">{esServicio ? 'Tipo' : 'Cant.'}</th>
                              {!esServicio && <th className="text-left px-2 py-1 font-semibold uppercase text-[10px]">Unidad</th>}
                              <th className="text-left px-2 py-1 font-semibold uppercase text-[10px]">Detalle</th>
                              <th className="text-left px-2 py-1 font-semibold uppercase text-[10px]">Estatus ítem</th>
                              <th className="text-left px-2 py-1 font-semibold uppercase text-[10px]">{esServicio ? 'Programado' : 'Entregado'}</th>
                              <th className="text-left px-2 py-1 font-semibold uppercase text-[10px]">{esServicio ? 'Realizado' : 'Factura'}</th>
                              <th className="text-left px-2 py-1 font-semibold uppercase text-[10px]">Observaciones ítem</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {oc.items.map((item, i) => {
                              const guardarItem = guardarSeguimientoItem.bind(null, item.id)
                              return (
                                <tr key={item.id}>
                                  <td className="px-2 py-1.5 text-gray-400">{i + 1}</td>
                                  <td className="px-2 py-1.5 text-gray-600">{esServicio ? 'Servicio' : item.cantidad}</td>
                                  {!esServicio && <td className="px-2 py-1.5 text-gray-600">{item.unidad}</td>}
                                  <td className="px-2 py-1.5 text-gray-700">{item.descripcion}</td>
                                  <td className="px-2 py-1.5">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${item.estadoBadge}`}>{item.estadoLabel}</span>
                                  </td>
                                  <td className="px-2 py-1.5 text-gray-600">
                                    {esServicio ? (
                                      <form action={guardarItem}>
                                        <input type="hidden" name="observaciones" value={item.observaciones ?? ''} />
                                        <input type="hidden" name="fechaRealizada" value={item.fechaRealizadaInput} />
                                        <input
                                          type="date"
                                          name="fechaProgramada"
                                          defaultValue={item.fechaProgramadaInput}
                                          onChange={e => e.currentTarget.form?.requestSubmit()}
                                          className="text-[11px] border border-transparent hover:border-gray-200 focus:border-[#13602C] rounded px-1 py-0.5 focus:outline-none bg-transparent"
                                        />
                                      </form>
                                    ) : (item.fechaEntregado ?? '—')}
                                  </td>
                                  <td className="px-2 py-1.5 text-gray-600">
                                    {esServicio ? (
                                      <form action={guardarItem}>
                                        <input type="hidden" name="observaciones" value={item.observaciones ?? ''} />
                                        <input type="hidden" name="fechaProgramada" value={item.fechaProgramadaInput} />
                                        <input
                                          type="date"
                                          name="fechaRealizada"
                                          defaultValue={item.fechaRealizadaInput}
                                          onChange={e => e.currentTarget.form?.requestSubmit()}
                                          className="text-[11px] border border-transparent hover:border-gray-200 focus:border-[#13602C] rounded px-1 py-0.5 focus:outline-none bg-transparent"
                                        />
                                      </form>
                                    ) : item.facturaUrl ? (
                                      <a href={item.facturaUrl} target="_blank" rel="noopener noreferrer" className="text-[#13602C] hover:underline inline-flex items-center gap-1">
                                        <FileText className="w-3 h-3" />Ver
                                      </a>
                                    ) : <span className="text-gray-400">Pendiente</span>}
                                  </td>
                                  <td className="px-2 py-1.5 min-w-[160px]">
                                    <form action={guardarItem}>
                                      <input type="hidden" name="fechaProgramada" value={item.fechaProgramadaInput} />
                                      <input type="hidden" name="fechaRealizada" value={item.fechaRealizadaInput} />
                                      <input
                                        name="observaciones"
                                        defaultValue={item.observaciones ?? ''}
                                        placeholder="Sin observaciones"
                                        onBlur={e => e.currentTarget.form?.requestSubmit()}
                                        className={notaClass}
                                      />
                                    </form>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>

                        {/* Pie: responsable, solicitud y acceso al detalle completo */}
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 pt-2 border-t border-gray-200 text-[11px] text-gray-500">
                          <form action={asignar} className="flex items-center gap-1.5">
                            <span>Responsable:</span>
                            <select
                              key={oc.responsable?.id ?? 'none'}
                              name="responsableActualId"
                              defaultValue={oc.responsable?.id ?? ''}
                              onChange={e => e.currentTarget.form?.requestSubmit()}
                              className="h-7 rounded border border-gray-200 bg-white px-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-[#13602C]"
                            >
                              <option value="">Sin asignar</option>
                              {responsables.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                            </select>
                          </form>
                          <span>
                            Solicitud:{' '}
                            <Link href={`/operaciones/requerimientos/${oc.solicitud.id}`} className="font-mono text-[#13602C] hover:underline">
                              {oc.solicitud.numero}
                            </Link>
                            {' '}· {oc.solicitud.solicitante}
                          </span>
                          <span>Emitido por: <span className="text-gray-700">{oc.emitidoPor}</span></span>
                          <button onClick={() => toggleDetalle(oc.id)} className="text-[#13602C] hover:underline font-medium">
                            {detalles.has(oc.id) ? 'Ocultar' : 'Ver'} documentos e historial ({oc.documentos.length})
                          </button>
                          <Link href={`/operaciones/ordenes-compra/${oc.id}`} className="ml-auto text-[#13602C] hover:underline font-medium">
                            Ver orden completa →
                          </Link>
                        </div>

                        {detalles.has(oc.id) && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
                            <div className="bg-white rounded-lg border border-gray-200 p-3">
                              <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Documentos</h4>
                              {oc.documentos.length === 0
                                ? <p className="text-[11px] text-gray-400">Sin documentos adjuntos</p>
                                : (
                                  <ul className="space-y-1">
                                    {oc.documentos.map((d, i) => (
                                      <li key={i}>
                                        <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#13602C] hover:underline inline-flex items-center gap-1">
                                          <ExternalLink className="w-3 h-3" />{d.label}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-3">
                              <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Historial</h4>
                              <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
                                {oc.timeline.map((ev, i) => (
                                  <li key={i} className="text-[11px] flex items-start gap-2">
                                    <span className="text-gray-400 whitespace-nowrap">{ev.fecha}</span>
                                    <span className="text-gray-700">{ev.texto}</span>
                                    {ev.usuario && <span className="ml-auto text-gray-400 whitespace-nowrap">{ev.usuario}</span>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Leyenda */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-gray-600">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /><b>Entregado / Sí:</b> completado</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /><b>En tránsito:</b> en camino al destino</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /><b>Programado:</b> actividad agendada</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /><b>Parcial:</b> entrega incompleta</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-400" /><b>Pendiente:</b> por iniciar</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /><b>No / Alerta:</b> requiere atención</span>
      </div>

      {/* Montos y rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
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
    </div>
  )
}
