'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  ChevronDown, ChevronUp, Globe, Building2, Mail, Phone, MapPin,
  FlaskConical, Target, FileCheck2, Boxes, Calendar, MessageSquare,
} from 'lucide-react'
import { cambiarEstadoSolicitudWeb } from '@/app/actions/solicitudes-web'
import { formatFechaHora } from '@/lib/format'

interface Solicitud {
  id: string
  formulario: string
  nombre: string
  empresa: string | null
  correo: string
  telefono: string | null
  ubicacion: string | null
  sector: string | null
  matriz: string | null
  analisis: string | null
  objetivo: string | null
  norma: string | null
  cantidad: string | null
  acreditado: string | null
  fechaRequerida: string | null
  detalle: string | null
  mensaje: string | null
  pagina: string | null
  estado: string
  notaInterna: string | null
  atendidoPor: string | null
  fechaAtencion: string | null
  createdAt: string
}

const FORM_LABELS: Record<string, string> = {
  solicitud: 'Solicitud de análisis',
  contacto: 'Contacto',
  reclamo: 'Libro de Reclamaciones',
  chat: 'Asistente web',
}

const ESTADOS = [
  { key: 'NUEVA', label: 'Nueva', color: '#1d4ed8', bg: '#eff6ff' },
  { key: 'EN_PROCESO', label: 'En proceso', color: '#b45309', bg: '#fffbeb' },
  { key: 'ATENDIDA', label: 'Atendida', color: '#13602C', bg: '#ecfdf5' },
  { key: 'DESCARTADA', label: 'Descartada', color: '#64748b', bg: '#f8fafc' },
] as const

function Badge({ estado }: { estado: string }) {
  const cfg = ESTADOS.find(e => e.key === estado) ?? ESTADOS[0]
  return (
    <span
      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </span>
  )
}

function Row({ icon: Icon, label, value }: { icon: typeof Globe; label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
      <div>
        <span className="text-slate-500">{label}: </span>
        <span className="text-slate-800">{value}</span>
      </div>
    </div>
  )
}

function Tarjeta({ s }: { s: Solicitud }) {
  const [abierto, setAbierto] = useState(false)
  const [estado, setEstado] = useState(s.estado)
  const [nota, setNota] = useState(s.notaInterna ?? '')
  const [pending, startTransition] = useTransition()
  const [aviso, setAviso] = useState<string | null>(null)
  const { fecha, hora } = formatFechaHora(s.createdAt)

  const guardar = (nuevoEstado: string) => {
    setEstado(nuevoEstado)
    startTransition(async () => {
      const r = await cambiarEstadoSolicitudWeb(s.id, nuevoEstado as never, nota)
      setAviso(r.ok ? 'Guardado' : r.error ?? 'Error')
      setTimeout(() => setAviso(null), 2500)
    })
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button onClick={() => setAbierto(a => !a)} className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 truncate">{s.nombre}</span>
            {s.empresa && <span className="text-sm text-slate-500 truncate">· {s.empresa}</span>}
            <Badge estado={estado} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {FORM_LABELS[s.formulario] ?? s.formulario} · {fecha} {hora} · {s.correo}
          </p>
        </div>
        {abierto ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>

      {abierto && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
            <Row icon={Mail} label="Correo" value={s.correo} />
            <Row icon={Phone} label="Teléfono" value={s.telefono} />
            <Row icon={MapPin} label="Ubicación" value={s.ubicacion} />
            <Row icon={Building2} label="Sector" value={s.sector} />
            <Row icon={FlaskConical} label="Muestra / matriz" value={s.matriz} />
            <Row icon={FileCheck2} label="Análisis / parámetro" value={s.analisis} />
            <Row icon={Target} label="Objetivo" value={s.objetivo} />
            <Row icon={FileCheck2} label="Norma / método" value={s.norma} />
            <Row icon={Boxes} label="N° de muestras" value={s.cantidad} />
            <Row icon={FileCheck2} label="Alcance acreditado" value={s.acreditado} />
            <Row icon={Calendar} label="Fecha requerida" value={s.fechaRequerida} />
            <Row icon={Globe} label="Página" value={s.pagina} />
          </div>
          {(s.detalle || s.mensaje) && (
            <div className="flex items-start gap-2 text-sm bg-slate-50 rounded-lg px-3 py-2">
              <MessageSquare className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
              <p className="text-slate-700 whitespace-pre-wrap">{s.detalle || s.mensaje}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {ESTADOS.map(e => (
              <button
                key={e.key}
                onClick={() => guardar(e.key)}
                disabled={pending}
                className="text-xs font-medium px-2.5 py-1 rounded-full border disabled:opacity-50"
                style={estado === e.key
                  ? { color: e.color, backgroundColor: e.bg, borderColor: e.color }
                  : { color: '#64748b', backgroundColor: 'white', borderColor: '#e2e8f0' }}
              >
                {e.label}
              </button>
            ))}
            {aviso && <span className="text-xs text-slate-500">{aviso}</span>}
          </div>
          <textarea
            value={nota}
            onChange={e => setNota(e.target.value)}
            onBlur={() => guardar(estado)}
            placeholder="Nota interna (quién respondió, qué se acordó…)"
            rows={2}
            className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:border-slate-400"
          />
          {s.atendidoPor && (
            <p className="text-xs text-slate-400">Última actualización: {s.atendidoPor}{s.fechaAtencion ? ` · ${formatFechaHora(s.fechaAtencion).fecha}` : ''}</p>
          )}
        </div>
      )}
    </div>
  )
}

export function SolicitudesWebViewer({ solicitudes }: { solicitudes: Solicitud[] }) {
  const [filtro, setFiltro] = useState<string>('TODAS')
  const [busqueda, setBusqueda] = useState('')

  const filtradas = useMemo(() => {
    return solicitudes.filter(s => {
      if (filtro !== 'TODAS' && s.estado !== filtro) return false
      if (!busqueda.trim()) return true
      const q = busqueda.toLowerCase()
      return [s.nombre, s.empresa, s.correo, s.matriz, s.analisis, s.sector].some(v => v?.toLowerCase().includes(q))
    })
  }, [solicitudes, filtro, busqueda])

  const contadores = useMemo(() => {
    const c: Record<string, number> = { TODAS: solicitudes.length }
    for (const e of ESTADOS) c[e.key] = solicitudes.filter(s => s.estado === e.key).length
    return c
  }, [solicitudes])

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Globe className="w-5 h-5" style={{ color: '#13602C' }} />
          Solicitudes web
        </h1>
        <p className="text-sm text-slate-500">Formularios enviados desde cetoxlab.com (Solicitar análisis, contacto y reclamos).</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFiltro('TODAS')}
          className="text-sm font-medium px-3 py-1.5 rounded-lg border"
          style={filtro === 'TODAS' ? { backgroundColor: '#13602C', color: 'white', borderColor: '#13602C' } : { color: '#475569', borderColor: '#e2e8f0' }}
        >
          Todas ({contadores.TODAS})
        </button>
        {ESTADOS.map(e => (
          <button
            key={e.key}
            onClick={() => setFiltro(e.key)}
            className="text-sm font-medium px-3 py-1.5 rounded-lg border"
            style={filtro === e.key ? { backgroundColor: e.color, color: 'white', borderColor: e.color } : { color: '#475569', borderColor: '#e2e8f0' }}
          >
            {e.label} ({contadores[e.key] ?? 0})
          </button>
        ))}
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, empresa, correo, ensayo…"
          className="ml-auto text-sm rounded-lg border border-slate-200 px-3 py-1.5 w-64 focus:outline-none focus:border-slate-400"
        />
      </div>

      <div className="space-y-2">
        {filtradas.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-10">No hay solicitudes con este filtro.</p>
        )}
        {filtradas.map(s => <Tarjeta key={s.id} s={s} />)}
      </div>
    </div>
  )
}
