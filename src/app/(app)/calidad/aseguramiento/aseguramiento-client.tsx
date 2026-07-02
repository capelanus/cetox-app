'use client'

import { useState, useMemo, useTransition, useRef } from 'react'
import { Plus, X, Trash2, ChevronDown, Search, FileText, Printer } from 'lucide-react'
import { crearAseguramientoItem, eliminarAseguramientoItem } from '@/app/actions/aseguramiento'

// ── Constants ──────────────────────────────────────────────────────────────────

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

// ── Types ──────────────────────────────────────────────────────────────────────

interface Ensayo { id: string; nombre: string; codigo: string; area: string }
interface Item {
  id: string
  departamento: string
  muestra: string
  ensayo: { id: string; nombre: string; codigo: string; metodoNorma: string }
  fechaInicio: Date | string
  dias: number
  fechaEntrega: Date | string
  completado: boolean
}
interface MemoItemForm {
  id: string; numero: number; muestra: string
  ingredienteActivo: string; formulacion: string
  lote: string; ff: string; fv: string
  cantidadEntregada: string; analisis: string
  obs: string; fechaEntrega: string
}
interface MemoHeader {
  numero: string; destinatario: string
  de: string; asunto: string; fecha: string
}

interface Props { items: Item[]; ensayos: Ensayo[] }

// ── Helpers ────────────────────────────────────────────────────────────────────

const EMPTY_FORM = { departamento: '', muestra: '', ensayoId: '', fechaInicio: '', dias: '' }
const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#13602C]/25 focus:border-[#13602C] transition-all placeholder:text-slate-400'

function buildMemoHTML(header: MemoHeader, items: MemoItemForm[]): string {
  const ingresoBlocks = items.map(item => `
    <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
      <tr><td colspan="2" style="border:1px solid #000;padding:4px 8px;background:#f5f5f5;">
        <strong>Ingreso N° ${String(item.numero).padStart(2,'0')}</strong>
      </td></tr>
      <tr><td style="border:1px solid #000;padding:4px 8px;width:40%;">Muestra</td>
          <td style="border:1px solid #000;padding:4px 8px;">${item.muestra}</td></tr>
      <tr><td style="border:1px solid #000;padding:4px 8px;">Ingrediente activo</td>
          <td style="border:1px solid #000;padding:4px 8px;">${item.ingredienteActivo}</td></tr>
      <tr><td style="border:1px solid #000;padding:4px 8px;">Formulación</td>
          <td style="border:1px solid #000;padding:4px 8px;">
            ${item.formulacion}&nbsp;&nbsp;&nbsp;Lote: ${item.lote}&nbsp;&nbsp;&nbsp;FF: ${item.ff}&nbsp;&nbsp;&nbsp;FV: ${item.fv}
          </td></tr>
      <tr><td style="border:1px solid #000;padding:4px 8px;">Cantidad entregada</td>
          <td style="border:1px solid #000;padding:4px 8px;">${item.cantidadEntregada}</td></tr>
      <tr><td style="border:1px solid #000;padding:4px 8px;">Análisis</td>
          <td style="border:1px solid #000;padding:4px 8px;">${item.analisis}</td></tr>
      <tr><td style="border:1px solid #000;padding:4px 8px;">Obs</td>
          <td style="border:1px solid #000;padding:4px 8px;">${item.obs || '—'}</td></tr>
      <tr><td style="border:1px solid #000;padding:4px 8px;">Fecha de entrega</td>
          <td style="border:1px solid #000;padding:4px 8px;">${item.fechaEntrega}</td></tr>
    </table>
    <p style="margin:4px 0;">—</p>
  `).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Memorandum ${header.numero}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11pt; color: #000; margin: 0; padding: 0; }
    .page { max-width: 740px; margin: 0 auto; padding: 24px 32px; }
    .company-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 16px; }
    .title { text-align: center; margin-bottom: 16px; }
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    .header-table td { border: 1px solid #000; padding: 4px 10px; }
    .header-table .label { font-weight: bold; width: 90px; }
    .body-text { margin-bottom: 14px; line-height: 1.5; }
    .footer-box { border: 1px solid #000; padding: 8px 12px; margin-top: 16px; line-height: 1.6; }
    .sign { margin-top: 32px; }
    .fr { text-align: right; margin-top: 8px; font-size: 9pt; }
    @media print {
      @page { margin: 18mm 20mm; size: A4; }
      body { font-size: 10.5pt; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="company-header">
    <strong>CENTRO TOXICOLÓGICO S.A.C.</strong><br>
    <strong>CETOX</strong>
  </div>

  <div class="title">
    <strong>MEMORANDUM</strong><br>
    <strong>N° ${header.numero}</strong>
  </div>

  <table class="header-table">
    <tr><td class="label">A</td><td>: ${header.destinatario}</td></tr>
    <tr><td class="label">DE</td><td>: ${header.de}</td></tr>
    <tr><td class="label">ASUNTO</td><td>: ${header.asunto}</td></tr>
    <tr><td class="label">FECHA</td><td>: ${header.fecha}</td></tr>
  </table>

  <p class="body-text">
    Por la presente se le comunica que el día de hoy se realice el ingreso de las muestras
    entregadas para el aseguramiento de los sgtes. ensayos (Departamento de Química)
  </p>

  ${ingresoBlocks}

  <div class="footer-box">
    <p style="margin:0 0 8px 0;">Se reitera que las muestras entregadas son para Aseguramiento del Dpto. de Química, coordinado con Gerente Técnico (R. Anaya y G. Risco)</p>
    <p style="margin:0 0 8px 0;">Se recuerda que la información brindada debe tratarse como información confidencial, considerando que son ensayos de aseguramiento de la veracidad de resultados.</p>
    <p style="margin:0;">Estos ensayos son realizados bajo la aprobación de Alta Dirección.</p>
  </div>

  <div class="sign">
    <p>Atte,</p>
    <br><br>
    <p>G. Risco</p>
  </div>

  <p class="fr">FR N° 053-CETOX-V.01</p>
</div>
</body>
</html>`
}

// ── Component ──────────────────────────────────────────────────────────────────

export function AseguramientoClient({ items, ensayos }: Props) {
  // New-item form
  const [showForm, setShowForm]             = useState(false)
  const [form, setForm]                     = useState(EMPTY_FORM)
  const [ensayoSearch, setEnsayoSearch]     = useState('')
  const [showEnsayoList, setShowEnsayoList] = useState(false)
  const [isPending, startTransition]        = useTransition()
  const [error, setError]                   = useState('')

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Memorandum modal
  const [showMemo, setShowMemo]   = useState(false)
  const [memoHeader, setMemoHeader] = useState<MemoHeader>({
    numero: '', destinatario: '',
    de: 'G. Risco (Dirección de Laboratorios y Calidad)',
    asunto: '', fecha: '',
  })
  const [memoForms, setMemoForms] = useState<MemoItemForm[]>([])

  // Stable order (doesn't reorder on toggle/update)
  const orderRef = useRef<string[]>(items.map(i => i.id))
  const stableItems = useMemo(() => {
    const map = Object.fromEntries(items.map(i => [i.id, i]))
    const newIds = items.map(i => i.id).filter(id => !orderRef.current.includes(id))
    orderRef.current = [...orderRef.current.filter(id => map[id]), ...newIds]
    return orderRef.current.map(id => map[id]).filter(Boolean)
  }, [items])

  // Derived
  const fechaEntregaCalc = useMemo(() => addDays(form.fechaInicio, Number(form.dias)), [form.fechaInicio, form.dias])
  const ensayosFiltrados = useMemo(() => {
    const q = ensayoSearch.toLowerCase()
    return ensayos.filter(e => !q || e.nombre.toLowerCase().includes(q) || e.codigo.toLowerCase().includes(q)).slice(0, 60)
  }, [ensayos, ensayoSearch])
  const ensayoSel = ensayos.find(e => e.id === form.ensayoId)

  const allSelected = stableItems.length > 0 && stableItems.every(i => selectedIds.has(i.id))

  // Handlers
  function resetForm() {
    setForm(EMPTY_FORM); setEnsayoSearch(''); setShowEnsayoList(false); setError(''); setShowForm(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.departamento || !form.muestra.trim() || !form.ensayoId || !form.fechaInicio || !form.dias) {
      setError('Completa todos los campos.'); return
    }
    setError('')
    startTransition(async () => {
      await crearAseguramientoItem({ departamento: form.departamento, muestra: form.muestra.trim(), ensayoId: form.ensayoId, fechaInicio: form.fechaInicio, dias: Number(form.dias) })
      resetForm()
    })
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleAll() {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(stableItems.map(i => i.id)))
  }

  function openMemo() {
    const selected = stableItems.filter(i => selectedIds.has(i.id))
    setMemoForms(selected.map((item, idx) => ({
      id: item.id, numero: idx + 1,
      muestra: item.muestra,
      ingredienteActivo: '', formulacion: '', lote: '', ff: '', fv: '',
      cantidadEntregada: '',
      analisis: `${item.ensayo.nombre.toUpperCase()} - ${item.ensayo.metodoNorma}`,
      obs: '',
      fechaEntrega: formatFecha(item.fechaEntrega),
    })))
    setShowMemo(true)
  }

  function updateMemoForm(idx: number, field: keyof MemoItemForm, value: string) {
    setMemoForms(prev => prev.map((f, i) => i === idx ? { ...f, [field]: value } : f))
  }

  function handlePrint() {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(buildMemoHTML(memoHeader, memoForms))
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Aseguramiento</h1>
          <p className="text-sm text-slate-500 mt-0.5">Seguimiento de análisis por departamento</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#13602C' }}>
          <Plus className="w-4 h-4" /> Nuevo análisis
        </button>
      </div>

      {/* Selection action bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center justify-between px-4 py-3 rounded-xl border border-[#13602C]/30 bg-[#13602C]/5">
          <span className="text-sm font-medium text-[#13602C]">
            {selectedIds.size} análisis seleccionado{selectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedIds(new Set())}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
              Limpiar selección
            </button>
            <button onClick={openMemo}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#13602C' }}>
              <FileText className="w-4 h-4" /> Generar Memorandum
            </button>
          </div>
        </div>
      )}

      {/* ── Modal nuevo análisis ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: '90vh' }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="font-bold text-slate-900 text-base">Registrar análisis</h2>
                <p className="text-xs text-slate-400 mt-0.5">Todos los campos son obligatorios</p>
              </div>
              <button onClick={resetForm} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Departamento</label>
                <div className="relative">
                  <select value={form.departamento} onChange={e => setForm(f => ({ ...f, departamento: e.target.value }))} className={inputCls + ' appearance-none pr-9 cursor-pointer'}>
                    <option value="">Seleccionar…</option>
                    {DEPARTAMENTOS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Muestra</label>
                <input type="text" value={form.muestra} onChange={e => setForm(f => ({ ...f, muestra: e.target.value }))} placeholder="Descripción de la muestra…" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Análisis</label>
                {ensayoSel ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-[#13602C]/5 border border-[#13602C]/20 rounded-lg">
                    <span className="text-xs font-mono font-semibold text-[#13602C] shrink-0">{ensayoSel.codigo}</span>
                    <span className="text-sm text-slate-700 flex-1 truncate">{ensayoSel.nombre}</span>
                    <button type="button" onClick={() => { setForm(f => ({ ...f, ensayoId: '' })); setEnsayoSearch('') }} className="text-slate-400 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input type="text" placeholder="Buscar por nombre o código…" value={ensayoSearch}
                      onChange={e => { setEnsayoSearch(e.target.value); setShowEnsayoList(true) }}
                      onFocus={() => setShowEnsayoList(true)}
                      className={inputCls + ' pl-9'} />
                    {showEnsayoList && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-auto">
                        {ensayosFiltrados.length === 0
                          ? <div className="px-4 py-3 text-sm text-slate-400 text-center">Sin resultados</div>
                          : ensayosFiltrados.map(e => (
                            <button key={e.id} type="button"
                              onMouseDown={() => { setForm(f => ({ ...f, ensayoId: e.id })); setShowEnsayoList(false); setEnsayoSearch('') }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50 last:border-0">
                              <span className="text-xs font-mono font-bold text-[#13602C] shrink-0 w-20 truncate">{e.codigo}</span>
                              <span className="text-slate-600 truncate">{e.nombre}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Fecha inicio</label>
                  <input type="date" value={form.fechaInicio} onChange={e => setForm(f => ({ ...f, fechaInicio: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Días</label>
                  <input type="number" min={1} value={form.dias} onChange={e => setForm(f => ({ ...f, dias: e.target.value }))} placeholder="Ej. 5" className={inputCls} />
                </div>
              </div>
              {fechaEntregaCalc && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl border-2 border-dashed border-[#13602C]/30 bg-[#13602C]/5">
                  <span className="text-xs font-semibold text-[#13602C]/70 uppercase tracking-wide">Fecha de entrega</span>
                  <span className="text-sm font-bold text-[#13602C]">{formatFecha(fechaEntregaCalc)}</span>
                </div>
              )}
              {error && <div className="px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>}
            </form>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors">Cancelar</button>
              <button onClick={handleSubmit as never} disabled={isPending} className="px-5 py-2 text-sm rounded-lg text-white font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity" style={{ backgroundColor: '#13602C' }}>
                {isPending ? 'Guardando…' : 'Guardar análisis'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal memorandum ── */}
      {showMemo && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
            {/* Memo modal header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="font-bold text-slate-900 text-base">Generar Memorandum</h2>
                <p className="text-xs text-slate-400 mt-0.5">{memoForms.length} ingreso{memoForms.length > 1 ? 's' : ''} seleccionado{memoForms.length > 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setShowMemo(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5 flex-1 space-y-6">
              {/* Header del memorandum */}
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Encabezado del memorandum</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">N° Memorandum</label>
                    <input type="text" placeholder="006-AC-2026" value={memoHeader.numero} onChange={e => setMemoHeader(h => ({ ...h, numero: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Fecha</label>
                    <input type="text" placeholder="23 de marzo de 2026" value={memoHeader.fecha} onChange={e => setMemoHeader(h => ({ ...h, fecha: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">A</label>
                    <input type="text" placeholder="Área administrativa" value={memoHeader.destinatario} onChange={e => setMemoHeader(h => ({ ...h, destinatario: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">DE</label>
                    <input type="text" value={memoHeader.de} onChange={e => setMemoHeader(h => ({ ...h, de: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">ASUNTO</label>
                    <input type="text" placeholder="Aseguramiento validez resultados – Dpto Química" value={memoHeader.asunto} onChange={e => setMemoHeader(h => ({ ...h, asunto: e.target.value }))} className={inputCls} />
                  </div>
                </div>
              </section>

              {/* Por cada ingreso */}
              {memoForms.map((item, idx) => (
                <section key={item.id} className="border border-slate-200 rounded-xl p-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Ingreso N° {String(idx + 1).padStart(2, '0')}
                    <span className="ml-2 normal-case font-medium text-slate-500">· {item.muestra}</span>
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Muestra</label>
                      <input type="text" value={item.muestra} onChange={e => updateMemoForm(idx, 'muestra', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Ingrediente activo</label>
                      <input type="text" placeholder="Ej. Benomyl 500 g/kg" value={item.ingredienteActivo} onChange={e => updateMemoForm(idx, 'ingredienteActivo', e.target.value)} className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Formulación</label>
                        <input type="text" placeholder="Polvo mojable (WP)" value={item.formulacion} onChange={e => updateMemoForm(idx, 'formulacion', e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Lote</label>
                        <input type="text" placeholder="20250303-1" value={item.lote} onChange={e => updateMemoForm(idx, 'lote', e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">FF (Fecha fabricación)</label>
                        <input type="text" placeholder="03/2025" value={item.ff} onChange={e => updateMemoForm(idx, 'ff', e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">FV (Fecha vencimiento)</label>
                        <input type="text" placeholder="03/2027" value={item.fv} onChange={e => updateMemoForm(idx, 'fv', e.target.value)} className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Cantidad entregada</label>
                      <input type="text" placeholder="Bolsa x 1 kg (Envase original)" value={item.cantidadEntregada} onChange={e => updateMemoForm(idx, 'cantidadEntregada', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Análisis</label>
                      <input type="text" value={item.analisis} onChange={e => updateMemoForm(idx, 'analisis', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Observaciones</label>
                      <input type="text" placeholder="Obs: Sin agitación. Forma de uso: Dosis 200 g/200 L" value={item.obs} onChange={e => updateMemoForm(idx, 'obs', e.target.value)} className={inputCls} />
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-xs text-slate-500 font-medium">Fecha de entrega</span>
                      <span className="text-sm font-bold text-slate-800">{item.fechaEntrega}</span>
                    </div>
                  </div>
                </section>
              ))}

              {/* Footer preview */}
              <section className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500 space-y-1.5">
                <p className="font-semibold text-slate-600 text-xs uppercase tracking-wide mb-2">Texto final (fijo)</p>
                <p>Se reitera que las muestras entregadas son para Aseguramiento del Dpto. de Química…</p>
                <p>Se recuerda que la información brindada debe tratarse como información confidencial…</p>
                <p>Estos ensayos son realizados bajo la aprobación de Alta Dirección.</p>
                <p className="pt-1">Atte, G. Risco &nbsp;·&nbsp; FR N° 053-CETOX-V.01</p>
              </section>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
              <button onClick={() => setShowMemo(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium">Cancelar</button>
              <button onClick={handlePrint}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#13602C' }}>
                <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabla ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {stableItems.length === 0 ? (
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
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      className="w-4 h-4 rounded border-slate-300 accent-[#13602C] cursor-pointer" />
                  </th>
                  {['Departamento','Muestra','Análisis','Fecha inicio','Días','Fecha entrega',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stableItems.map((item, i) => {
                  const dColors = DEPT_COLORS[item.departamento] ?? { bg: '#f1f5f9', text: '#475569' }
                  const selected = selectedIds.has(item.id)
                  return (
                    <tr key={item.id}
                      style={{ borderBottom: i < stableItems.length - 1 ? '1px solid #f1f5f9' : undefined, backgroundColor: selected ? '#f0fdf4' : undefined }}
                      className={!selected ? 'hover:bg-slate-50/60 transition-colors' : ''}>
                      <td className="px-4 py-3.5 text-center">
                        <input type="checkbox" checked={selected} onChange={() => toggleSelect(item.id)}
                          className="w-4 h-4 rounded border-slate-300 accent-[#13602C] cursor-pointer" />
                      </td>
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
