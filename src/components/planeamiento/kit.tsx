'use client'

import { ReactNode, useState, useTransition } from 'react'
import { X, Loader2 } from 'lucide-react'

export interface Usuario { id: string; nombre: string; rol?: string }

// ── Modal ──────────────────────────────────────────────────────────────────────
export function Modal({
  open, onClose, title, children, onSubmit, submitLabel = 'Guardar', pending, wide,
}: {
  open: boolean; onClose: () => void; title: string; children: ReactNode
  onSubmit: () => void; submitLabel?: string; pending?: boolean; wide?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 py-10 px-4">
      <div className={`bg-white rounded-2xl shadow-xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} my-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <form
          onSubmit={e => { e.preventDefault(); onSubmit() }}
          className="px-6 py-5 space-y-4"
        >
          {children}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
              Cancelar
            </button>
            <button type="submit" disabled={pending}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: '#13602C' }}>
              {pending && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Campos ───────────────────────────────────────────────────────────────────
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1'
const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><label className={labelCls}>{label}</label>{children}</div>
}

export function Txt({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean
}) {
  return (
    <Field label={label}>
      <input className={inputCls} value={value} placeholder={placeholder} required={required}
        onChange={e => onChange(e.target.value)} />
    </Field>
  )
}

export function Area({ label, value, onChange, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number
}) {
  return (
    <Field label={label}>
      <textarea className={`${inputCls} resize-none`} rows={rows} value={value}
        onChange={e => onChange(e.target.value)} />
    </Field>
  )
}

export function Num({ label, value, onChange, step, min }: {
  label: string; value: number | string; onChange: (v: number) => void; step?: string; min?: number
}) {
  return (
    <Field label={label}>
      <input type="number" className={inputCls} value={value} step={step} min={min}
        onChange={e => onChange(parseFloat(e.target.value) || 0)} />
    </Field>
  )
}

export function Sel({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; placeholder?: string
}) {
  return (
    <Field label={label}>
      <select className={inputCls} value={value} onChange={e => onChange(e.target.value)}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  )
}

export function UsuarioSel({ label, value, onChange, usuarios }: {
  label: string; value: string; onChange: (v: string) => void; usuarios: Usuario[]
}) {
  return (
    <Sel label={label} value={value} onChange={onChange} placeholder="— Sin asignar —"
      options={usuarios.map(u => ({ value: u.id, label: u.nombre }))} />
  )
}

export function nombreUsuario(usuarios: Usuario[], id?: string | null): string | null {
  if (!id) return null
  return usuarios.find(u => u.id === id)?.nombre ?? null
}

// Hook simple para envolver server actions con estado pending
export function useAction(): [boolean, (fn: () => Promise<void>) => void] {
  const [pending, start] = useTransition()
  return [pending, (fn) => start(async () => { await fn() })]
}

// ── Confirmación de borrado ──────────────────────────────────────────────────
export function useConfirmDelete() {
  const [id, setId] = useState<string | null>(null)
  return {
    target: id,
    ask: (v: string) => setId(v),
    clear: () => setId(null),
  }
}
