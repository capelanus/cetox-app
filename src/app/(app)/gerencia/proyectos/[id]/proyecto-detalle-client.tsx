'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, CalendarClock, LayoutGrid, List, Flag,
} from 'lucide-react'
import { crearTarea, actualizarTarea, eliminarTarea } from '@/app/actions/proyectos-tareas'
import {
  ESTADO_TAREA, ESTADO_TAREA_LABEL, ESTADO_TAREA_COLOR, PRIORIDAD_TAREA_LABEL, PRIORIDAD_TAREA_COLOR,
  ESTADO_PROYECTO_LABEL, ESTADO_PROYECTO_COLOR, DEPTO_LABEL, iniciales,
} from '@/lib/planeamiento'
import { Modal, Txt, Area, Sel, Field, UsuarioSel, useAction, nombreUsuario, type Usuario } from '@/components/planeamiento/kit'

interface Tarea {
  id: string; titulo: string; descripcion: string | null; responsableId: string | null
  estado: string; prioridad: string | null; fechaVencimiento: string | null; orden: number
}
interface Proyecto {
  id: string; nombre: string; descripcion: string | null; estado: string; avance: number
  gerenteId: string | null; departamento: string | null
  fechaInicioPlan: string | null; fechaFinPlan: string | null
  hitos: { id: string; nombre: string; completado: boolean }[]
  tareas: Tarea[]
}

const estadoOpts = ESTADO_TAREA.map(e => ({ value: e.key, label: e.label }))
const prioOpts = [{ value: 'ALTA', label: 'Alta' }, { value: 'MEDIA', label: 'Media' }, { value: 'BAJA', label: 'Baja' }]
const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : null
const vencida = (d: string | null, estado: string) => !!d && estado !== 'HECHO' && new Date(d).getTime() < Date.now()

export function ProyectoDetalleClient({ proyecto, usuarios }: { proyecto: Proyecto; usuarios: Usuario[] }) {
  const [pending, run] = useAction()
  const [vista, setVista] = useState<'tablero' | 'lista'>('tablero')
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; estado?: string; data?: Tarea } | null>(null)

  const hechas = proyecto.tareas.filter(t => t.estado === 'HECHO').length
  const total = proyecto.tareas.length

  function guardar(d: any) {
    run(async () => {
      if (modal?.mode === 'new') await crearTarea({ proyectoId: proyecto.id, ...d })
      else await actualizarTarea(modal!.data!.id, d)
      setModal(null)
    })
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <Link href="/gerencia/proyectos" className="text-slate-400 hover:text-slate-700"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold text-slate-900">{proyecto.nombre}</h1>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: ESTADO_PROYECTO_COLOR[proyecto.estado] }}>
          {ESTADO_PROYECTO_LABEL[proyecto.estado] ?? proyecto.estado}
        </span>
      </div>
      <div className="flex items-center gap-4 mb-5 pl-8 text-xs text-slate-500 flex-wrap">
        {proyecto.departamento && <span>{DEPTO_LABEL[proyecto.departamento] ?? proyecto.departamento}</span>}
        {nombreUsuario(usuarios, proyecto.gerenteId) && <span>Gerente: {nombreUsuario(usuarios, proyecto.gerenteId)}</span>}
        <span>Avance del proyecto: <b className="text-slate-700">{proyecto.avance}%</b></span>
        <span>Tareas: <b className="text-slate-700">{hechas}/{total}</b> hechas</span>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          {([['tablero', 'Tablero', LayoutGrid], ['lista', 'Lista', List]] as const).map(([k, label, Icon]) => (
            <button key={k} onClick={() => setVista(k)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold ${vista === k ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
        <button onClick={() => setModal({ mode: 'new' })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: '#13602C' }}>
          <Plus className="w-4 h-4" /> Tarea
        </button>
      </div>

      {vista === 'tablero' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ESTADO_TAREA.map(col => {
            const tareas = proyecto.tareas.filter(t => t.estado === col.key)
            return (
              <div key={col.key} className="bg-slate-50 rounded-xl p-2.5">
                <div className="flex items-center gap-2 px-1 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-xs font-bold text-slate-600">{col.label}</span>
                  <span className="text-xs text-slate-400">{tareas.length}</span>
                </div>
                <div className="space-y-2">
                  {tareas.map(t => (
                    <TareaCard key={t.id} t={t} usuarios={usuarios} pending={pending} run={run}
                      onEdit={() => setModal({ mode: 'edit', data: t })} />
                  ))}
                </div>
                <button onClick={() => setModal({ mode: 'new', estado: col.key })}
                  className="w-full mt-2 flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-700 px-1 py-1">
                  <Plus className="w-3.5 h-3.5" /> Agregar
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <ListaTareas tareas={proyecto.tareas} usuarios={usuarios} pending={pending} run={run}
          onEdit={t => setModal({ mode: 'edit', data: t })} />
      )}

      {modal && (
        <TareaModal mode={modal.mode} data={modal.data} estadoInicial={modal.estado} usuarios={usuarios} pending={pending}
          onClose={() => setModal(null)} onSave={guardar} />
      )}
    </div>
  )
}

function TareaCard({ t, usuarios, pending, run, onEdit }: {
  t: Tarea; usuarios: Usuario[]; pending: boolean; run: (fn: () => Promise<void>) => void; onEdit: () => void
}) {
  const idx = ESTADO_TAREA.findIndex(e => e.key === t.estado)
  const resp = nombreUsuario(usuarios, t.responsableId)
  const venc = vencida(t.fechaVencimiento, t.estado)
  const mover = (dir: -1 | 1) => {
    const next = ESTADO_TAREA[idx + dir]
    if (next) run(() => actualizarTarea(t.id, { estado: next.key }))
  }
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-2.5 group">
      <div className="flex items-start gap-1.5">
        <p className="flex-1 text-xs font-medium text-slate-800 leading-snug">{t.titulo}</p>
        <button onClick={onEdit} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-slate-600"><Pencil className="w-3 h-3" /></button>
      </div>
      <div className="flex items-center gap-2 mt-2">
        {t.prioridad && (
          <span className="flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded" style={{ color: PRIORIDAD_TAREA_COLOR[t.prioridad], backgroundColor: `${PRIORIDAD_TAREA_COLOR[t.prioridad]}1a` }}>
            <Flag className="w-2.5 h-2.5" />{PRIORIDAD_TAREA_LABEL[t.prioridad]}
          </span>
        )}
        {t.fechaVencimiento && (
          <span className={`flex items-center gap-0.5 text-[10px] ${venc ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
            <CalendarClock className="w-3 h-3" />{fmt(t.fechaVencimiento)}
          </span>
        )}
        {resp && (
          <span className="ml-auto w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold flex items-center justify-center flex-shrink-0" title={resp}>
            {iniciales(resp)}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
        <button disabled={idx === 0 || pending} onClick={() => mover(-1)}
          className="text-slate-300 hover:text-slate-600 disabled:opacity-30"><ChevronLeft className="w-3.5 h-3.5" /></button>
        <button onClick={() => run(() => eliminarTarea(t.id))} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
        <button disabled={idx === ESTADO_TAREA.length - 1 || pending} onClick={() => mover(1)}
          className="text-slate-300 hover:text-slate-600 disabled:opacity-30"><ChevronRight className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  )
}

function ListaTareas({ tareas, usuarios, pending, run, onEdit }: {
  tareas: Tarea[]; usuarios: Usuario[]; pending: boolean; run: (fn: () => Promise<void>) => void; onEdit: (t: Tarea) => void
}) {
  if (tareas.length === 0) return <div className="bg-white rounded-xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-400">Sin tareas aún.</div>
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 text-xs">
            <th className="text-left font-semibold px-4 py-2.5">Tarea</th>
            <th className="text-left font-semibold px-3 py-2.5">Responsable</th>
            <th className="text-left font-semibold px-3 py-2.5">Vence</th>
            <th className="text-left font-semibold px-3 py-2.5">Prioridad</th>
            <th className="text-left font-semibold px-3 py-2.5">Estado</th>
            <th className="px-3 py-2.5"></th>
          </tr>
        </thead>
        <tbody>
          {tareas.map(t => {
            const venc = vencida(t.fechaVencimiento, t.estado)
            return (
              <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-4 py-2 font-medium text-slate-700">{t.titulo}</td>
                <td className="px-3 py-2 text-slate-600 text-xs">{nombreUsuario(usuarios, t.responsableId) ?? '—'}</td>
                <td className={`px-3 py-2 text-xs ${venc ? 'text-red-500 font-semibold' : 'text-slate-500'}`}>{fmt(t.fechaVencimiento) ?? '—'}</td>
                <td className="px-3 py-2 text-xs">{t.prioridad ? <span style={{ color: PRIORIDAD_TAREA_COLOR[t.prioridad] }}>{PRIORIDAD_TAREA_LABEL[t.prioridad]}</span> : '—'}</td>
                <td className="px-3 py-2">
                  <select value={t.estado} disabled={pending} onChange={e => run(() => actualizarTarea(t.id, { estado: e.target.value }))}
                    className="text-xs border border-slate-200 rounded px-1.5 py-1 bg-white" style={{ color: ESTADO_TAREA_COLOR[t.estado] }}>
                    {ESTADO_TAREA.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => onEdit(t)} className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => run(() => eliminarTarea(t.id))} className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
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

function TareaModal({ mode, data, estadoInicial, usuarios, onClose, onSave, pending }: {
  mode: 'new' | 'edit'; data?: Tarea; estadoInicial?: string; usuarios: Usuario[]; onClose: () => void
  onSave: (d: any) => void; pending: boolean
}) {
  const [f, setF] = useState({
    titulo: data?.titulo ?? '', descripcion: data?.descripcion ?? '', responsableId: data?.responsableId ?? '',
    estado: data?.estado ?? estadoInicial ?? 'POR_HACER', prioridad: data?.prioridad ?? '',
    fechaVencimiento: data?.fechaVencimiento?.slice(0, 10) ?? '',
  })
  const dateCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30'
  return (
    <Modal open onClose={onClose} title={mode === 'new' ? 'Nueva tarea' : 'Editar tarea'} pending={pending} wide
      onSubmit={() => onSave({
        titulo: f.titulo, descripcion: f.descripcion || undefined, responsableId: f.responsableId || undefined,
        estado: f.estado, prioridad: f.prioridad || (mode === 'edit' ? null : undefined),
        fechaVencimiento: f.fechaVencimiento || (mode === 'edit' ? null : undefined),
      })}>
      <Txt label="Título" value={f.titulo} onChange={v => setF({ ...f, titulo: v })} required />
      <Area label="Descripción" value={f.descripcion} onChange={v => setF({ ...f, descripcion: v })} rows={2} />
      <div className="grid grid-cols-2 gap-3">
        <UsuarioSel label="Responsable" value={f.responsableId} onChange={v => setF({ ...f, responsableId: v })} usuarios={usuarios} />
        <Sel label="Estado" value={f.estado} onChange={v => setF({ ...f, estado: v })} options={estadoOpts} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Sel label="Prioridad" value={f.prioridad} onChange={v => setF({ ...f, prioridad: v })} placeholder="— Sin prioridad —" options={prioOpts} />
        <Field label="Fecha de vencimiento"><input type="date" className={dateCls} value={f.fechaVencimiento} onChange={e => setF({ ...f, fechaVencimiento: e.target.value })} /></Field>
      </div>
    </Modal>
  )
}
