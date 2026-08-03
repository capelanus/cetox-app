'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Rocket, Plus, Pencil, Trash2, ChevronDown, ChevronRight, User, CheckCircle2, Circle, Flag, LayoutGrid } from 'lucide-react'
import {
  crearProyecto, actualizarProyecto, eliminarProyecto, crearHito, toggleHito, eliminarHito,
} from '@/app/actions/planeamiento'
import {
  DEPARTAMENTOS, DEPTO_LABEL, ESTADO_PROYECTO_LABEL, ESTADO_PROYECTO_COLOR,
} from '@/lib/planeamiento'
import { Modal, Txt, Area, Num, Sel, Field, UsuarioSel, useAction, nombreUsuario, type Usuario } from '@/components/planeamiento/kit'

interface Hito { id: string; nombre: string; fechaPlan: string | null; fechaReal: string | null; completado: boolean; orden: number }
interface Proyecto {
  id: string; nombre: string; descripcion: string | null; objetivoId: string | null
  sponsorId: string | null; gerenteId: string | null; departamento: string | null
  fechaInicioPlan: string | null; fechaFinPlan: string | null
  presupuesto: number | null; avance: number; estado: string; hitos: Hito[]
}
interface ObjetivoRef { id: string; codigo: string; nombre: string }

const deptoOpts = DEPARTAMENTOS.map(d => ({ value: d.key, label: d.label }))
const estadoOpts = Object.entries(ESTADO_PROYECTO_LABEL).map(([value, label]) => ({ value, label }))
const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export function ProyectosClient({ proyectos, objetivos, usuarios }: {
  proyectos: Proyecto[]; objetivos: ObjetivoRef[]; usuarios: Usuario[]
}) {
  const [pending, run] = useAction()
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; data?: Proyecto } | null>(null)

  const activos = proyectos.filter(p => p.estado === 'EN_CURSO').length
  const completados = proyectos.filter(p => p.estado === 'COMPLETADO').length

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-1">
            <Rocket className="w-4 h-4" /> Proyectos estratégicos
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Portafolio de proyectos</h1>
          <p className="text-sm text-slate-500">{proyectos.length} proyectos · {activos} en curso · {completados} completados</p>
        </div>
        <button onClick={() => setModal({ mode: 'new' })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: '#13602C' }}>
          <Plus className="w-4 h-4" /> Proyecto
        </button>
      </div>

      {proyectos.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-400">
          Sin proyectos registrados.
        </div>
      ) : (
        <div className="space-y-3">
          {proyectos.map(p => (
            <ProyectoCard key={p.id} p={p} usuarios={usuarios} pending={pending} run={run}
              onEdit={() => setModal({ mode: 'edit', data: p })}
              onDelete={() => run(() => eliminarProyecto(p.id))} />
          ))}
        </div>
      )}

      {modal && (
        <ProyectoModal mode={modal.mode} data={modal.data} objetivos={objetivos} usuarios={usuarios} pending={pending}
          onClose={() => setModal(null)}
          onSave={d => run(async () => {
            if (modal.mode === 'new') await crearProyecto(d)
            else await actualizarProyecto(modal.data!.id, d)
            setModal(null)
          })} />
      )}
    </div>
  )
}

function ProyectoCard({ p, usuarios, pending, run, onEdit, onDelete }: {
  p: Proyecto; usuarios: Usuario[]; pending: boolean; run: (fn: () => Promise<void>) => void; onEdit: () => void; onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [nuevoHito, setNuevoHito] = useState('')
  const gerente = nombreUsuario(usuarios, p.gerenteId)
  const hitosOk = p.hitos.filter(h => h.completado).length

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3.5">
        <div className="flex items-start gap-3">
          <button onClick={() => setOpen(o => !o)} className="mt-0.5 text-slate-400 hover:text-slate-600">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link href={`/gerencia/proyectos/${p.id}`} className="text-sm font-semibold text-slate-800 hover:text-emerald-700 hover:underline">{p.nombre}</Link>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: ESTADO_PROYECTO_COLOR[p.estado] }}>
                {ESTADO_PROYECTO_LABEL[p.estado] ?? p.estado}
              </span>
              <Link href={`/gerencia/proyectos/${p.id}`} className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800">
                <LayoutGrid className="w-3 h-3" /> Tablero
              </Link>
            </div>
            {p.descripcion && <p className="text-xs text-slate-500 mt-0.5">{p.descripcion}</p>}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400">{fmt(p.fechaInicioPlan)} → {fmt(p.fechaFinPlan)}</span>
              {gerente && <span className="flex items-center gap-1 text-[11px] text-slate-400"><User className="w-3 h-3" />{gerente}</span>}
              {p.departamento && <span className="text-[11px] text-slate-400">{DEPTO_LABEL[p.departamento] ?? p.departamento}</span>}
              {p.hitos.length > 0 && <span className="flex items-center gap-1 text-[11px] text-slate-400"><Flag className="w-3 h-3" />{hitosOk}/{p.hitos.length} hitos</span>}
            </div>
          </div>
          <div className="w-32 flex-shrink-0">
            <div className="flex justify-between mb-1"><span className="text-[11px] text-slate-400">Avance</span><span className="text-xs font-bold text-slate-700">{p.avance}%</span></div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${p.avance}%`, backgroundColor: ESTADO_PROYECTO_COLOR[p.estado] }} />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onEdit} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={onDelete} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hitos</p>
          <div className="space-y-1.5">
            {p.hitos.map(h => (
              <div key={h.id} className="flex items-center gap-2 bg-white rounded-lg border border-slate-100 px-3 py-2">
                <button onClick={() => run(() => toggleHito(h.id))}>
                  {h.completado ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4 text-slate-300" />}
                </button>
                <span className={`flex-1 text-xs ${h.completado ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{h.nombre}</span>
                <span className="text-[10px] text-slate-400">{fmt(h.fechaPlan)}</span>
                <button onClick={() => run(() => eliminarHito(h.id))} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
          <form className="flex gap-2 mt-2" onSubmit={e => {
            e.preventDefault()
            if (!nuevoHito.trim()) return
            run(async () => { await crearHito({ proyectoId: p.id, nombre: nuevoHito, orden: p.hitos.length }); setNuevoHito('') })
          }}>
            <input value={nuevoHito} onChange={e => setNuevoHito(e.target.value)} placeholder="Nuevo hito…"
              className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none" />
            <button type="submit" disabled={pending} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50">Agregar</button>
          </form>
        </div>
      )}
    </div>
  )
}

function ProyectoModal({ mode, data, objetivos, usuarios, onClose, onSave, pending }: {
  mode: 'new' | 'edit'; data?: Proyecto; objetivos: ObjetivoRef[]; usuarios: Usuario[]; onClose: () => void
  onSave: (d: any) => void; pending: boolean
}) {
  const [f, setF] = useState({
    nombre: data?.nombre ?? '', descripcion: data?.descripcion ?? '', objetivoId: data?.objetivoId ?? '',
    sponsorId: data?.sponsorId ?? '', gerenteId: data?.gerenteId ?? '', departamento: data?.departamento ?? '',
    fechaInicioPlan: data?.fechaInicioPlan?.slice(0, 10) ?? '', fechaFinPlan: data?.fechaFinPlan?.slice(0, 10) ?? '',
    presupuesto: data?.presupuesto ?? '', avance: data?.avance ?? 0, estado: data?.estado ?? 'PLANIFICADO',
  })
  const dateCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30'
  return (
    <Modal open onClose={onClose} title={mode === 'new' ? 'Nuevo proyecto' : 'Editar proyecto'} pending={pending} wide
      onSubmit={() => onSave({
        nombre: f.nombre, descripcion: f.descripcion || undefined, objetivoId: f.objetivoId || undefined,
        sponsorId: f.sponsorId || undefined, gerenteId: f.gerenteId || undefined, departamento: f.departamento || undefined,
        fechaInicioPlan: f.fechaInicioPlan || undefined, fechaFinPlan: f.fechaFinPlan || undefined,
        presupuesto: f.presupuesto === '' ? undefined : Number(f.presupuesto), avance: Number(f.avance), estado: f.estado,
      })}>
      <Txt label="Nombre del proyecto" value={f.nombre} onChange={v => setF({ ...f, nombre: v })} required />
      <Area label="Descripción" value={f.descripcion} onChange={v => setF({ ...f, descripcion: v })} rows={2} />
      <div className="grid grid-cols-2 gap-3">
        <Sel label="Objetivo asociado (OEI)" value={f.objetivoId} onChange={v => setF({ ...f, objetivoId: v })}
          placeholder="— Ninguno —" options={objetivos.map(o => ({ value: o.id, label: `${o.codigo} · ${o.nombre}` }))} />
        <Sel label="Departamento" value={f.departamento} onChange={v => setF({ ...f, departamento: v })} placeholder="—" options={deptoOpts} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <UsuarioSel label="Sponsor" value={f.sponsorId} onChange={v => setF({ ...f, sponsorId: v })} usuarios={usuarios} />
        <UsuarioSel label="Gerente de proyecto" value={f.gerenteId} onChange={v => setF({ ...f, gerenteId: v })} usuarios={usuarios} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Inicio planificado"><input type="date" className={dateCls} value={f.fechaInicioPlan} onChange={e => setF({ ...f, fechaInicioPlan: e.target.value })} /></Field>
        <Field label="Fin planificado"><input type="date" className={dateCls} value={f.fechaFinPlan} onChange={e => setF({ ...f, fechaFinPlan: e.target.value })} /></Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Num label="Presupuesto (S/)" value={f.presupuesto} onChange={v => setF({ ...f, presupuesto: v as any })} min={0} />
        <Num label="Avance (%)" value={f.avance} onChange={v => setF({ ...f, avance: v })} min={0} />
        <Sel label="Estado" value={f.estado} onChange={v => setF({ ...f, estado: v })} options={estadoOpts} />
      </div>
    </Modal>
  )
}
