'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardList, Plus, Pencil, Trash2, ChevronDown, ChevronRight, User, Save } from 'lucide-react'
import {
  crearActividad, actualizarActividad, eliminarActividad, guardarSeguimiento,
} from '@/app/actions/planeamiento'
import {
  DEPARTAMENTOS, DEPTO_LABEL, MESES, avanceActividad, semaforoDeCumplimiento, SEMAFORO_COLOR,
  ESTADO_ACTIVIDAD_LABEL,
} from '@/lib/planeamiento'
import { Modal, Txt, Num, Sel, UsuarioSel, useAction, nombreUsuario, type Usuario } from '@/components/planeamiento/kit'

interface Seguimiento { id: string; periodo: number; metaProgramada: number; ejecutado: number; comentario: string | null }
interface Actividad {
  id: string; anio: number; codigo: string | null; nombre: string; departamento: string
  responsableId: string | null; unidadMedida: string | null; metaAnual: number
  presupuesto: number | null; estado: string; accion: { codigo: string }; seguimientos: Seguimiento[]
}
interface AccionRef { id: string; codigo: string; nombre: string; oei: string }

const deptoOpts = DEPARTAMENTOS.map(d => ({ value: d.key, label: d.label }))
const estadoOpts = Object.entries(ESTADO_ACTIVIDAD_LABEL).map(([value, label]) => ({ value, label }))

function totalEjecutado(s: Seguimiento[]) { return s.reduce((a, b) => a + b.ejecutado, 0) }

export function PoaClient({ anio, actividades, acciones, usuarios, tienePlan }: {
  anio: number; actividades: Actividad[]; acciones: AccionRef[]; usuarios: Usuario[]; tienePlan: boolean
}) {
  const router = useRouter()
  const [pending, run] = useAction()
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; data?: Actividad } | null>(null)

  const grupos = DEPARTAMENTOS
    .map(d => ({ depto: d.key, label: d.label, items: actividades.filter(a => a.departamento === d.key) }))
    .filter(g => g.items.length > 0)

  const anios = [anio - 1, anio, anio + 1]

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-1">
            <ClipboardList className="w-4 h-4" /> Plan Operativo Anual
          </div>
          <h1 className="text-2xl font-bold text-slate-900">POA {anio}</h1>
          <p className="text-sm text-slate-500">Actividades operativas por departamento y su seguimiento mensual.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={anio} onChange={e => router.push(`/gerencia/poa?anio=${e.target.value}`)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
            {anios.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => setModal({ mode: 'new' })} disabled={!tienePlan}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-bold disabled:opacity-40"
            style={{ backgroundColor: '#13602C' }}>
            <Plus className="w-4 h-4" /> Actividad
          </button>
        </div>
      </div>

      {!tienePlan && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 mb-4">
          Primero crea el <b>PEI</b> con sus acciones estratégicas: las actividades del POA se enlazan a una AEI.
        </div>
      )}

      {grupos.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-400">
          Sin actividades registradas para {anio}.
        </div>
      ) : (
        <div className="space-y-6">
          {grupos.map(g => (
            <div key={g.depto}>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{g.label}</h2>
                <span className="text-xs text-slate-400">{g.items.length} actividad{g.items.length !== 1 && 'es'}</span>
              </div>
              <div className="space-y-2">
                {g.items.map(a => (
                  <ActividadRow key={a.id} a={a} usuarios={usuarios} pending={pending} run={run}
                    onEdit={() => setModal({ mode: 'edit', data: a })}
                    onDelete={() => run(() => eliminarActividad(a.id))} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ActividadModal mode={modal.mode} data={modal.data} acciones={acciones} usuarios={usuarios} anio={anio} pending={pending}
          onClose={() => setModal(null)}
          onSave={d => run(async () => {
            if (modal.mode === 'new') await crearActividad(d)
            else await actualizarActividad(modal.data!.id, d)
            setModal(null)
          })} />
      )}
    </div>
  )
}

function ActividadRow({ a, usuarios, pending, run, onEdit, onDelete }: {
  a: Actividad; usuarios: Usuario[]; pending: boolean; run: (fn: () => Promise<void>) => void
  onEdit: () => void; onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const ejec = totalEjecutado(a.seguimientos)
  const avance = avanceActividad(a.metaAnual, ejec)
  const sem = semaforoDeCumplimiento(avance)
  const resp = nombreUsuario(usuarios, a.responsableId)

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setOpen(o => !o)} className="text-slate-400 hover:text-slate-600">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold font-mono">{a.accion.codigo}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{a.nombre}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[11px] text-slate-400">Meta: {a.metaAnual} {a.unidadMedida ?? ''}</span>
            {resp && <span className="flex items-center gap-1 text-[11px] text-slate-400"><User className="w-3 h-3" />{resp}</span>}
            <span className="text-[11px] text-slate-400">{ESTADO_ACTIVIDAD_LABEL[a.estado] ?? a.estado}</span>
          </div>
        </div>
        {/* Avance */}
        <div className="w-40 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-slate-400">Avance</span>
            <span className="text-xs font-bold" style={{ color: SEMAFORO_COLOR[sem] }}>
              {avance === null ? '—' : `${avance}%`}
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, avance ?? 0)}%`, backgroundColor: SEMAFORO_COLOR[sem] }} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {open && <SeguimientoGrid a={a} pending={pending} run={run} />}
    </div>
  )
}

// Grilla mensual editable
function SeguimientoGrid({ a, pending, run }: { a: Actividad; pending: boolean; run: (fn: () => Promise<void>) => void }) {
  const byPeriodo = new Map(a.seguimientos.map(s => [s.periodo, s]))
  const [draft, setDraft] = useState<Record<number, { meta: string; ejec: string }>>(() => {
    const o: Record<number, { meta: string; ejec: string }> = {}
    for (let m = 1; m <= 12; m++) {
      const s = byPeriodo.get(m)
      o[m] = { meta: s ? String(s.metaProgramada) : '', ejec: s ? String(s.ejecutado) : '' }
    }
    return o
  })

  function save(periodo: number) {
    const d = draft[periodo]
    run(() => guardarSeguimiento({
      actividadId: a.id, periodo,
      metaProgramada: parseFloat(d.meta) || 0, ejecutado: parseFloat(d.ejec) || 0,
    }))
  }

  return (
    <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-400">
            <th className="text-left font-medium pb-1">Programado / Ejecutado</th>
            {MESES.map(m => <th key={m} className="px-1 font-medium pb-1">{m}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="text-slate-500 pr-2 py-0.5">Meta</td>
            {MESES.map((_, i) => (
              <td key={i} className="px-0.5">
                <input value={draft[i + 1].meta} onChange={e => setDraft({ ...draft, [i + 1]: { ...draft[i + 1], meta: e.target.value } })}
                  onBlur={() => save(i + 1)}
                  className="w-11 border border-slate-200 rounded px-1 py-0.5 text-center text-[11px] bg-white" />
              </td>
            ))}
          </tr>
          <tr>
            <td className="text-slate-500 pr-2 py-0.5">Real</td>
            {MESES.map((_, i) => (
              <td key={i} className="px-0.5">
                <input value={draft[i + 1].ejec} onChange={e => setDraft({ ...draft, [i + 1]: { ...draft[i + 1], ejec: e.target.value } })}
                  onBlur={() => save(i + 1)}
                  className="w-11 border border-slate-200 rounded px-1 py-0.5 text-center text-[11px] bg-white font-semibold text-emerald-700" />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
        <Save className="w-3 h-3" /> Los valores se guardan al salir de cada celda. {pending && '· guardando…'}
      </p>
    </div>
  )
}

function ActividadModal({ mode, data, acciones, usuarios, anio, onClose, onSave, pending }: {
  mode: 'new' | 'edit'; data?: Actividad; acciones: AccionRef[]; usuarios: Usuario[]; anio: number; pending: boolean
  onClose: () => void; onSave: (d: any) => void
}) {
  const [f, setF] = useState({
    accionId: '', nombre: data?.nombre ?? '', departamento: data?.departamento ?? '',
    responsableId: data?.responsableId ?? '', unidadMedida: data?.unidadMedida ?? '',
    metaAnual: data?.metaAnual ?? 0, presupuesto: data?.presupuesto ?? 0, estado: data?.estado ?? 'EN_CURSO',
  })

  return (
    <Modal open onClose={onClose} title={mode === 'new' ? 'Nueva actividad operativa' : 'Editar actividad'} pending={pending} wide
      onSubmit={() => {
        if (mode === 'new') {
          onSave({
            accionId: f.accionId, anio, nombre: f.nombre, departamento: f.departamento,
            responsableId: f.responsableId || undefined, unidadMedida: f.unidadMedida || undefined,
            metaAnual: Number(f.metaAnual), presupuesto: f.presupuesto ? Number(f.presupuesto) : undefined,
          })
        } else {
          onSave({
            nombre: f.nombre, departamento: f.departamento, responsableId: f.responsableId || undefined,
            unidadMedida: f.unidadMedida || undefined, metaAnual: Number(f.metaAnual),
            presupuesto: f.presupuesto ? Number(f.presupuesto) : null, estado: f.estado,
          })
        }
      }}>
      {mode === 'new' && (
        <Sel label="Acción estratégica (AEI)" value={f.accionId} onChange={v => setF({ ...f, accionId: v })}
          placeholder="— Selecciona una AEI —"
          options={acciones.map(a => ({ value: a.id, label: `${a.codigo} · ${a.nombre}` }))} />
      )}
      <Txt label="Nombre de la actividad" value={f.nombre} onChange={v => setF({ ...f, nombre: v })} required />
      <div className="grid grid-cols-2 gap-3">
        <Sel label="Departamento" value={f.departamento} onChange={v => setF({ ...f, departamento: v })}
          placeholder="— Selecciona —" options={deptoOpts} />
        <UsuarioSel label="Responsable" value={f.responsableId} onChange={v => setF({ ...f, responsableId: v })} usuarios={usuarios} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Txt label="Unidad de medida" value={f.unidadMedida} onChange={v => setF({ ...f, unidadMedida: v })} placeholder="informes" />
        <Num label="Meta anual" value={f.metaAnual} onChange={v => setF({ ...f, metaAnual: v })} min={0} />
        <Num label="Presupuesto (S/)" value={f.presupuesto} onChange={v => setF({ ...f, presupuesto: v })} min={0} />
      </div>
      {mode === 'edit' && (
        <Sel label="Estado" value={f.estado} onChange={v => setF({ ...f, estado: v })} options={estadoOpts} />
      )}
    </Modal>
  )
}
