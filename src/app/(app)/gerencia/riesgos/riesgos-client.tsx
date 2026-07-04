'use client'

import { useState } from 'react'
import { ShieldAlert, Plus, Pencil, Trash2, User } from 'lucide-react'
import { crearRiesgo, actualizarRiesgo, eliminarRiesgo } from '@/app/actions/planeamiento'
import {
  DEPARTAMENTOS, DEPTO_LABEL, nivelRiesgo, NIVEL_RIESGO_COLOR, NIVEL_RIESGO_LABEL, colorCeldaMatriz,
  ESTADO_RIESGO_LABEL, CATEGORIA_RIESGO_LABEL,
} from '@/lib/planeamiento'
import { Modal, Txt, Area, Sel, UsuarioSel, useAction, nombreUsuario, type Usuario } from '@/components/planeamiento/kit'

interface Riesgo {
  id: string; codigo: string | null; descripcion: string; causa: string | null; categoria: string | null
  probabilidad: number; impacto: number; departamento: string | null; responsableId: string | null
  planMitigacion: string | null; estado: string; objetivoId: string | null; fechaRevision: string | null
}
interface ObjetivoRef { id: string; codigo: string; nombre: string }

const deptoOpts = DEPARTAMENTOS.map(d => ({ value: d.key, label: d.label }))
const escalaOpts = [1, 2, 3, 4, 5].map(n => ({ value: String(n), label: String(n) }))
const estadoOpts = Object.entries(ESTADO_RIESGO_LABEL).map(([value, label]) => ({ value, label }))
const catOpts = Object.entries(CATEGORIA_RIESGO_LABEL).map(([value, label]) => ({ value, label }))

export function RiesgosClient({ riesgos, objetivos, usuarios }: {
  riesgos: Riesgo[]; objetivos: ObjetivoRef[]; usuarios: Usuario[]
}) {
  const [pending, run] = useAction()
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; data?: Riesgo } | null>(null)
  const [filtroCelda, setFiltroCelda] = useState<{ p: number; i: number } | null>(null)

  const activos = riesgos.filter(r => r.estado !== 'MITIGADO')
  const visibles = filtroCelda
    ? riesgos.filter(r => r.probabilidad === filtroCelda.p && r.impacto === filtroCelda.i)
    : riesgos

  const criticos = activos.filter(r => nivelRiesgo(r.probabilidad, r.impacto) === 'critico').length

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-1">
            <ShieldAlert className="w-4 h-4" /> Gestión de riesgos
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Riesgos</h1>
          <p className="text-sm text-slate-500">{activos.length} activos · {criticos} críticos</p>
        </div>
        <button onClick={() => setModal({ mode: 'new' })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: '#13602C' }}>
          <Plus className="w-4 h-4" /> Riesgo
        </button>
      </div>

      <div className="grid md:grid-cols-[auto_1fr] gap-6">
        {/* Matriz de calor */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm h-fit">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Matriz de calor</p>
          <Matriz riesgos={activos} filtro={filtroCelda} onCelda={(p, i) => setFiltroCelda(f => f?.p === p && f?.i === i ? null : { p, i })} />
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {(['bajo', 'medio', 'alto', 'critico'] as const).map(n => (
              <span key={n} className="flex items-center gap-1 text-[11px] text-slate-500">
                <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: NIVEL_RIESGO_COLOR[n] }} />{NIVEL_RIESGO_LABEL[n]}
              </span>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div>
          {filtroCelda && (
            <button onClick={() => setFiltroCelda(null)} className="text-xs text-emerald-700 mb-2 hover:underline">
              ← Quitar filtro (P{filtroCelda.p}·I{filtroCelda.i})
            </button>
          )}
          {visibles.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-400">
              Sin riesgos {filtroCelda ? 'en esta celda' : 'registrados'}.
            </div>
          ) : (
            <div className="space-y-2">
              {visibles.map(r => (
                <RiesgoCard key={r.id} r={r} usuarios={usuarios}
                  onEdit={() => setModal({ mode: 'edit', data: r })}
                  onDelete={() => run(() => eliminarRiesgo(r.id))} />
              ))}
            </div>
          )}
        </div>
      </div>

      {modal && (
        <RiesgoModal mode={modal.mode} data={modal.data} objetivos={objetivos} usuarios={usuarios} pending={pending}
          onClose={() => setModal(null)}
          onSave={d => run(async () => {
            if (modal.mode === 'new') await crearRiesgo(d)
            else await actualizarRiesgo(modal.data!.id, d)
            setModal(null)
          })} />
      )}
    </div>
  )
}

function Matriz({ riesgos, filtro, onCelda }: {
  riesgos: Riesgo[]; filtro: { p: number; i: number } | null; onCelda: (p: number, i: number) => void
}) {
  // filas = probabilidad 5→1 (arriba mayor), columnas = impacto 1→5
  const count = (p: number, i: number) => riesgos.filter(r => r.probabilidad === p && r.impacto === i).length
  return (
    <div className="inline-block">
      <div className="flex">
        <div className="flex flex-col justify-center pr-1">
          <span className="text-[9px] text-slate-400 -rotate-90 whitespace-nowrap w-4 text-center">Probabilidad →</span>
        </div>
        <div>
          {[5, 4, 3, 2, 1].map(p => (
            <div key={p} className="flex">
              <span className="w-4 text-[10px] text-slate-400 flex items-center justify-center">{p}</span>
              {[1, 2, 3, 4, 5].map(i => {
                const c = count(p, i)
                const sel = filtro?.p === p && filtro?.i === i
                return (
                  <button key={i} onClick={() => onCelda(p, i)}
                    className={`w-9 h-9 m-0.5 rounded flex items-center justify-center text-xs font-bold text-white transition-all ${sel ? 'ring-2 ring-slate-800 ring-offset-1' : ''}`}
                    style={{ backgroundColor: colorCeldaMatriz(p, i), opacity: c === 0 ? 0.28 : 1 }}>
                    {c > 0 ? c : ''}
                  </button>
                )
              })}
            </div>
          ))}
          <div className="flex pl-4">
            {[1, 2, 3, 4, 5].map(i => <span key={i} className="w-9 m-0.5 text-[10px] text-slate-400 text-center">{i}</span>)}
          </div>
          <p className="text-[9px] text-slate-400 text-center pl-4 mt-0.5">Impacto →</p>
        </div>
      </div>
    </div>
  )
}

function RiesgoCard({ r, usuarios, onEdit, onDelete }: {
  r: Riesgo; usuarios: Usuario[]; onEdit: () => void; onDelete: () => void
}) {
  const nivel = nivelRiesgo(r.probabilidad, r.impacto)
  const resp = nombreUsuario(usuarios, r.responsableId)
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 px-2 py-1 rounded-lg text-[10px] font-bold text-white flex-shrink-0"
          style={{ backgroundColor: NIVEL_RIESGO_COLOR[nivel] }}>
          {NIVEL_RIESGO_LABEL[nivel]}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            {r.codigo && <span className="font-mono text-xs text-slate-400 mr-1.5">{r.codigo}</span>}
            {r.descripcion}
          </p>
          {r.planMitigacion && <p className="text-xs text-slate-500 mt-0.5"><span className="font-medium">Mitigación:</span> {r.planMitigacion}</p>}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400">P{r.probabilidad} · I{r.impacto}</span>
            {r.categoria && <span className="text-[11px] text-slate-400">{CATEGORIA_RIESGO_LABEL[r.categoria] ?? r.categoria}</span>}
            {r.departamento && <span className="text-[11px] text-slate-400">{DEPTO_LABEL[r.departamento] ?? r.departamento}</span>}
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium">{ESTADO_RIESGO_LABEL[r.estado] ?? r.estado}</span>
            {resp && <span className="flex items-center gap-1 text-[11px] text-slate-400"><User className="w-3 h-3" />{resp}</span>}
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

function RiesgoModal({ mode, data, objetivos, usuarios, onClose, onSave, pending }: {
  mode: 'new' | 'edit'; data?: Riesgo; objetivos: ObjetivoRef[]; usuarios: Usuario[]; onClose: () => void
  onSave: (d: any) => void; pending: boolean
}) {
  const [f, setF] = useState({
    codigo: data?.codigo ?? '', descripcion: data?.descripcion ?? '', causa: data?.causa ?? '',
    categoria: data?.categoria ?? '', probabilidad: String(data?.probabilidad ?? 3), impacto: String(data?.impacto ?? 3),
    departamento: data?.departamento ?? '', responsableId: data?.responsableId ?? '',
    planMitigacion: data?.planMitigacion ?? '', estado: data?.estado ?? 'IDENTIFICADO',
  })
  const nivel = nivelRiesgo(parseInt(f.probabilidad), parseInt(f.impacto))
  return (
    <Modal open onClose={onClose} title={mode === 'new' ? 'Nuevo riesgo' : 'Editar riesgo'} pending={pending} wide
      onSubmit={() => onSave({
        codigo: f.codigo || undefined, descripcion: f.descripcion, causa: f.causa || undefined,
        categoria: f.categoria || undefined, probabilidad: parseInt(f.probabilidad), impacto: parseInt(f.impacto),
        departamento: f.departamento || undefined, responsableId: f.responsableId || undefined,
        planMitigacion: f.planMitigacion || undefined, estado: f.estado,
      })}>
      <div className="grid grid-cols-[1fr_2fr] gap-3">
        <Txt label="Código" value={f.codigo} onChange={v => setF({ ...f, codigo: v })} placeholder="R-01" />
        <Txt label="Descripción del riesgo" value={f.descripcion} onChange={v => setF({ ...f, descripcion: v })} required />
      </div>
      <Area label="Causa" value={f.causa} onChange={v => setF({ ...f, causa: v })} rows={2} />
      <div className="grid grid-cols-2 gap-3">
        <Sel label="Categoría" value={f.categoria} onChange={v => setF({ ...f, categoria: v })} placeholder="—" options={catOpts} />
        <Sel label="Departamento" value={f.departamento} onChange={v => setF({ ...f, departamento: v })} placeholder="Institucional" options={deptoOpts} />
      </div>
      <div className="grid grid-cols-3 gap-3 items-end">
        <Sel label="Probabilidad (1-5)" value={f.probabilidad} onChange={v => setF({ ...f, probabilidad: v })} options={escalaOpts} />
        <Sel label="Impacto (1-5)" value={f.impacto} onChange={v => setF({ ...f, impacto: v })} options={escalaOpts} />
        <div className="pb-2">
          <span className="px-3 py-2 rounded-lg text-xs font-bold text-white inline-block" style={{ backgroundColor: NIVEL_RIESGO_COLOR[nivel] }}>
            {NIVEL_RIESGO_LABEL[nivel]}
          </span>
        </div>
      </div>
      <Area label="Plan de mitigación" value={f.planMitigacion} onChange={v => setF({ ...f, planMitigacion: v })} rows={2} />
      <div className="grid grid-cols-2 gap-3">
        <Sel label="Estado" value={f.estado} onChange={v => setF({ ...f, estado: v })} options={estadoOpts} />
        <UsuarioSel label="Responsable" value={f.responsableId} onChange={v => setF({ ...f, responsableId: v })} usuarios={usuarios} />
      </div>
    </Modal>
  )
}
