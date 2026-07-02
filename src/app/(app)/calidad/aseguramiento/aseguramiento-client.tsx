'use client'

import { useState, useMemo, useTransition } from 'react'
import { Plus, X, Check, Trash2, Search } from 'lucide-react'
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

const DEPT_COLORS: Record<string, string> = {
  QUIMICA:       'bg-blue-100 text-blue-700',
  BIOLOGIA:      'bg-green-100 text-green-700',
  MICROBIOLOGIA: 'bg-purple-100 text-purple-700',
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

interface Props {
  items: Item[]
  ensayos: Ensayo[]
}

const EMPTY_FORM = { departamento: '', muestra: '', ensayoId: '', fechaInicio: '', dias: '' }

export function AseguramientoClient({ items, ensayos }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [ensayoSearch, setEnsayoSearch] = useState('')
  const [showEnsayoList, setShowEnsayoList] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const fechaEntregaCalc = useMemo(
    () => addDays(form.fechaInicio, Number(form.dias)),
    [form.fechaInicio, form.dias]
  )

  const ensayosFiltrados = useMemo(() => {
    if (!ensayoSearch) return ensayos.slice(0, 50)
    const q = ensayoSearch.toLowerCase()
    return ensayos.filter(e =>
      e.nombre.toLowerCase().includes(q) || e.codigo.toLowerCase().includes(q)
    ).slice(0, 50)
  }, [ensayos, ensayoSearch])

  const ensayoSeleccionado = ensayos.find(e => e.id === form.ensayoId)

  function resetForm() {
    setForm(EMPTY_FORM)
    setEnsayoSearch('')
    setShowEnsayoList(false)
    setError('')
    setShowForm(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.departamento || !form.muestra.trim() || !form.ensayoId || !form.fechaInicio || !form.dias) {
      setError('Completa todos los campos.')
      return
    }
    setError('')
    startTransition(async () => {
      await crearAseguramientoItem({
        departamento: form.departamento,
        muestra: form.muestra.trim(),
        ensayoId: form.ensayoId,
        fechaInicio: form.fechaInicio,
        dias: Number(form.dias),
      })
      resetForm()
    })
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      await toggleAseguramientoItem(id)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await eliminarAseguramientoItem(id)
    })
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Aseguramiento</h1>
          <p className="text-sm text-slate-500 mt-1">Seguimiento de análisis por departamento</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: '#13602C' }}
        >
          <Plus className="w-4 h-4" />
          Nuevo análisis
        </button>
      </div>

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-slate-900">Registrar análisis</h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Departamento */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
                <select
                  value={form.departamento}
                  onChange={e => setForm(f => ({ ...f, departamento: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]/30 focus:border-[#13602C]"
                >
                  <option value="">Seleccionar departamento…</option>
                  {DEPARTAMENTOS.map(d => (
                    <option key={d.key} value={d.key}>{d.label}</option>
                  ))}
                </select>
              </div>

              {/* Muestra */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Muestra</label>
                <input
                  type="text"
                  value={form.muestra}
                  onChange={e => setForm(f => ({ ...f, muestra: e.target.value }))}
                  placeholder="Descripción de la muestra…"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]/30 focus:border-[#13602C]"
                />
              </div>

              {/* Análisis (ensayo) */}
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">Análisis</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar ensayo…"
                    value={ensayoSeleccionado ? `${ensayoSeleccionado.codigo} · ${ensayoSeleccionado.nombre}` : ensayoSearch}
                    onChange={e => {
                      setEnsayoSearch(e.target.value)
                      setForm(f => ({ ...f, ensayoId: '' }))
                      setShowEnsayoList(true)
                    }}
                    onFocus={() => setShowEnsayoList(true)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]/30 focus:border-[#13602C]"
                  />
                  <Search className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {showEnsayoList && !ensayoSeleccionado && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-auto">
                    {ensayosFiltrados.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-slate-400">Sin resultados</div>
                    ) : ensayosFiltrados.map(e => (
                      <button
                        key={e.id}
                        type="button"
                        onMouseDown={() => {
                          setForm(f => ({ ...f, ensayoId: e.id }))
                          setShowEnsayoList(false)
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0"
                      >
                        <span className="font-medium text-slate-700">{e.codigo}</span>
                        <span className="text-slate-500 ml-2">{e.nombre}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fecha inicio + Días */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha inicio</label>
                  <input
                    type="date"
                    value={form.fechaInicio}
                    onChange={e => setForm(f => ({ ...f, fechaInicio: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]/30 focus:border-[#13602C]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Días</label>
                  <input
                    type="number"
                    min={1}
                    value={form.dias}
                    onChange={e => setForm(f => ({ ...f, dias: e.target.value }))}
                    placeholder="Ej. 5"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]/30 focus:border-[#13602C]"
                  />
                </div>
              </div>

              {/* Fecha entrega calculada */}
              {fechaEntregaCalc && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-sm text-slate-500">Fecha de entrega:</span>
                  <span className="text-sm font-semibold text-slate-800">{formatFecha(fechaEntregaCalc)}</span>
                </div>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: '#13602C' }}
                >
                  {isPending ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No hay análisis registrados. Agrega el primero con el botón de arriba.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b text-left">
                  <th className="px-4 py-3 font-medium text-slate-600">Departamento</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Muestra</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Análisis</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Fecha Inicio</th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-center">Días</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Fecha Entrega</th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-center">Listo</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(item => (
                  <tr key={item.id} className={item.completado ? 'bg-green-50/60' : 'hover:bg-slate-50/60'}>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${DEPT_COLORS[item.departamento] ?? 'bg-slate-100 text-slate-600'}`}>
                        {DEPARTAMENTOS.find(d => d.key === item.departamento)?.label ?? item.departamento}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-[180px] truncate">{item.muestra}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-[220px]">
                      <span className="font-medium text-slate-500 text-xs">{item.ensayo.codigo}</span>
                      <span className="ml-1.5 text-slate-700">{item.ensayo.nombre}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatFecha(item.fechaInicio)}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{item.dias}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">{formatFecha(item.fechaEntrega)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggle(item.id)}
                        disabled={isPending}
                        className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-colors mx-auto ${
                          item.completado
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-slate-300 hover:border-green-400 text-transparent hover:text-green-400'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={isPending}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
