'use client'

import { useState, useMemo, useTransition } from 'react'
import { Plus, X, Check, Trash2, ChevronDown, Search } from 'lucide-react'
import {
  crearAseguramientoItem,
  toggleAseguramientoItem,
  eliminarAseguramientoItem,
} from '@/app/actions/aseguramiento'

const DEPARTAMENTOS = [
  { key: 'QUIMICA',       label: 'Química' },
  { key: 'BIOLOGIA',      label: 'Biología' },
  { key: 'MICROBIOLOGIA', label: 'Microbiología' },
]

const DEPT_COLORS: Record<string, { bg: string; text: string }> = {
  QUIMICA:       { bg: '#dbeafe', text: '#1d4ed8' },
  BIOLOGIA:      { bg: '#dcfce7', text: '#15803d' },
  MICROBIOLOGIA: { bg: '#f3e8ff', text: '#7e22ce' },
}

function formatFecha(d: Date | string) {
  return new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function addDays(dateStr: string, days: number): string {
  if (!dateStr || !days) return ''
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

interface Ensayo { id: string; nombre: string; codigo: string; area: string }
interface Item {
  id: string
  departamento: string
  muestra: string
  ensayo: { id: string; nombre: string; codigo: string }
  fechaInicio: Date | string
  dias: number
  fechaEntrega: Date | string
  completado: boolean
}

interface Props { items: Item[]; ensayos: Ensayo[] }

const EMPTY_FORM = { departamento: '', muestra: '', ensayoId: '', fechaInicio: '', dias: '' }

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#13602C]/25 focus:border-[#13602C] transition-all placeholder:text-slate-400'

export function AseguramientoClient({ items, ensayos }: Props) {
  const [showForm, setShowForm]           = useState(false)
  const [form, setForm]                   = useState(EMPTY_FORM)
  const [ensayoSearch, setEnsayoSearch]   = useState('')
  const [showEnsayoList, setShowEnsayoList] = useState(false)
  const [isPending, startTransition]      = useTransition()
  const [error, setError]                 = useState('')

  const fechaEntregaCalc = useMemo(
    () => addDays(form.fechaInicio, Number(form.dias)),
    [form.fechaInicio, form.dias]
  )

  const ensayosFiltrados = useMemo(() => {
    const q = ensayoSearch.toLowerCase()
    return ensayos
      .filter(e => !q || e.nombre.toLowerCase().includes(q) || e.codigo.toLowerCase().includes(q))
      .slice(0, 60)
  }, [ensayos, ensayoSearch])

  const ensayoSel = ensayos.find(e => e.id === form.ensayoId)

  function resetForm() {
    setForm(EMPTY_FORM); setEnsayoSearch(''); setShowEnsayoList(false); setError(''); setShowForm(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.departamento || !form.muestra.trim() || !form.ensayoId || !form.fechaInicio || !form.dias) {
      setError('Completa todos los campos obligatorios.'); return
    }
    setError('')
    startTransition(async () => {
      await crearAseguramientoItem({
        departamento: form.departamento,
        muestra:      form.muestra.trim(),
        ensayoId:     form.ensayoId,
        fechaInicio:  form.fechaInicio,
        dias:         Number(form.dias),
      })
      resetForm()
    })
  }

  return (
    <div className="max-w-5xl">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Aseguramiento</h1>
          <p className="text-sm text-slate-500 mt-0.5">Seguimiento de análisis por departamento</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#13602C' }}
        >
          <Plus className="w-4 h-4" />
          Nuevo análisis
        </button>
      </div>

      {/* ── Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: '90vh' }}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="font-bold text-slate-900 text-base">Registrar análisis</h2>
                <p className="text-xs text-slate-400 mt-0.5">Los campos marcados con * son obligatorios</p>
              </div>
              <button onClick={resetForm} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
              {/* Departamento */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Departamento *
                </label>
                <div className="relative">
                  <select
                    value={form.departamento}
                    onChange={e => setForm(f => ({ ...f, departamento: e.target.value }))}
                    className={inputCls + ' appearance-none pr-9 cursor-pointer'}
                  >
                    <option value="">Seleccionar…</option>
                    {DEPARTAMENTOS.map(d => (
                      <option key={d.key} value={d.key}>{d.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Muestra */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Muestra *
                </label>
                <input
                  type="text"
                  value={form.muestra}
                  onChange={e => setForm(f => ({ ...f, muestra: e.target.value }))}
                  placeholder="Descripción de la muestra…"
                  className={inputCls}
                />
              </div>

              {/* Análisis */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Análisis *
                </label>
                {ensayoSel ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-[#13602C]/5 border border-[#13602C]/20 rounded-lg">
                    <span className="text-xs font-mono text-[#13602C] font-semibold shrink-0">{ensayoSel.codigo}</span>
                    <span className="text-sm text-slate-700 flex-1 truncate">{ensayoSel.nombre}</span>
                    <button type="button" onClick={() => { setForm(f => ({ ...f, ensayoId: '' })); setEnsayoSearch('') }}
                      className="text-slate-400 hover:text-red-500 shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre o código…"
                        value={ensayoSearch}
                        onChange={e => { setEnsayoSearch(e.target.value); setShowEnsayoList(true) }}
                        onFocus={() => setShowEnsayoList(true)}
                        className={inputCls + ' pl-9'}
                      />
                    </div>
                    {showEnsayoList && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-auto">
                        {ensayosFiltrados.length === 0
                          ? <div className="px-4 py-3 text-sm text-slate-400 text-center">Sin resultados</div>
                          : ensayosFiltrados.map(e => (
                            <button key={e.id} type="button"
                              onMouseDown={() => { setForm(f => ({ ...f, ensayoId: e.id })); setShowEnsayoList(false); setEnsayoSearch('') }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50 last:border-0"
                            >
                              <span className="text-xs font-mono font-bold text-[#13602C] shrink-0 w-20 truncate">{e.codigo}</span>
                              <span className="text-slate-600 truncate">{e.nombre}</span>
                            </button>
                          ))
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Fecha + Días */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Fecha inicio *
                  </label>
                  <input
                    type="date"
                    value={form.fechaInicio}
                    onChange={e => setForm(f => ({ ...f, fechaInicio: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Días *
                  </label>
                  <input
                    type="number" min={1}
                    value={form.dias}
                    onChange={e => setForm(f => ({ ...f, dias: e.target.value }))}
                    placeholder="Ej. 5"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Fecha entrega calculada */}
              {fechaEntregaCalc && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl border-2 border-dashed border-[#13602C]/30 bg-[#13602C]/5">
                  <span className="text-xs font-semibold text-[#13602C]/70 uppercase tracking-wide">Fecha de entrega</span>
                  <span className="text-sm font-bold text-[#13602C]">{formatFecha(fechaEntregaCalc)}</span>
                </div>
              )}

              {error && (
                <div className="px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}
            </form>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
              <button type="button" onClick={resetForm}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors">
                Cancelar
              </button>
              <button onClick={handleSubmit as never} disabled={isPending}
                className="px-5 py-2 text-sm rounded-lg text-white font-semibold disabled:opacity-50 shadow-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#13602C' }}>
                {isPending ? 'Guardando…' : 'Guardar análisis'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabla ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Plus className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm font-medium">Sin análisis registrados</p>
            <p className="text-slate-400 text-xs mt-1">Usa el botón "Nuevo análisis" para agregar el primero.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Departamento', 'Muestra', 'Análisis', 'Fecha inicio', 'Días', 'Fecha entrega', 'Listo', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const dColors = DEPT_COLORS[item.departamento] ?? { bg: '#f1f5f9', text: '#475569' }
                  return (
                    <tr key={item.id}
                      style={{ borderBottom: i < items.length - 1 ? '1px solid #f1f5f9' : undefined }}
                      className={item.completado ? 'bg-green-50/50' : 'hover:bg-slate-50/60 transition-colors'}>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: dColors.bg, color: dColors.text }}>
                          {DEPARTAMENTOS.find(d => d.key === item.departamento)?.label ?? item.departamento}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 max-w-[160px]">
                        <span className="block truncate">{item.muestra}</span>
                      </td>
                      <td className="px-4 py-3.5 max-w-[240px]">
                        <span className="text-xs font-mono font-bold text-slate-400 mr-1.5">{item.ensayo.codigo}</span>
                        <span className="text-slate-700">{item.ensayo.nombre}</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-xs">{formatFecha(item.fechaInicio)}</td>
                      <td className="px-4 py-3.5 text-center text-slate-500 font-medium">{item.dias}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 text-xs">{formatFecha(item.fechaEntrega)}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button onClick={() => startTransition(async () => { await toggleAseguramientoItem(item.id) })}
                          disabled={isPending}
                          className="w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all mx-auto"
                          style={item.completado
                            ? { backgroundColor: '#13602C', borderColor: '#13602C', color: 'white' }
                            : { borderColor: '#d1d5db', color: 'transparent' }
                          }
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td className="px-3 py-3.5">
                        <button onClick={() => startTransition(async () => { await eliminarAseguramientoItem(item.id) })}
                          disabled={isPending}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
