'use client'

import { useState } from 'react'
import { FlaskConical, Plus, Pencil, Trash2, Check } from 'lucide-react'
import {
  crearControlBio, actualizarControlBio, toggleEntregadoBio, eliminarControlBio,
} from '@/app/actions/control-biologia'
import { Modal, Txt, Area, Sel, Field, useAction } from '@/components/planeamiento/kit'

interface Fila {
  id: string; formulacion: string | null; setNumero: string | null; odaNumero: string | null
  prueba: string | null; entregado: boolean; fechaEntrega: string | null; observacion: string | null
  formato: string | null; fechaRecepcion: string | null; createdAt: string
}

const FORMATOS = [
  { value: 'FN', label: 'FN · Formato nacional' },
  { value: 'FE', label: 'FE · Formato extranjero' },
  { value: 'FEE', label: 'FEE' },
]

const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
const num = (s: string | null) => { const n = parseInt(s ?? ''); return Number.isNaN(n) ? Number.MAX_SAFE_INTEGER : n }

export function ControlBiologiaClient({ filas, puedeEditar }: { filas: Fila[]; puedeEditar: boolean }) {
  const [pending, run] = useAction()
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; data?: Fila } | null>(null)

  const ordenadas = [...filas].sort((a, b) =>
    num(a.setNumero) - num(b.setNumero) || num(a.odaNumero) - num(b.odaNumero) || a.createdAt.localeCompare(b.createdAt),
  )

  return (
    <div className="max-w-[1400px]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-1">
            <FlaskConical className="w-4 h-4" /> Biología
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Control de ODAs — Biología</h1>
          <p className="text-sm text-slate-500">Seguimiento de muestras: entrega, formato y recepción por ODA.</p>
        </div>
        {puedeEditar && (
          <button onClick={() => setModal({ mode: 'new' })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: '#13602C' }}>
            <Plus className="w-4 h-4" /> Fila
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600">
              <Th>Formulación</Th>
              <Th className="text-center">SET</Th>
              <Th className="text-center">ODA</Th>
              <Th className="text-center">Prueb</Th>
              <Th className="text-center w-8"></Th>
              <Th className="text-center">Fecha entrega</Th>
              <Th>Observación</Th>
              <Th className="text-center">A</Th>
              <Th className="text-center">Fecha recepción</Th>
              {puedeEditar && <Th className="w-16"></Th>}
            </tr>
          </thead>
          <tbody>
            {ordenadas.length === 0 ? (
              <tr><td colSpan={puedeEditar ? 10 : 9} className="px-4 py-10 text-center text-slate-400">Sin filas. {puedeEditar && 'Agrega la primera con el botón “Fila”.'}</td></tr>
            ) : ordenadas.map((f, i) => {
              const grupoInicio = i === 0 || ordenadas[i - 1].setNumero !== f.setNumero
              return (
                <tr key={f.id} className={`hover:bg-slate-50/60 ${grupoInicio ? 'border-t-2 border-slate-300' : 'border-t border-slate-100'}`}>
                  <td className="px-3 py-2 font-medium text-slate-700">{grupoInicio ? f.formulacion : ''}</td>
                  <td className="px-3 py-2 text-center text-slate-600">{f.setNumero}</td>
                  <td className="px-3 py-2 text-center font-mono text-slate-700">{f.odaNumero}</td>
                  <td className="px-3 py-2 text-center font-semibold text-slate-700">{f.prueba}</td>
                  {/* entregado "e" */}
                  <td className="text-center p-0">
                    <button
                      disabled={!puedeEditar || pending}
                      onClick={() => puedeEditar && run(() => toggleEntregadoBio(f.id))}
                      title={f.entregado ? 'Entregado' : 'No entregado'}
                      className={`w-full h-full min-h-[28px] flex items-center justify-center text-[11px] font-bold ${f.entregado ? 'text-white' : 'text-slate-300'} ${puedeEditar ? 'cursor-pointer' : 'cursor-default'}`}
                      style={{ backgroundColor: f.entregado ? '#22c55e' : undefined }}>
                      {f.entregado ? 'e' : '·'}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center text-slate-600" style={{ backgroundColor: '#eef2ff' }}>{fmt(f.fechaEntrega)}</td>
                  <td className="px-3 py-2 text-slate-600">{f.observacion}</td>
                  {/* formato "A" */}
                  <td className="text-center p-0" style={{ backgroundColor: f.formato ? '#22c55e' : '#dcfce7' }}>
                    {puedeEditar ? (
                      <select value={f.formato ?? ''} disabled={pending}
                        onChange={(e) => run(() => actualizarControlBio(f.id, { formato: e.target.value || null }))}
                        className="w-full h-full min-h-[28px] bg-transparent text-center text-[11px] font-bold text-white cursor-pointer focus:outline-none"
                        style={{ color: f.formato ? 'white' : '#16a34a' }}>
                        <option value="" className="text-slate-700">—</option>
                        {FORMATOS.map(o => <option key={o.value} value={o.value} className="text-slate-700">{o.value}</option>)}
                      </select>
                    ) : (
                      <span className="text-[11px] font-bold text-white">{f.formato}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center text-slate-600" style={{ backgroundColor: '#eef2ff' }}>{grupoInicio ? fmt(f.fechaRecepcion) : ''}</td>
                  {puedeEditar && (
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setModal({ mode: 'edit', data: f })} className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => run(() => eliminarControlBio(f.id))} className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-400 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#22c55e' }} /> <b className="text-slate-500">e</b> = entregado</span>
        <span><b className="text-slate-500">A</b>: FN = formato nacional · FE = formato extranjero · FEE</span>
        {puedeEditar && <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Clic en la celda verde para marcar entrega o cambiar formato</span>}
      </div>

      {modal && (
        <FilaModal mode={modal.mode} data={modal.data} pending={pending}
          onClose={() => setModal(null)}
          onSave={d => run(async () => {
            if (modal.mode === 'new') await crearControlBio(d)
            else await actualizarControlBio(modal.data!.id, d)
            setModal(null)
          })} />
      )}
    </div>
  )
}

function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-left font-semibold border-b border-slate-200 ${className}`}>{children}</th>
}

function FilaModal({ mode, data, onClose, onSave, pending }: {
  mode: 'new' | 'edit'; data?: Fila; onClose: () => void; onSave: (d: any) => void; pending: boolean
}) {
  const [f, setF] = useState({
    formulacion: data?.formulacion ?? '', setNumero: data?.setNumero ?? '', odaNumero: data?.odaNumero ?? '',
    prueba: data?.prueba ?? '', entregado: data?.entregado ?? false,
    fechaEntrega: data?.fechaEntrega?.slice(0, 10) ?? '', observacion: data?.observacion ?? '',
    formato: data?.formato ?? '', fechaRecepcion: data?.fechaRecepcion?.slice(0, 10) ?? '',
  })
  const dateCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30'
  return (
    <Modal open onClose={onClose} title={mode === 'new' ? 'Nueva fila de control' : 'Editar fila'} pending={pending} wide
      onSubmit={() => onSave({
        formulacion: f.formulacion || (mode === 'edit' ? null : undefined),
        setNumero: f.setNumero || undefined, odaNumero: f.odaNumero || undefined,
        prueba: f.prueba || undefined, entregado: f.entregado,
        fechaEntrega: f.fechaEntrega || (mode === 'edit' ? null : undefined),
        observacion: f.observacion || (mode === 'edit' ? null : undefined),
        formato: f.formato || (mode === 'edit' ? null : undefined),
        fechaRecepcion: f.fechaRecepcion || (mode === 'edit' ? null : undefined),
      })}>
      <Txt label="Formulación" value={f.formulacion} onChange={v => setF({ ...f, formulacion: v })} placeholder="polvo, cebo granulado, …" />
      <div className="grid grid-cols-3 gap-3">
        <Txt label="SET" value={f.setNumero} onChange={v => setF({ ...f, setNumero: v })} placeholder="20224" />
        <Txt label="ODA" value={f.odaNumero} onChange={v => setF({ ...f, odaNumero: v })} placeholder="51395" />
        <Txt label="Prueba (Prueb)" value={f.prueba} onChange={v => setF({ ...f, prueba: v })} placeholder="OCT" />
      </div>
      <Area label="Observación" value={f.observacion} onChange={v => setF({ ...f, observacion: v })} rows={2} />
      <div className="grid grid-cols-2 gap-3">
        <Sel label="Formato (A)" value={f.formato} onChange={v => setF({ ...f, formato: v })} placeholder="— Sin formato —" options={FORMATOS} />
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={f.entregado} onChange={e => setF({ ...f, entregado: e.target.checked })} className="w-4 h-4 accent-green-600" />
            Entregado (e)
          </label>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha de entrega"><input type="date" className={dateCls} value={f.fechaEntrega} onChange={e => setF({ ...f, fechaEntrega: e.target.value })} /></Field>
        <Field label="Fecha de recepción de la ODA"><input type="date" className={dateCls} value={f.fechaRecepcion} onChange={e => setF({ ...f, fechaRecepcion: e.target.value })} /></Field>
      </div>
    </Modal>
  )
}
