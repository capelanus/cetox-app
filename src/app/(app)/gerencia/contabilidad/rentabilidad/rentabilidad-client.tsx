'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PieChart, Plus, Pencil, Trash2, Users, FlaskConical } from 'lucide-react'
import { crearRentabilidad, actualizarRentabilidad, eliminarRentabilidad } from '@/app/actions/contabilidad'
import { MESES, soles, margen, margenPct, colorMargen } from '@/lib/contabilidad'
import { Modal, Txt, Num, Sel, Field, useAction } from '@/components/planeamiento/kit'

interface Registro {
  id: string; anio: number; periodo: number; clienteNombre: string; servicio: string
  ingreso: number; costoDirecto: number; costoIndirecto: number; comentario: string | null
}

export function RentabilidadClient({ anio, registros, clientes, servicios }: {
  anio: number; registros: Registro[]; clientes: string[]; servicios: string[]
}) {
  const router = useRouter()
  const [pending, run] = useAction()
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; data?: Registro } | null>(null)
  const [vista, setVista] = useState<'cliente' | 'servicio' | 'detalle'>('cliente')
  const anios = [anio - 1, anio, anio + 1]

  const agrupar = (key: 'clienteNombre' | 'servicio') => {
    const map = new Map<string, { ingreso: number; costo: number; n: number }>()
    for (const r of registros) {
      const k = r[key]
      const prev = map.get(k) ?? { ingreso: 0, costo: 0, n: 0 }
      prev.ingreso += r.ingreso
      prev.costo += r.costoDirecto + r.costoIndirecto
      prev.n++
      map.set(k, prev)
    }
    return [...map.entries()]
      .map(([nombre, v]) => ({ nombre, ...v, margen: v.ingreso - v.costo, pct: v.ingreso ? Math.round(((v.ingreso - v.costo) / v.ingreso) * 100) : null }))
      .sort((a, b) => b.margen - a.margen)
  }

  const totIngreso = registros.reduce((a, r) => a + r.ingreso, 0)
  const totCosto = registros.reduce((a, r) => a + r.costoDirecto + r.costoIndirecto, 0)
  const totMargen = totIngreso - totCosto
  const totPct = totIngreso ? Math.round((totMargen / totIngreso) * 100) : null

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-1">
            <PieChart className="w-4 h-4" /> Contabilidad y Finanzas
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Rentabilidad {anio}</h1>
          <p className="text-sm text-slate-500">Margen por cliente y por servicio.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={anio} onChange={e => router.push(`/gerencia/contabilidad/rentabilidad?anio=${e.target.value}`)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
            {anios.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => setModal({ mode: 'new' })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: '#13602C' }}>
            <Plus className="w-4 h-4" /> Registro
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Mini label="Ingresos" value={soles(totIngreso)} color="#10b981" />
        <Mini label="Costos" value={soles(totCosto)} color="#f97316" />
        <Mini label="Margen" value={soles(totMargen)} color={colorMargen(totPct)} />
        <Mini label="Margen %" value={totPct === null ? '—' : `${totPct}%`} color={colorMargen(totPct)} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {([['cliente', 'Por cliente'], ['servicio', 'Por servicio'], ['detalle', 'Detalle']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setVista(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${vista === k ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            {label}
          </button>
        ))}
      </div>

      {registros.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-400">
          Sin registros de rentabilidad para {anio}.
        </div>
      ) : vista === 'detalle' ? (
        <DetalleTabla registros={registros} pending={pending} run={run} onEdit={r => setModal({ mode: 'edit', data: r })} />
      ) : (
        <AgrupadoTabla
          icon={vista === 'cliente' ? <Users className="w-4 h-4" /> : <FlaskConical className="w-4 h-4" />}
          filas={agrupar(vista === 'cliente' ? 'clienteNombre' : 'servicio')}
          header={vista === 'cliente' ? 'Cliente' : 'Servicio'}
        />
      )}

      {modal && (
        <RegistroModal mode={modal.mode} data={modal.data} anio={anio} clientes={clientes} servicios={servicios} pending={pending}
          onClose={() => setModal(null)}
          onSave={d => run(async () => {
            if (modal.mode === 'new') await crearRentabilidad(d)
            else await actualizarRentabilidad(modal.data!.id, d)
            setModal(null)
          })} />
      )}
    </div>
  )
}

function Mini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
    </div>
  )
}

function AgrupadoTabla({ icon, filas, header }: {
  icon: React.ReactNode; header: string
  filas: { nombre: string; ingreso: number; costo: number; n: number; margen: number; pct: number | null }[]
}) {
  const maxMargen = Math.max(1, ...filas.map(f => Math.abs(f.margen)))
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400">
            <th className="text-left font-semibold px-4 py-2.5"><span className="flex items-center gap-1.5">{icon}{header}</span></th>
            <th className="text-right font-semibold px-3 py-2.5">Ingreso</th>
            <th className="text-right font-semibold px-3 py-2.5">Costo</th>
            <th className="text-right font-semibold px-3 py-2.5">Margen</th>
            <th className="text-left font-semibold px-4 py-2.5 w-40">Margen %</th>
          </tr>
        </thead>
        <tbody>
          {filas.map(f => (
            <tr key={f.nombre} className="border-b border-slate-50 hover:bg-slate-50/50">
              <td className="px-4 py-2 font-medium text-slate-700">{f.nombre} <span className="text-slate-300">({f.n})</span></td>
              <td className="px-3 py-2 text-right text-emerald-600">{soles(f.ingreso)}</td>
              <td className="px-3 py-2 text-right text-orange-500">{soles(f.costo)}</td>
              <td className="px-3 py-2 text-right font-semibold" style={{ color: colorMargen(f.pct) }}>{soles(f.margen)}</td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(Math.abs(f.margen) / maxMargen) * 100}%`, backgroundColor: colorMargen(f.pct) }} />
                  </div>
                  <span className="font-bold w-9 text-right" style={{ color: colorMargen(f.pct) }}>{f.pct === null ? '—' : `${f.pct}%`}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DetalleTabla({ registros, pending, run, onEdit }: {
  registros: Registro[]; pending: boolean; run: (fn: () => Promise<void>) => void; onEdit: (r: Registro) => void
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400">
            <th className="text-left font-semibold px-4 py-2.5">Mes</th>
            <th className="text-left font-semibold px-3 py-2.5">Cliente</th>
            <th className="text-left font-semibold px-3 py-2.5">Servicio</th>
            <th className="text-right font-semibold px-3 py-2.5">Ingreso</th>
            <th className="text-right font-semibold px-3 py-2.5">Costo</th>
            <th className="text-right font-semibold px-3 py-2.5">Margen</th>
            <th className="px-3 py-2.5"></th>
          </tr>
        </thead>
        <tbody>
          {registros.map(r => {
            const m = margen(r.ingreso, r.costoDirecto, r.costoIndirecto)
            const pct = margenPct(r.ingreso, r.costoDirecto, r.costoIndirecto)
            return (
              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-4 py-2 text-slate-500">{MESES[r.periodo - 1]}</td>
                <td className="px-3 py-2 text-slate-700">{r.clienteNombre}</td>
                <td className="px-3 py-2 text-slate-600">{r.servicio}</td>
                <td className="px-3 py-2 text-right text-emerald-600">{soles(r.ingreso)}</td>
                <td className="px-3 py-2 text-right text-orange-500">{soles(r.costoDirecto + r.costoIndirecto)}</td>
                <td className="px-3 py-2 text-right font-semibold" style={{ color: colorMargen(pct) }}>{soles(m)}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => onEdit(r)} className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => run(() => eliminarRentabilidad(r.id))} className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function RegistroModal({ mode, data, anio, clientes, servicios, onClose, onSave, pending }: {
  mode: 'new' | 'edit'; data?: Registro; anio: number; clientes: string[]; servicios: string[]
  onClose: () => void; onSave: (d: any) => void; pending: boolean
}) {
  const [f, setF] = useState({
    periodo: String(data?.periodo ?? new Date().getMonth() + 1),
    clienteNombre: data?.clienteNombre ?? '', servicio: data?.servicio ?? '',
    ingreso: data?.ingreso ?? '', costoDirecto: data?.costoDirecto ?? '', costoIndirecto: data?.costoIndirecto ?? '',
    comentario: data?.comentario ?? '',
  })
  const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500'
  return (
    <Modal open onClose={onClose} title={mode === 'new' ? 'Nuevo registro de rentabilidad' : 'Editar registro'} pending={pending} wide
      onSubmit={() => onSave({
        anio, periodo: parseInt(f.periodo), clienteNombre: f.clienteNombre, servicio: f.servicio,
        ingreso: Number(f.ingreso) || 0, costoDirecto: Number(f.costoDirecto) || 0, costoIndirecto: Number(f.costoIndirecto) || 0,
        comentario: f.comentario || undefined,
      })}>
      <datalist id="dl-clientes">{clientes.map(c => <option key={c} value={c} />)}</datalist>
      <datalist id="dl-servicios">{servicios.map(s => <option key={s} value={s} />)}</datalist>
      <div className="grid grid-cols-2 gap-3">
        <Sel label="Mes" value={f.periodo} onChange={v => setF({ ...f, periodo: v })}
          options={MESES.map((m, i) => ({ value: String(i + 1), label: m }))} />
        <Field label="Cliente">
          <input className={inputCls} list="dl-clientes" value={f.clienteNombre} onChange={e => setF({ ...f, clienteNombre: e.target.value })} required />
        </Field>
      </div>
      <Field label="Servicio">
        <input className={inputCls} list="dl-servicios" value={f.servicio} onChange={e => setF({ ...f, servicio: e.target.value })} placeholder="Ensayo o servicio" required />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Num label="Ingreso (S/)" value={f.ingreso} onChange={v => setF({ ...f, ingreso: v as any })} step="any" min={0} />
        <Num label="Costo directo (S/)" value={f.costoDirecto} onChange={v => setF({ ...f, costoDirecto: v as any })} step="any" min={0} />
        <Num label="Costo indirecto (S/)" value={f.costoIndirecto} onChange={v => setF({ ...f, costoIndirecto: v as any })} step="any" min={0} />
      </div>
    </Modal>
  )
}
