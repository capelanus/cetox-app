'use client'

import { useMemo, useState, useTransition } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, CheckCircle2, Clock3, Newspaper } from 'lucide-react'
import { guardarRevisionBlog } from '@/app/actions/blog-web'
import { formatFecha } from '@/lib/format'

export interface ArticuloBlog {
  id: string
  slug: string
  titulo: string
  categoria: string
  url: string
  revisorNombre: string | null
  revisorCargo: string | null
  revisorColegiatura: string | null
  fechaRevision: string | null
  estado: string
  notaInterna: string | null
  actualizadoPor: string | null
  updatedAt: string
  createdAt: string
}

function Badge({ estado }: { estado: string }) {
  const ok = estado === 'REVISADO'
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={ok ? { color: '#13602C', backgroundColor: '#ecfdf5' } : { color: '#b45309', backgroundColor: '#fffbeb' }}
    >
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <Clock3 className="w-3 h-3" />}
      {ok ? 'Revisado' : 'Pendiente'}
    </span>
  )
}

function Campo({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-500 text-xs font-medium">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
      />
    </label>
  )
}

function Tarjeta({ a }: { a: ArticuloBlog }) {
  const [abierto, setAbierto] = useState(a.estado !== 'REVISADO')
  const [estado, setEstado] = useState(a.estado)
  const [nombre, setNombre] = useState(a.revisorNombre ?? '')
  const [cargo, setCargo] = useState(a.revisorCargo ?? '')
  const [colegiatura, setColegiatura] = useState(a.revisorColegiatura ?? '')
  const [fecha, setFecha] = useState(a.fechaRevision ?? '')
  const [nota, setNota] = useState(a.notaInterna ?? '')
  const [pending, startTransition] = useTransition()
  const [aviso, setAviso] = useState<string | null>(null)

  const guardar = () => {
    startTransition(async () => {
      const r = await guardarRevisionBlog(a.id, {
        revisorNombre: nombre, revisorCargo: cargo, revisorColegiatura: colegiatura,
        fechaRevision: fecha, notaInterna: nota,
      })
      if (r.ok) {
        setEstado(r.estado)
        setAviso(r.estado === 'REVISADO' ? 'Guardado. La web mostrará la autoría en unos minutos.' : 'Guardado como pendiente (faltan datos para marcarlo revisado).')
      } else {
        setAviso(r.error ?? 'No se pudo guardar.')
      }
      setTimeout(() => setAviso(null), 4000)
    })
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button onClick={() => setAbierto(v => !v)} className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900">{a.titulo}</span>
            <Badge estado={estado} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            /blog/{a.slug}
            {estado === 'REVISADO' && nombre ? ` · ${nombre}${cargo ? `, ${cargo}` : ''}${fecha ? ` · revisado el ${formatFecha(fecha)}` : ''}` : ' · sin revisor asignado'}
          </p>
        </div>
        {abierto ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>

      {abierto && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Campo label="Nombre del científico revisor" value={nombre} onChange={setNombre} placeholder="Ej. Dra. Ana Pérez Rojas" />
            <Campo label="Cargo" value={cargo} onChange={setCargo} placeholder="Ej. Jefa del Departamento de Química" />
            <Campo label="Colegiatura" value={colegiatura} onChange={setColegiatura} placeholder="Ej. CQP 1234 / CMP 56789" />
            <Campo label="Fecha de revisión" value={fecha} onChange={setFecha} type="date" />
          </div>
          <label className="block text-sm">
            <span className="text-slate-500 text-xs font-medium">Nota interna (no se publica)</span>
            <textarea
              value={nota}
              onChange={e => setNota(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
            />
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={guardar}
              disabled={pending}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: '#13602C' }}
            >
              {pending ? 'Guardando…' : 'Guardar autoría'}
            </button>
            <a href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
              <ExternalLink className="w-4 h-4" /> Ver artículo en la web
            </a>
            {aviso && <span className="text-xs text-slate-500">{aviso}</span>}
            {a.actualizadoPor && !aviso && (
              <span className="text-xs text-slate-400">Última edición: {a.actualizadoPor} · {formatFecha(a.updatedAt)}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function BlogWebViewer({ articulos }: { articulos: ArticuloBlog[] }) {
  const [filtro, setFiltro] = useState<'TODOS' | 'PENDIENTE' | 'REVISADO'>('TODOS')
  const pendientes = articulos.filter(a => a.estado !== 'REVISADO').length

  const grupos = useMemo(() => {
    const vis = articulos.filter(a => filtro === 'TODOS' || a.estado === filtro)
    const map = new Map<string, ArticuloBlog[]>()
    for (const a of vis) map.set(a.categoria, [...(map.get(a.categoria) ?? []), a])
    return [...map.entries()]
  }, [articulos, filtro])

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Newspaper className="w-6 h-6" style={{ color: '#13602C' }} /> Blog web
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Asigna el científico que revisa cada artículo de cetoxlab.com/blog (nombre, cargo y colegiatura) y la fecha de revisión.
            La web muestra esa autoría automáticamente; mientras tanto el artículo dice «revisión científica pendiente».
          </p>
        </div>
        <div className="text-right text-sm">
          <div className="font-semibold text-slate-900">{articulos.length} artículos</div>
          <div className="text-amber-700">{pendientes} pendientes</div>
        </div>
      </div>

      <div className="flex gap-2">
        {(['TODOS', 'PENDIENTE', 'REVISADO'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${filtro === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            {f === 'TODOS' ? 'Todos' : f === 'PENDIENTE' ? 'Pendientes' : 'Revisados'}
          </button>
        ))}
      </div>

      {grupos.map(([categoria, items]) => (
        <section key={categoria} className="space-y-2">
          <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase pt-2">{categoria}</h2>
          {items.map(a => <Tarjeta key={a.id} a={a} />)}
        </section>
      ))}
      {grupos.length === 0 && <p className="text-sm text-slate-500">No hay artículos en este filtro.</p>}
    </div>
  )
}
