'use client'

import { useState } from 'react'
import { Building2, Plus, Pencil, Trash2, User } from 'lucide-react'
import { crearCentroCosto, actualizarCentroCosto, eliminarCentroCosto } from '@/app/actions/contabilidad'
import { soles, pctEjecucion, colorEjecucion } from '@/lib/contabilidad'
import { DEPARTAMENTOS, DEPTO_LABEL } from '@/lib/planeamiento'
import { Modal, Txt, Sel, UsuarioSel, useAction, nombreUsuario, type Usuario } from '@/components/planeamiento/kit'

interface Centro {
  id: string; codigo: string; nombre: string; departamento: string | null; responsableId: string | null
  activo: boolean; partidas: number; ingPlan: number; ingEjec: number; egrPlan: number; egrEjec: number
}

const deptoOpts = DEPARTAMENTOS.map(d => ({ value: d.key, label: d.label }))

export function CentrosCostoClient({ anio, centros, usuarios }: { anio: number; centros: Centro[]; usuarios: Usuario[] }) {
  const [pending, run] = useAction()
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; data?: Centro } | null>(null)

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-1">
            <Building2 className="w-4 h-4" /> Contabilidad y Finanzas
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Centros de costo</h1>
          <p className="text-sm text-slate-500">Presupuesto y ejecución {anio} por centro.</p>
        </div>
        <button onClick={() => setModal({ mode: 'new' })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: '#13602C' }}>
          <Plus className="w-4 h-4" /> Centro de costo
        </button>
      </div>

      {centros.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-400">
          Sin centros de costo. Crea el primero para asignarle partidas presupuestales.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {centros.map(c => {
            const pctEgr = pctEjecucion(c.egrPlan, c.egrEjec)
            const resp = nombreUsuario(usuarios, c.responsableId)
            return (
              <div key={c.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold font-mono">{c.codigo}</span>
                      <p className="text-sm font-semibold text-slate-800">{c.nombre}</p>
                      {!c.activo && <span className="text-[10px] text-slate-400">(inactivo)</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {c.departamento && <span className="text-[11px] text-slate-400">{DEPTO_LABEL[c.departamento] ?? c.departamento}</span>}
                      {resp && <span className="flex items-center gap-1 text-[11px] text-slate-400"><User className="w-3 h-3" />{resp}</span>}
                      <span className="text-[11px] text-slate-400">{c.partidas} partidas</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setModal({ mode: 'edit', data: c })} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => run(() => eliminarCentroCosto(c.id))} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <Barra label="Egresos" plan={c.egrPlan} ejec={c.egrEjec} color={colorEjecucion(pctEgr, 'EGRESO')} />
                  {c.ingPlan > 0 && <Barra label="Ingresos" plan={c.ingPlan} ejec={c.ingEjec} color="#10b981" />}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <CentroModal mode={modal.mode} data={modal.data} usuarios={usuarios} pending={pending}
          onClose={() => setModal(null)}
          onSave={d => run(async () => {
            if (modal.mode === 'new') await crearCentroCosto(d)
            else await actualizarCentroCosto(modal.data!.id, d)
            setModal(null)
          })} />
      )}
    </div>
  )
}

function Barra({ label, plan, ejec, color }: { label: string; plan: number; ejec: number; color: string }) {
  const pct = plan > 0 ? Math.min(100, (ejec / plan) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold text-slate-700">{soles(ejec)} <span className="text-slate-300 font-normal">/ {soles(plan)}</span></span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function CentroModal({ mode, data, usuarios, onClose, onSave, pending }: {
  mode: 'new' | 'edit'; data?: Centro; usuarios: Usuario[]; onClose: () => void; onSave: (d: any) => void; pending: boolean
}) {
  const [f, setF] = useState({
    codigo: data?.codigo ?? '', nombre: data?.nombre ?? '', departamento: data?.departamento ?? '',
    responsableId: data?.responsableId ?? '',
  })
  return (
    <Modal open onClose={onClose} title={mode === 'new' ? 'Nuevo centro de costo' : 'Editar centro de costo'} pending={pending}
      onSubmit={() => onSave({
        codigo: f.codigo, nombre: f.nombre, departamento: f.departamento || undefined, responsableId: f.responsableId || undefined,
      })}>
      <Txt label="Código" value={f.codigo} onChange={v => setF({ ...f, codigo: v })} placeholder="CC-QUIM" required />
      <Txt label="Nombre" value={f.nombre} onChange={v => setF({ ...f, nombre: v })} placeholder="Laboratorio de Química" required />
      <Sel label="Departamento" value={f.departamento} onChange={v => setF({ ...f, departamento: v })} placeholder="—" options={deptoOpts} />
      <UsuarioSel label="Responsable" value={f.responsableId} onChange={v => setF({ ...f, responsableId: v })} usuarios={usuarios} />
    </Modal>
  )
}
