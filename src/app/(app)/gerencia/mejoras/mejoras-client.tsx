'use client'

import { useState } from 'react'
import { Wrench, Plus, Pencil, Trash2, User, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { crearMejora, actualizarMejora, eliminarMejora } from '@/app/actions/planeamiento'
import {
  DEPARTAMENTOS, DEPTO_LABEL, ESTADO_MEJORA_LABEL, ESTADO_MEJORA_COLOR, ORIGEN_MEJORA_LABEL, estaVencida,
} from '@/lib/planeamiento'
import { Modal, Txt, Area, Sel, Field, UsuarioSel, useAction, nombreUsuario, type Usuario } from '@/components/planeamiento/kit'

interface Mejora {
  id: string; codigo: string | null; origen: string; auditoriaId: string | null; descripcion: string
  causaRaiz: string | null; accion: string | null; departamento: string | null; responsableId: string | null
  fechaCompromiso: string | null; fechaCierre: string | null; estado: string; eficaciaVerificada: boolean
}
interface AuditoriaRef { id: string; codigo: string }

const deptoOpts = DEPARTAMENTOS.map(d => ({ value: d.key, label: d.label }))
const origenOpts = Object.entries(ORIGEN_MEJORA_LABEL).map(([value, label]) => ({ value, label }))
const estadoOpts = Object.entries(ESTADO_MEJORA_LABEL).map(([value, label]) => ({ value, label }))
const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export function MejorasClient({ mejoras, auditorias, usuarios }: {
  mejoras: Mejora[]; auditorias: AuditoriaRef[]; usuarios: Usuario[]
}) {
  const [pending, run] = useAction()
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; data?: Mejora } | null>(null)
  const [filtro, setFiltro] = useState<string>('TODAS')

  const abiertas = mejoras.filter(m => m.estado !== 'CERRADA').length
  const vencidas = mejoras.filter(m => estaVencida(m.fechaCompromiso, m.estado === 'CERRADA')).length
  const visibles = filtro === 'TODAS' ? mejoras : mejoras.filter(m => m.estado === filtro)

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-1">
            <Wrench className="w-4 h-4" /> Acciones de mejora (CAPA)
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Acciones de mejora</h1>
          <p className="text-sm text-slate-500">{abiertas} abiertas · {vencidas} vencidas</p>
        </div>
        <button onClick={() => setModal({ mode: 'new' })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: '#13602C' }}>
          <Plus className="w-4 h-4" /> Acción
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {['TODAS', 'ABIERTA', 'EN_PROCESO', 'CERRADA'].map(k => (
          <button key={k} onClick={() => setFiltro(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${filtro === k ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            {k === 'TODAS' ? 'Todas' : ESTADO_MEJORA_LABEL[k]}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-400">
          Sin acciones de mejora.
        </div>
      ) : (
        <div className="space-y-2">
          {visibles.map(m => (
            <MejoraCard key={m.id} m={m} usuarios={usuarios}
              onEdit={() => setModal({ mode: 'edit', data: m })}
              onDelete={() => run(() => eliminarMejora(m.id))} />
          ))}
        </div>
      )}

      {modal && (
        <MejoraModal mode={modal.mode} data={modal.data} auditorias={auditorias} usuarios={usuarios} pending={pending}
          onClose={() => setModal(null)}
          onSave={d => run(async () => {
            if (modal.mode === 'new') await crearMejora(d)
            else await actualizarMejora(modal.data!.id, d)
            setModal(null)
          })} />
      )}
    </div>
  )
}

function MejoraCard({ m, usuarios, onEdit, onDelete }: {
  m: Mejora; usuarios: Usuario[]; onEdit: () => void; onDelete: () => void
}) {
  const resp = nombreUsuario(usuarios, m.responsableId)
  const vencida = estaVencida(m.fechaCompromiso, m.estado === 'CERRADA')
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white flex-shrink-0" style={{ backgroundColor: ESTADO_MEJORA_COLOR[m.estado] }}>
          {ESTADO_MEJORA_LABEL[m.estado] ?? m.estado}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            {m.codigo && <span className="font-mono text-xs text-slate-400 mr-1.5">{m.codigo}</span>}
            {m.descripcion}
          </p>
          {m.causaRaiz && <p className="text-xs text-slate-500 mt-0.5"><span className="font-medium">Causa raíz:</span> {m.causaRaiz}</p>}
          {m.accion && <p className="text-xs text-slate-500 mt-0.5"><span className="font-medium">Acción:</span> {m.accion}</p>}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium">{ORIGEN_MEJORA_LABEL[m.origen] ?? m.origen}</span>
            {m.departamento && <span className="text-[11px] text-slate-400">{DEPTO_LABEL[m.departamento] ?? m.departamento}</span>}
            {resp && <span className="flex items-center gap-1 text-[11px] text-slate-400"><User className="w-3 h-3" />{resp}</span>}
            <span className={`flex items-center gap-1 text-[11px] ${vencida ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
              {vencida && <AlertTriangle className="w-3 h-3" />}
              Compromiso: {fmt(m.fechaCompromiso)}
            </span>
            {m.eficaciaVerificada && <span className="flex items-center gap-1 text-[11px] text-emerald-600"><CheckCircle2 className="w-3 h-3" />Eficacia verificada</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </div>
  )
}

function MejoraModal({ mode, data, auditorias, usuarios, onClose, onSave, pending }: {
  mode: 'new' | 'edit'; data?: Mejora; auditorias: AuditoriaRef[]; usuarios: Usuario[]; onClose: () => void
  onSave: (d: any) => void; pending: boolean
}) {
  const [f, setF] = useState({
    codigo: data?.codigo ?? '', origen: data?.origen ?? 'AUDITORIA', auditoriaId: data?.auditoriaId ?? '',
    descripcion: data?.descripcion ?? '', causaRaiz: data?.causaRaiz ?? '', accion: data?.accion ?? '',
    departamento: data?.departamento ?? '', responsableId: data?.responsableId ?? '',
    fechaCompromiso: data?.fechaCompromiso?.slice(0, 10) ?? '', fechaCierre: data?.fechaCierre?.slice(0, 10) ?? '',
    estado: data?.estado ?? 'ABIERTA', eficaciaVerificada: data?.eficaciaVerificada ?? false,
  })
  const dateCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30'
  return (
    <Modal open onClose={onClose} title={mode === 'new' ? 'Nueva acción de mejora' : 'Editar acción'} pending={pending} wide
      onSubmit={() => onSave({
        codigo: f.codigo || undefined, origen: f.origen, auditoriaId: f.auditoriaId || undefined,
        descripcion: f.descripcion, causaRaiz: f.causaRaiz || undefined, accion: f.accion || undefined,
        departamento: f.departamento || undefined, responsableId: f.responsableId || undefined,
        fechaCompromiso: f.fechaCompromiso || undefined,
        ...(mode === 'edit' ? { fechaCierre: f.fechaCierre || null, estado: f.estado, eficaciaVerificada: f.eficaciaVerificada } : {}),
      })}>
      <div className="grid grid-cols-2 gap-3">
        <Txt label="Código" value={f.codigo} onChange={v => setF({ ...f, codigo: v })} placeholder="AM-01" />
        <Sel label="Origen" value={f.origen} onChange={v => setF({ ...f, origen: v })} options={origenOpts} />
      </div>
      {f.origen === 'AUDITORIA' && (
        <Sel label="Auditoría asociada" value={f.auditoriaId} onChange={v => setF({ ...f, auditoriaId: v })}
          placeholder="— Ninguna —" options={auditorias.map(a => ({ value: a.id, label: a.codigo }))} />
      )}
      <Txt label="Descripción del hallazgo / oportunidad" value={f.descripcion} onChange={v => setF({ ...f, descripcion: v })} required />
      <Area label="Análisis de causa raíz" value={f.causaRaiz} onChange={v => setF({ ...f, causaRaiz: v })} rows={2} />
      <Area label="Acción correctiva / preventiva" value={f.accion} onChange={v => setF({ ...f, accion: v })} rows={2} />
      <div className="grid grid-cols-2 gap-3">
        <Sel label="Departamento" value={f.departamento} onChange={v => setF({ ...f, departamento: v })} placeholder="—" options={deptoOpts} />
        <UsuarioSel label="Responsable" value={f.responsableId} onChange={v => setF({ ...f, responsableId: v })} usuarios={usuarios} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha compromiso"><input type="date" className={dateCls} value={f.fechaCompromiso} onChange={e => setF({ ...f, fechaCompromiso: e.target.value })} /></Field>
        {mode === 'edit' && <Field label="Fecha cierre"><input type="date" className={dateCls} value={f.fechaCierre} onChange={e => setF({ ...f, fechaCierre: e.target.value })} /></Field>}
      </div>
      {mode === 'edit' && (
        <div className="grid grid-cols-2 gap-3 items-center">
          <Sel label="Estado" value={f.estado} onChange={v => setF({ ...f, estado: v })} options={estadoOpts} />
          <label className="flex items-center gap-2 text-sm text-slate-600 mt-5">
            <input type="checkbox" checked={f.eficaciaVerificada} onChange={e => setF({ ...f, eficaciaVerificada: e.target.checked })}
              className="w-4 h-4 accent-emerald-600" />
            Eficacia verificada
          </label>
        </div>
      )}
    </Modal>
  )
}
