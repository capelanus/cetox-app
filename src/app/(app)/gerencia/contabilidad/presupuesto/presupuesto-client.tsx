'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet, Plus, Pencil, Trash2, ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import { crearPartida, actualizarPartida, eliminarPartida, guardarLinea } from '@/app/actions/contabilidad'
import {
  MESES, CATEGORIAS_INGRESO, CATEGORIAS_EGRESO, soles, pctEjecucion, colorEjecucion,
} from '@/lib/contabilidad'
import { Modal, Txt, Sel, useAction } from '@/components/planeamiento/kit'

interface Linea { id: string; periodo: number; planificado: number; ejecutado: number }
interface Partida {
  id: string; anio: number; tipo: string; categoria: string; concepto: string
  centroCostoId: string | null; centroCosto: { nombre: string } | null; lineas: Linea[]
}
interface CentroRef { id: string; nombre: string }

const sum = (l: Linea[], k: 'planificado' | 'ejecutado') => l.reduce((a, b) => a + b[k], 0)

export function PresupuestoClient({ anio, partidas, centros }: {
  anio: number; partidas: Partida[]; centros: CentroRef[]
}) {
  const router = useRouter()
  const [pending, run] = useAction()
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; data?: Partida } | null>(null)

  const ingresos = partidas.filter(p => p.tipo === 'INGRESO')
  const egresos = partidas.filter(p => p.tipo === 'EGRESO')

  const totIngPlan = ingresos.reduce((a, p) => a + sum(p.lineas, 'planificado'), 0)
  const totIngEjec = ingresos.reduce((a, p) => a + sum(p.lineas, 'ejecutado'), 0)
  const totEgrPlan = egresos.reduce((a, p) => a + sum(p.lineas, 'planificado'), 0)
  const totEgrEjec = egresos.reduce((a, p) => a + sum(p.lineas, 'ejecutado'), 0)

  const anios = [anio - 1, anio, anio + 1]

  return (
    <div className="max-w-6xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-1">
            <Wallet className="w-4 h-4" /> Contabilidad y Finanzas
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Presupuesto {anio}</h1>
          <p className="text-sm text-slate-500">Partidas de ingresos y egresos con planificación y ejecución mensual.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={anio} onChange={e => router.push(`/gerencia/contabilidad/presupuesto?anio=${e.target.value}`)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
            {anios.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => setModal({ mode: 'new' })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: '#13602C' }}>
            <Plus className="w-4 h-4" /> Partida
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <ResumenCard label="Ingresos planificados" value={soles(totIngPlan)} color="#10b981" />
        <ResumenCard label="Ingresos ejecutados" value={soles(totIngEjec)} color="#059669" sub={`${pctEjecucion(totIngPlan, totIngEjec) ?? 0}% de meta`} />
        <ResumenCard label="Egresos planificados" value={soles(totEgrPlan)} color="#f97316" />
        <ResumenCard label="Resultado proyectado" value={soles(totIngPlan - totEgrPlan)} color={totIngPlan - totEgrPlan >= 0 ? '#10b981' : '#ef4444'}
          sub={`Real: ${soles(totIngEjec - totEgrEjec)}`} />
      </div>

      <Grupo titulo="Ingresos" icon={<TrendingUp className="w-4 h-4" />} partidas={ingresos} pending={pending} run={run}
        onEdit={p => setModal({ mode: 'edit', data: p })} onDelete={p => run(() => eliminarPartida(p.id))} />
      <Grupo titulo="Egresos" icon={<TrendingDown className="w-4 h-4" />} partidas={egresos} pending={pending} run={run}
        onEdit={p => setModal({ mode: 'edit', data: p })} onDelete={p => run(() => eliminarPartida(p.id))} />

      {modal && (
        <PartidaModal mode={modal.mode} data={modal.data} centros={centros} anio={anio} pending={pending}
          onClose={() => setModal(null)}
          onSave={d => run(async () => {
            if (modal.mode === 'new') await crearPartida(d)
            else await actualizarPartida(modal.data!.id, d)
            setModal(null)
          })} />
      )}
    </div>
  )
}

function ResumenCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function Grupo({ titulo, icon, partidas, pending, run, onEdit, onDelete }: {
  titulo: string; icon: React.ReactNode; partidas: Partida[]; pending: boolean; run: (fn: () => Promise<void>) => void
  onEdit: (p: Partida) => void; onDelete: (p: Partida) => void
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2 text-slate-700">
        {icon}<h2 className="text-sm font-bold uppercase tracking-wider">{titulo}</h2>
        <span className="text-xs text-slate-400">{partidas.length}</span>
      </div>
      {partidas.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 py-8 text-center text-sm text-slate-400">
          Sin partidas de {titulo.toLowerCase()}.
        </div>
      ) : (
        <div className="space-y-2">
          {partidas.map(p => <PartidaRow key={p.id} p={p} pending={pending} run={run} onEdit={() => onEdit(p)} onDelete={() => onDelete(p)} />)}
        </div>
      )}
    </div>
  )
}

function PartidaRow({ p, pending, run, onEdit, onDelete }: {
  p: Partida; pending: boolean; run: (fn: () => Promise<void>) => void; onEdit: () => void; onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const plan = sum(p.lineas, 'planificado')
  const ejec = sum(p.lineas, 'ejecutado')
  const pct = pctEjecucion(plan, ejec)
  const col = colorEjecucion(pct, p.tipo as 'INGRESO' | 'EGRESO')

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setOpen(o => !o)} className="text-slate-400 hover:text-slate-600">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{p.concepto}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[11px] text-slate-400">{p.categoria}</span>
            {p.centroCosto && <span className="text-[11px] text-slate-400">· {p.centroCosto.nombre}</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-slate-800">{soles(ejec)} <span className="text-slate-300 font-normal">/ {soles(plan)}</span></p>
          <p className="text-[11px] font-semibold" style={{ color: col }}>{pct === null ? 'sin plan' : `${pct}% ejecutado`}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      {open && <LineaGrid p={p} pending={pending} run={run} />}
    </div>
  )
}

function LineaGrid({ p, pending, run }: { p: Partida; pending: boolean; run: (fn: () => Promise<void>) => void }) {
  const byP = new Map(p.lineas.map(l => [l.periodo, l]))
  const [draft, setDraft] = useState<Record<number, { plan: string; ejec: string }>>(() => {
    const o: Record<number, { plan: string; ejec: string }> = {}
    for (let m = 1; m <= 12; m++) {
      const l = byP.get(m)
      o[m] = { plan: l ? String(l.planificado) : '', ejec: l ? String(l.ejecutado) : '' }
    }
    return o
  })
  function save(periodo: number) {
    const d = draft[periodo]
    run(() => guardarLinea({ partidaId: p.id, periodo, planificado: parseFloat(d.plan) || 0, ejecutado: parseFloat(d.ejec) || 0 }))
  }
  return (
    <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-400">
            <th className="text-left font-medium pb-1 pr-2">S/</th>
            {MESES.map(m => <th key={m} className="px-1 font-medium pb-1">{m}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="text-slate-500 pr-2 py-0.5">Plan</td>
            {MESES.map((_, i) => (
              <td key={i} className="px-0.5">
                <input value={draft[i + 1].plan} onChange={e => setDraft({ ...draft, [i + 1]: { ...draft[i + 1], plan: e.target.value } })}
                  onBlur={() => save(i + 1)} className="w-14 border border-slate-200 rounded px-1 py-0.5 text-center text-[11px] bg-white" />
              </td>
            ))}
          </tr>
          <tr>
            <td className="text-slate-500 pr-2 py-0.5">Real</td>
            {MESES.map((_, i) => (
              <td key={i} className="px-0.5">
                <input value={draft[i + 1].ejec} onChange={e => setDraft({ ...draft, [i + 1]: { ...draft[i + 1], ejec: e.target.value } })}
                  onBlur={() => save(i + 1)} className="w-14 border border-slate-200 rounded px-1 py-0.5 text-center text-[11px] bg-white font-semibold text-emerald-700" />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="text-[10px] text-slate-400 mt-1.5">Montos en soles. Se guarda al salir de cada celda. {pending && '· guardando…'}</p>
    </div>
  )
}

function PartidaModal({ mode, data, centros, anio, onClose, onSave, pending }: {
  mode: 'new' | 'edit'; data?: Partida; centros: CentroRef[]; anio: number; pending: boolean
  onClose: () => void; onSave: (d: any) => void
}) {
  const [f, setF] = useState({
    tipo: data?.tipo ?? 'EGRESO', categoria: data?.categoria ?? '', concepto: data?.concepto ?? '',
    centroCostoId: data?.centroCostoId ?? '',
  })
  const cats = f.tipo === 'INGRESO' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO
  return (
    <Modal open onClose={onClose} title={mode === 'new' ? 'Nueva partida presupuestal' : 'Editar partida'} pending={pending}
      onSubmit={() => {
        const base = { tipo: f.tipo, categoria: f.categoria, concepto: f.concepto, centroCostoId: f.centroCostoId || undefined }
        onSave(mode === 'new' ? { anio, ...base } : base)
      }}>
      <Sel label="Tipo" value={f.tipo} onChange={v => setF({ ...f, tipo: v, categoria: '' })}
        options={[{ value: 'INGRESO', label: 'Ingreso' }, { value: 'EGRESO', label: 'Egreso' }]} />
      <Sel label="Categoría" value={f.categoria} onChange={v => setF({ ...f, categoria: v })}
        placeholder="— Selecciona —" options={cats.map(c => ({ value: c, label: c }))} />
      <Txt label="Concepto" value={f.concepto} onChange={v => setF({ ...f, concepto: v })} placeholder="Ej. Compra de reactivos HPLC" required />
      <Sel label="Centro de costo" value={f.centroCostoId} onChange={v => setF({ ...f, centroCostoId: v })}
        placeholder="— Ninguno —" options={centros.map(c => ({ value: c.id, label: c.nombre }))} />
    </Modal>
  )
}
