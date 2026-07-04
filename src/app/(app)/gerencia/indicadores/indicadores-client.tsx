'use client'

import { useState } from 'react'
import { Gauge, Plus, Pencil, Trash2, ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import { crearIndicador, actualizarIndicador, eliminarIndicador, guardarMedicion } from '@/app/actions/planeamiento'
import {
  DEPARTAMENTOS, DEPTO_LABEL, MESES, cumplimientoKpi, semaforoDeCumplimiento, SEMAFORO_COLOR, SEMAFORO_LABEL,
} from '@/lib/planeamiento'
import { Modal, Txt, Num, Sel, UsuarioSel, useAction, type Usuario } from '@/components/planeamiento/kit'

interface Medicion { id: string; anio: number; periodo: number; valor: number; comentario: string | null }
interface Indicador {
  id: string; nombre: string; formula: string | null; unidad: string | null; sentido: string
  frecuencia: string; lineaBase: number | null; meta: number | null; departamento: string | null
  objetivoId: string | null; responsableId: string | null; mediciones: Medicion[]
}
interface ObjetivoRef { id: string; codigo: string; nombre: string }

const deptoOpts = DEPARTAMENTOS.map(d => ({ value: d.key, label: d.label }))
const sentidoOpts = [{ value: 'ASCENDENTE', label: 'Ascendente (mayor es mejor)' }, { value: 'DESCENDENTE', label: 'Descendente (menor es mejor)' }]
const frecOpts = [{ value: 'MENSUAL', label: 'Mensual' }, { value: 'TRIMESTRAL', label: 'Trimestral' }, { value: 'ANUAL', label: 'Anual' }]

function ultimaMedicion(m: Medicion[]): Medicion | null {
  return m.length ? m.reduce((a, b) => (b.periodo > a.periodo ? b : a)) : null
}

export function IndicadoresClient({ anio, indicadores, objetivos, usuarios }: {
  anio: number; indicadores: Indicador[]; objetivos: ObjetivoRef[]; usuarios: Usuario[]
}) {
  const [pending, run] = useAction()
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; data?: Indicador } | null>(null)

  // Resumen semáforos
  const conteo = { verde: 0, ambar: 0, rojo: 0, gris: 0 }
  indicadores.forEach(i => {
    const um = ultimaMedicion(i.mediciones)
    const pct = cumplimientoKpi(um?.valor ?? null, i.meta, i.sentido)
    conteo[semaforoDeCumplimiento(pct)]++
  })

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-1">
            <Gauge className="w-4 h-4" /> Indicadores de gestión (KPIs)
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Indicadores {anio}</h1>
        </div>
        <button onClick={() => setModal({ mode: 'new' })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: '#13602C' }}>
          <Plus className="w-4 h-4" /> Indicador
        </button>
      </div>

      {/* Semáforos resumen */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {(['verde', 'ambar', 'rojo', 'gris'] as const).map(s => (
          <div key={s} className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SEMAFORO_COLOR[s] }} />
              <span className="text-xs text-slate-500">{SEMAFORO_LABEL[s]}</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{conteo[s]}</p>
          </div>
        ))}
      </div>

      {indicadores.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-400">
          Sin indicadores. Crea el primer KPI.
        </div>
      ) : (
        <div className="space-y-2">
          {indicadores.map(i => (
            <IndicadorRow key={i.id} i={i} anio={anio} pending={pending} run={run}
              onEdit={() => setModal({ mode: 'edit', data: i })}
              onDelete={() => run(() => eliminarIndicador(i.id))} />
          ))}
        </div>
      )}

      {modal && (
        <IndicadorModal mode={modal.mode} data={modal.data} objetivos={objetivos} usuarios={usuarios} pending={pending}
          onClose={() => setModal(null)}
          onSave={d => run(async () => {
            if (modal.mode === 'new') await crearIndicador(d)
            else await actualizarIndicador(modal.data!.id, d)
            setModal(null)
          })} />
      )}
    </div>
  )
}

function IndicadorRow({ i, anio, pending, run, onEdit, onDelete }: {
  i: Indicador; anio: number; pending: boolean; run: (fn: () => Promise<void>) => void; onEdit: () => void; onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const um = ultimaMedicion(i.mediciones)
  const pct = cumplimientoKpi(um?.valor ?? null, i.meta, i.sentido)
  const sem = semaforoDeCumplimiento(pct)

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setOpen(o => !o)} className="text-slate-400 hover:text-slate-600">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: SEMAFORO_COLOR[sem] }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{i.nombre}</p>
          <div className="flex items-center gap-3 mt-0.5">
            {i.departamento && <span className="text-[11px] text-slate-400">{DEPTO_LABEL[i.departamento] ?? i.departamento}</span>}
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              {i.sentido === 'DESCENDENTE' ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              Meta: {i.meta ?? '—'} {i.unidad ?? ''}
            </span>
            {i.lineaBase !== null && <span className="text-[11px] text-slate-400">Base: {i.lineaBase}</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0 w-28">
          <p className="text-lg font-bold text-slate-800 leading-none">{um ? `${um.valor}${i.unidad === '%' ? '%' : ''}` : '—'}</p>
          <p className="text-[11px] font-semibold" style={{ color: SEMAFORO_COLOR[sem] }}>
            {pct === null ? 'sin datos' : `${pct}% de meta`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {open && <MedicionGrid i={i} anio={anio} pending={pending} run={run} />}
    </div>
  )
}

function MedicionGrid({ i, anio, pending, run }: { i: Indicador; anio: number; pending: boolean; run: (fn: () => Promise<void>) => void }) {
  const byP = new Map(i.mediciones.map(m => [m.periodo, m]))
  const [draft, setDraft] = useState<Record<number, string>>(() => {
    const o: Record<number, string> = {}
    for (let m = 1; m <= 12; m++) o[m] = byP.has(m) ? String(byP.get(m)!.valor) : ''
    return o
  })

  function save(periodo: number) {
    const v = draft[periodo]
    if (v === '') return
    run(() => guardarMedicion({ indicadorId: i.id, anio, periodo, valor: parseFloat(v) || 0 }))
  }

  return (
    <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 overflow-x-auto">
      {i.formula && <p className="text-[11px] text-slate-400 mb-2">Fórmula: <span className="text-slate-500">{i.formula}</span></p>}
      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-400">{MESES.map(m => <th key={m} className="px-1 font-medium pb-1">{m}</th>)}</tr>
        </thead>
        <tbody>
          <tr>
            {MESES.map((_, idx) => {
              const pct = cumplimientoKpi(draft[idx + 1] === '' ? null : parseFloat(draft[idx + 1]), i.meta, i.sentido)
              const col = pct === null ? undefined : SEMAFORO_COLOR[semaforoDeCumplimiento(pct)]
              return (
                <td key={idx} className="px-0.5">
                  <input value={draft[idx + 1]} onChange={e => setDraft({ ...draft, [idx + 1]: e.target.value })}
                    onBlur={() => save(idx + 1)}
                    className="w-12 border border-slate-200 rounded px-1 py-0.5 text-center text-[11px] bg-white font-semibold"
                    style={{ color: col }} />
                </td>
              )
            })}
          </tr>
        </tbody>
      </table>
      <p className="text-[10px] text-slate-400 mt-1.5">Se guarda al salir de cada celda. {pending && '· guardando…'}</p>
    </div>
  )
}

function IndicadorModal({ mode, data, objetivos, usuarios, onClose, onSave, pending }: {
  mode: 'new' | 'edit'; data?: Indicador; objetivos: ObjetivoRef[]; usuarios: Usuario[]; onClose: () => void
  onSave: (d: any) => void; pending: boolean
}) {
  const [f, setF] = useState({
    nombre: data?.nombre ?? '', objetivoId: data?.objetivoId ?? '', formula: data?.formula ?? '',
    unidad: data?.unidad ?? '', sentido: data?.sentido ?? 'ASCENDENTE', frecuencia: data?.frecuencia ?? 'MENSUAL',
    lineaBase: data?.lineaBase ?? '', meta: data?.meta ?? '', departamento: data?.departamento ?? '',
    responsableId: data?.responsableId ?? '',
  })
  return (
    <Modal open onClose={onClose} title={mode === 'new' ? 'Nuevo indicador' : 'Editar indicador'} pending={pending} wide
      onSubmit={() => onSave({
        nombre: f.nombre, objetivoId: f.objetivoId || undefined, formula: f.formula || undefined,
        unidad: f.unidad || undefined, sentido: f.sentido, frecuencia: f.frecuencia,
        lineaBase: f.lineaBase === '' ? undefined : Number(f.lineaBase),
        meta: f.meta === '' ? undefined : Number(f.meta),
        departamento: f.departamento || undefined, responsableId: f.responsableId || undefined,
      })}>
      <Txt label="Nombre del indicador" value={f.nombre} onChange={v => setF({ ...f, nombre: v })} required />
      <Txt label="Fórmula de cálculo" value={f.formula} onChange={v => setF({ ...f, formula: v })}
        placeholder="(informes a tiempo / informes totales) × 100" />
      <div className="grid grid-cols-2 gap-3">
        <Sel label="Objetivo asociado (OEI)" value={f.objetivoId} onChange={v => setF({ ...f, objetivoId: v })}
          placeholder="— Ninguno —" options={objetivos.map(o => ({ value: o.id, label: `${o.codigo} · ${o.nombre}` }))} />
        <Sel label="Departamento" value={f.departamento} onChange={v => setF({ ...f, departamento: v })}
          placeholder="Institucional" options={deptoOpts} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Sel label="Sentido" value={f.sentido} onChange={v => setF({ ...f, sentido: v })} options={sentidoOpts} />
        <Sel label="Frecuencia" value={f.frecuencia} onChange={v => setF({ ...f, frecuencia: v })} options={frecOpts} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Txt label="Unidad" value={f.unidad} onChange={v => setF({ ...f, unidad: v })} placeholder="%" />
        <Num label="Línea base" value={f.lineaBase} onChange={v => setF({ ...f, lineaBase: v as any })} step="any" />
        <Num label="Meta" value={f.meta} onChange={v => setF({ ...f, meta: v as any })} step="any" />
      </div>
      <UsuarioSel label="Responsable" value={f.responsableId} onChange={v => setF({ ...f, responsableId: v })} usuarios={usuarios} />
    </Modal>
  )
}
