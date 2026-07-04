'use client'

import { useState } from 'react'
import { Target, Plus, Pencil, Trash2, ChevronDown, ChevronRight, Building2, User, Compass } from 'lucide-react'
import {
  crearPlan, actualizarPlan, crearObjetivo, actualizarObjetivo, eliminarObjetivo,
  crearAccion, actualizarAccion, eliminarAccion,
} from '@/app/actions/planeamiento'
import { DEPARTAMENTOS, DEPTO_LABEL } from '@/lib/planeamiento'
import { Modal, Txt, Area, Sel, UsuarioSel, useAction, nombreUsuario, type Usuario } from '@/components/planeamiento/kit'

interface Accion {
  id: string; codigo: string; nombre: string; departamento: string | null; responsableId: string | null
}
interface Objetivo {
  id: string; codigo: string; nombre: string; descripcion: string | null
  departamento: string | null; responsableId: string | null; acciones: Accion[]
}
interface Plan {
  id: string; nombre: string; vision: string | null; mision: string | null
  anioInicio: number; anioFin: number; objetivos: Objetivo[]
}

const deptoOpts = DEPARTAMENTOS.map(d => ({ value: d.key, label: d.label }))

export function PeiClient({ plan, usuarios }: { plan: Plan | null; usuarios: Usuario[] }) {
  const [pending, run] = useAction()

  // ── Sin plan: onboarding ──
  if (!plan) return <SinPlan pending={pending} run={run} />

  return <PlanView plan={plan} usuarios={usuarios} pending={pending} run={run} />
}

// ────────────────────────────────────────────────────────────────────────────
function SinPlan({ pending, run }: { pending: boolean; run: (fn: () => Promise<void>) => void }) {
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ nombre: '', anioInicio: '2026', anioFin: '2030', vision: '', mision: '' })

  return (
    <div className="max-w-lg mx-auto text-center py-20">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
        <Target className="w-7 h-7 text-emerald-600" />
      </div>
      <h1 className="text-xl font-bold text-slate-800 mb-1">Plan Estratégico Institucional</h1>
      <p className="text-sm text-slate-500 mb-6">Aún no hay un PEI activo. Crea el plan para empezar a registrar objetivos y acciones estratégicas.</p>
      <button onClick={() => setOpen(true)}
        className="px-5 py-2.5 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: '#13602C' }}>
        Crear PEI
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo Plan Estratégico" pending={pending}
        onSubmit={() => run(async () => {
          await crearPlan({
            nombre: f.nombre, anioInicio: parseInt(f.anioInicio), anioFin: parseInt(f.anioFin),
            vision: f.vision || undefined, mision: f.mision || undefined,
          })
          setOpen(false)
        })}>
        <Txt label="Nombre" value={f.nombre} onChange={v => setF({ ...f, nombre: v })} placeholder="PEI 2026–2030" required />
        <div className="grid grid-cols-2 gap-3">
          <Txt label="Año inicio" value={f.anioInicio} onChange={v => setF({ ...f, anioInicio: v })} />
          <Txt label="Año fin" value={f.anioFin} onChange={v => setF({ ...f, anioFin: v })} />
        </div>
        <Area label="Visión" value={f.vision} onChange={v => setF({ ...f, vision: v })} />
        <Area label="Misión" value={f.mision} onChange={v => setF({ ...f, mision: v })} />
      </Modal>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
function PlanView({ plan, usuarios, pending, run }: {
  plan: Plan; usuarios: Usuario[]; pending: boolean; run: (fn: () => Promise<void>) => void
}) {
  const [editPlan, setEditPlan] = useState(false)
  const [oeiModal, setOeiModal] = useState<{ mode: 'new' | 'edit'; data?: Objetivo } | null>(null)
  const [aeiModal, setAeiModal] = useState<{ mode: 'new' | 'edit'; objetivoId: string; data?: Accion } | null>(null)

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-1">
            <Target className="w-4 h-4" /> Plan Estratégico Institucional
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{plan.nombre}</h1>
          <p className="text-sm text-slate-500">{plan.anioInicio} – {plan.anioFin}</p>
        </div>
        <button onClick={() => setEditPlan(true)}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1">
          <Pencil className="w-3.5 h-3.5" /> Editar plan
        </button>
      </div>

      {/* Visión / Misión */}
      {(plan.vision || plan.mision) && (
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {plan.vision && <VmCard icon={<Compass className="w-4 h-4" />} title="Visión" text={plan.vision} />}
          {plan.mision && <VmCard icon={<Target className="w-4 h-4" />} title="Misión" text={plan.mision} />}
        </div>
      )}

      {/* Objetivos */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Objetivos Estratégicos</h2>
        <button onClick={() => setOeiModal({ mode: 'new' })}
          className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
          <Plus className="w-4 h-4" /> Agregar OEI
        </button>
      </div>

      {plan.objetivos.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-400">
          Sin objetivos aún. Agrega el primer OEI.
        </div>
      ) : (
        <div className="space-y-3">
          {plan.objetivos.map(oei => (
            <ObjetivoCard key={oei.id} oei={oei} usuarios={usuarios}
              onEdit={() => setOeiModal({ mode: 'edit', data: oei })}
              onDelete={() => run(() => eliminarObjetivo(oei.id))}
              onAddAei={() => setAeiModal({ mode: 'new', objetivoId: oei.id })}
              onEditAei={a => setAeiModal({ mode: 'edit', objetivoId: oei.id, data: a })}
              onDeleteAei={a => run(() => eliminarAccion(a.id))}
            />
          ))}
        </div>
      )}

      {/* ── Modales ── */}
      {editPlan && (
        <PlanModal plan={plan} pending={pending} onClose={() => setEditPlan(false)}
          onSave={d => run(async () => { await actualizarPlan(plan.id, d); setEditPlan(false) })} />
      )}
      {oeiModal && (
        <OeiModal mode={oeiModal.mode} data={oeiModal.data} usuarios={usuarios} pending={pending}
          onClose={() => setOeiModal(null)}
          onSave={d => run(async () => {
            if (oeiModal.mode === 'new') await crearObjetivo({ planId: plan.id, orden: plan.objetivos.length, ...d })
            else await actualizarObjetivo(oeiModal.data!.id, d)
            setOeiModal(null)
          })} />
      )}
      {aeiModal && (
        <AeiModal mode={aeiModal.mode} data={aeiModal.data} usuarios={usuarios} pending={pending}
          onClose={() => setAeiModal(null)}
          onSave={d => run(async () => {
            if (aeiModal.mode === 'new') await crearAccion({ objetivoId: aeiModal.objetivoId, ...d })
            else await actualizarAccion(aeiModal.data!.id, d)
            setAeiModal(null)
          })} />
      )}
    </div>
  )
}

function VmCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1.5">
        {icon} {title}
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
    </div>
  )
}

// ── Objetivo card ──
function ObjetivoCard({ oei, usuarios, onEdit, onDelete, onAddAei, onEditAei, onDeleteAei }: {
  oei: Objetivo; usuarios: Usuario[]
  onEdit: () => void; onDelete: () => void; onAddAei: () => void
  onEditAei: (a: Accion) => void; onDeleteAei: (a: Accion) => void
}) {
  const [open, setOpen] = useState(true)
  const resp = nombreUsuario(usuarios, oei.responsableId)

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-3.5">
        <button onClick={() => setOpen(o => !o)} className="mt-0.5 text-slate-400 hover:text-slate-600">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <span className="mt-0.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold font-mono">
          {oei.codigo}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">{oei.nombre}</p>
          {oei.descripcion && <p className="text-xs text-slate-500 mt-0.5">{oei.descripcion}</p>}
          <div className="flex items-center gap-3 mt-1.5">
            {oei.departamento && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Building2 className="w-3 h-3" /> {DEPTO_LABEL[oei.departamento] ?? oei.departamento}
              </span>
            )}
            {!oei.departamento && <span className="text-[11px] text-slate-400">Institucional</span>}
            {resp && <span className="flex items-center gap-1 text-[11px] text-slate-400"><User className="w-3 h-3" /> {resp}</span>}
            <span className="text-[11px] text-slate-400">{oei.acciones.length} AEI</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <IconBtn onClick={onEdit}><Pencil className="w-3.5 h-3.5" /></IconBtn>
          <IconBtn onClick={onDelete} danger><Trash2 className="w-3.5 h-3.5" /></IconBtn>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3">
          <div className="space-y-1.5">
            {oei.acciones.map(a => (
              <div key={a.id} className="flex items-center gap-3 bg-white rounded-lg border border-slate-100 px-3 py-2">
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold font-mono">{a.codigo}</span>
                <span className="flex-1 text-xs text-slate-700">{a.nombre}</span>
                {a.departamento && <span className="text-[10px] text-slate-400">{DEPTO_LABEL[a.departamento] ?? a.departamento}</span>}
                <IconBtn onClick={() => onEditAei(a)}><Pencil className="w-3 h-3" /></IconBtn>
                <IconBtn onClick={() => onDeleteAei(a)} danger><Trash2 className="w-3 h-3" /></IconBtn>
              </div>
            ))}
          </div>
          <button onClick={onAddAei}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800">
            <Plus className="w-3.5 h-3.5" /> Agregar acción estratégica
          </button>
        </div>
      )}
    </div>
  )
}

function IconBtn({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className={`p-1.5 rounded-md ${danger ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}>
      {children}
    </button>
  )
}

// ── Modales de edición ──
function PlanModal({ plan, onClose, onSave, pending }: {
  plan: Plan; onClose: () => void; pending: boolean
  onSave: (d: { nombre: string; anioInicio: number; anioFin: number; vision?: string; mision?: string }) => void
}) {
  const [f, setF] = useState({
    nombre: plan.nombre, anioInicio: String(plan.anioInicio), anioFin: String(plan.anioFin),
    vision: plan.vision ?? '', mision: plan.mision ?? '',
  })
  return (
    <Modal open onClose={onClose} title="Editar plan" pending={pending}
      onSubmit={() => onSave({
        nombre: f.nombre, anioInicio: parseInt(f.anioInicio), anioFin: parseInt(f.anioFin),
        vision: f.vision || undefined, mision: f.mision || undefined,
      })}>
      <Txt label="Nombre" value={f.nombre} onChange={v => setF({ ...f, nombre: v })} required />
      <div className="grid grid-cols-2 gap-3">
        <Txt label="Año inicio" value={f.anioInicio} onChange={v => setF({ ...f, anioInicio: v })} />
        <Txt label="Año fin" value={f.anioFin} onChange={v => setF({ ...f, anioFin: v })} />
      </div>
      <Area label="Visión" value={f.vision} onChange={v => setF({ ...f, vision: v })} />
      <Area label="Misión" value={f.mision} onChange={v => setF({ ...f, mision: v })} />
    </Modal>
  )
}

function OeiModal({ mode, data, usuarios, onClose, onSave, pending }: {
  mode: 'new' | 'edit'; data?: Objetivo; usuarios: Usuario[]; onClose: () => void; pending: boolean
  onSave: (d: { codigo: string; nombre: string; descripcion?: string; departamento?: string; responsableId?: string }) => void
}) {
  const [f, setF] = useState({
    codigo: data?.codigo ?? '', nombre: data?.nombre ?? '', descripcion: data?.descripcion ?? '',
    departamento: data?.departamento ?? '', responsableId: data?.responsableId ?? '',
  })
  return (
    <Modal open onClose={onClose} title={mode === 'new' ? 'Nuevo objetivo estratégico' : 'Editar objetivo'} pending={pending}
      onSubmit={() => onSave({
        codigo: f.codigo, nombre: f.nombre, descripcion: f.descripcion || undefined,
        departamento: f.departamento || undefined, responsableId: f.responsableId || undefined,
      })}>
      <Txt label="Código" value={f.codigo} onChange={v => setF({ ...f, codigo: v })} placeholder="OEI.01" required />
      <Txt label="Nombre del objetivo" value={f.nombre} onChange={v => setF({ ...f, nombre: v })} required />
      <Area label="Descripción" value={f.descripcion} onChange={v => setF({ ...f, descripcion: v })} rows={2} />
      <Sel label="Departamento" value={f.departamento} onChange={v => setF({ ...f, departamento: v })}
        placeholder="Institucional" options={deptoOpts} />
      <UsuarioSel label="Responsable" value={f.responsableId} onChange={v => setF({ ...f, responsableId: v })} usuarios={usuarios} />
    </Modal>
  )
}

function AeiModal({ mode, data, usuarios, onClose, onSave, pending }: {
  mode: 'new' | 'edit'; data?: Accion; usuarios: Usuario[]; onClose: () => void; pending: boolean
  onSave: (d: { codigo: string; nombre: string; departamento?: string; responsableId?: string }) => void
}) {
  const [f, setF] = useState({
    codigo: data?.codigo ?? '', nombre: data?.nombre ?? '',
    departamento: data?.departamento ?? '', responsableId: data?.responsableId ?? '',
  })
  return (
    <Modal open onClose={onClose} title={mode === 'new' ? 'Nueva acción estratégica' : 'Editar acción'} pending={pending}
      onSubmit={() => onSave({
        codigo: f.codigo, nombre: f.nombre,
        departamento: f.departamento || undefined, responsableId: f.responsableId || undefined,
      })}>
      <Txt label="Código" value={f.codigo} onChange={v => setF({ ...f, codigo: v })} placeholder="AEI.01.01" required />
      <Txt label="Nombre de la acción" value={f.nombre} onChange={v => setF({ ...f, nombre: v })} required />
      <Sel label="Departamento" value={f.departamento} onChange={v => setF({ ...f, departamento: v })}
        placeholder="Institucional" options={deptoOpts} />
      <UsuarioSel label="Responsable" value={f.responsableId} onChange={v => setF({ ...f, responsableId: v })} usuarios={usuarios} />
    </Modal>
  )
}
