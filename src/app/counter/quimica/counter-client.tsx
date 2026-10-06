'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { PackageOpen, FlaskConical, ScanBarcode, Delete, CheckCircle2, X, LogOut } from 'lucide-react'
import {
  buscarMuestraPorCodigo,
  dejarMuestraEnCounter,
  recepcionarMuestraEnCounter,
} from '@/app/actions/counter-quimica'

export interface OdaCounter {
  id: string
  codigo: string
  odaNumero: number
  estado: string
  nombreComercial: string | null
  cliente: string
  tipoMuestra: string | null
  numeroMuestras: string | null
  ensayos: string[]
  fechaEntregaLab: string | null
  entregadaPor: string | null
}

type Modo = 'dejar' | 'recepcionar'

const MODO = {
  dejar: {
    titulo: 'Dejar muestra',
    quien: 'Administración',
    color: '#1d4ed8',
    fondo: '#eff6ff',
    icono: PackageOpen,
    esperado: 'EMITIDA',
    vacio: 'No hay muestras pendientes de entregar.',
    verbo: 'Dejar en el counter',
    exito: 'Muestra dejada en el counter',
  },
  recepcionar: {
    titulo: 'Recepcionar muestra',
    quien: 'Química',
    color: '#13602C',
    fondo: '#ecfdf5',
    icono: FlaskConical,
    esperado: 'ENTREGADA_LAB',
    vacio: 'No hay muestras esperando en el counter.',
    verbo: 'Recepcionar',
    exito: 'Muestra recepcionada',
  },
} as const

function haceCuanto(iso: string | null) {
  if (!iso) return ''
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'ahora mismo'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  return h < 24 ? `hace ${h} h` : `hace ${Math.floor(h / 24)} d`
}

export function CounterClient({ odas, tablet }: { odas: OdaCounter[]; tablet: string }) {
  const router = useRouter()
  const [firma, setFirma] = useState<{ modo: Modo; oda: OdaCounter } | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [codigo, setCodigo] = useState('')
  const [buscando, setBuscando] = useState(false)
  const lectorRef = useRef<HTMLInputElement>(null)

  // El lector USB se comporta como un teclado: escribe el código y manda
  // Enter. Para que eso caiga siempre en el campo correcto, el campo recupera
  // el foco solo, salvo mientras se está tecleando un PIN.
  const enfocarLector = useCallback(() => {
    if (!firma) setTimeout(() => lectorRef.current?.focus(), 50)
  }, [firma])
  useEffect(() => { enfocarLector() }, [enfocarLector, odas])

  // La tablet queda abierta todo el día: si la otra parte actúa desde su PC,
  // la pantalla se pone al día sola.
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 45_000)
    return () => clearInterval(t)
  }, [router])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 6000)
    return () => clearTimeout(t)
  }, [aviso])

  // Un solo campo para los dos actos: el estado de la muestra dice qué toca.
  // Emitida → la deja Administración; en el counter → la recepciona Química.
  const resolverCodigo = useCallback(async (texto: string) => {
    const limpio = texto.trim()
    if (!limpio) return
    setBuscando(true)
    try {
      const r = await buscarMuestraPorCodigo(limpio)
      if ('error' in r) { setAviso(r.error!); return }
      const pendiente = r.odas.find(o => o.estado === 'ENTREGADA_LAB') ?? r.odas.find(o => o.estado === 'EMITIDA')
      if (!pendiente) { setAviso(`${r.set.codigo} ya fue recepcionada; no queda nada pendiente en el counter.`); return }
      const modo: Modo = pendiente.estado === 'EMITIDA' ? 'dejar' : 'recepcionar'
      const enLista = odas.find(o => o.id === pendiente.id)
      setFirma({
        modo,
        oda: enLista ?? {
          id: pendiente.id, codigo: r.set.codigo, odaNumero: pendiente.numero, estado: pendiente.estado,
          nombreComercial: r.set.nombreComercial, cliente: r.set.cliente, tipoMuestra: r.set.tipoMuestra,
          numeroMuestras: r.set.numeroMuestras, ensayos: pendiente.ensayos,
          fechaEntregaLab: pendiente.fechaEntregaLab, entregadaPor: null,
        },
      })
    } catch {
      setAviso('Sin conexión con el servidor. Inténtalo de nuevo.')
    } finally {
      setBuscando(false)
      setCodigo('')
    }
  }, [odas])

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#EAF4F4' }} onClick={enfocarLector}>
      <header className="flex items-center gap-3 px-5 py-3 bg-white border-b border-slate-200">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#13602C' }}>Q</div>
        <div className="flex-1">
          <p className="text-base font-bold text-slate-800 leading-tight">Counter de Química</p>
          <p className="text-xs text-slate-500">Recepción de muestras · Tablet: {tablet}</p>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/login' })} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 px-2 py-1">
          <LogOut className="w-4 h-4" />Salir
        </button>
      </header>

      {/* Campo de lectura: aquí "escribe" el lector de código de barras. */}
      <form
        onSubmit={e => { e.preventDefault(); resolverCodigo(codigo) }}
        className="mx-5 mt-4 bg-white rounded-2xl border-2 shadow-sm px-4 py-3 flex items-center gap-3"
        style={{ borderColor: '#13602C' }}
      >
        <ScanBarcode className="w-7 h-7 shrink-0" style={{ color: '#13602C' }} />
        <div className="flex-1">
          <label htmlFor="lector" className="block text-[11px] uppercase tracking-widest font-semibold text-slate-500">
            Lee el código de barras de la etiqueta, o escríbelo y pulsa Enter
          </label>
          <input
            id="lector"
            ref={lectorRef}
            autoFocus
            value={codigo}
            onChange={e => setCodigo(e.target.value)}
            onBlur={enfocarLector}
            placeholder="SET-0001-2026"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            disabled={buscando}
            className="w-full text-2xl font-mono tracking-wide text-slate-900 placeholder:text-slate-300 focus:outline-none bg-transparent py-1"
          />
        </div>
        <button
          type="submit"
          disabled={buscando || !codigo.trim()}
          className="px-4 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-40"
          style={{ backgroundColor: '#13602C' }}
        >
          {buscando ? 'Buscando…' : 'Buscar'}
        </button>
      </form>

      {aviso && (
        <div className="mx-5 mt-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3 text-sm font-medium flex items-center gap-2">
          <span className="flex-1">{aviso}</span>
          <button onClick={() => setAviso(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-5">
        {(['dejar', 'recepcionar'] as Modo[]).map(modo => (
          <Panel
            key={modo}
            modo={modo}
            odas={odas.filter(o => o.estado === MODO[modo].esperado)}
            onElegir={oda => setFirma({ modo, oda })}
          />
        ))}
      </main>

      {firma && (
        <FirmaPin
          modo={firma.modo}
          oda={firma.oda}
          onClose={() => { setFirma(null); enfocarLector() }}
          onHecho={() => { setFirma(null); router.refresh(); enfocarLector() }}
        />
      )}
    </div>
  )
}

function Panel({ modo, odas, onElegir }: {
  modo: Modo
  odas: OdaCounter[]
  onElegir: (o: OdaCounter) => void
}) {
  const cfg = MODO[modo]
  const Icono = cfg.icono

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-3" style={{ backgroundColor: cfg.fondo, borderBottom: `3px solid ${cfg.color}` }}>
        <Icono className="w-7 h-7" style={{ color: cfg.color }} />
        <div className="flex-1">
          <h2 className="text-xl font-bold" style={{ color: cfg.color }}>{cfg.titulo}</h2>
          <p className="text-xs text-slate-600">{cfg.quien} · {odas.length} pendiente{odas.length === 1 ? '' : 's'} · toca una fila o lee su código</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {odas.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-12">{cfg.vacio}</p>
        ) : odas.map(o => (
          <button
            key={o.id}
            onClick={e => { e.stopPropagation(); onElegir(o) }}
            className="w-full text-left rounded-xl border border-slate-200 hover:border-slate-400 active:scale-[0.99] transition px-4 py-3 bg-white"
          >
            <div className="flex items-baseline gap-3">
              <span className="font-mono font-bold text-lg text-slate-900">{o.codigo}</span>
              <span className="text-xs text-slate-400">ODA {o.odaNumero}</span>
              {modo === 'recepcionar' && (
                <span className="ml-auto text-xs font-medium" style={{ color: cfg.color }}>{haceCuanto(o.fechaEntregaLab)}</span>
              )}
            </div>
            <p className="text-sm font-medium text-slate-800 truncate">{o.nombreComercial ?? '—'}</p>
            <p className="text-xs text-slate-500 truncate">
              {o.cliente}
              {o.tipoMuestra ? ` · ${o.tipoMuestra}` : ''}
              {o.numeroMuestras ? ` · ${o.numeroMuestras} muestras` : ''}
            </p>
            <p className="text-xs text-slate-400 truncate">{o.ensayos.join(' · ')}</p>
            {modo === 'recepcionar' && o.entregadaPor && (
              <p className="text-[11px] text-slate-400 mt-0.5">Dejada por {o.entregadaPor}</p>
            )}
          </button>
        ))}
      </div>
    </section>
  )
}

function FirmaPin({ modo, oda, onClose, onHecho }: {
  modo: Modo
  oda: OdaCounter
  onClose: () => void
  onHecho: () => void
}) {
  const cfg = MODO[modo]
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [listo, setListo] = useState<string | null>(null)

  const enviar = useCallback(async (valor: string) => {
    setEnviando(true)
    setError(null)
    try {
      const accion = modo === 'dejar' ? dejarMuestraEnCounter : recepcionarMuestraEnCounter
      const r = await accion(oda.id, valor)
      if (!r.ok) {
        setError(r.error)
        setPin('')
        return
      }
      setListo(r.firmante.nombre)
      setTimeout(onHecho, 2500)
    } catch {
      setError('Sin conexión con el servidor. Inténtalo de nuevo.')
      setPin('')
    } finally {
      setEnviando(false)
    }
  }, [modo, oda.id, onHecho])

  const tecla = (d: string) => {
    if (enviando || listo) return
    const siguiente = (pin + d).slice(0, 4)
    setPin(siguiente)
    if (siguiente.length === 4) enviar(siguiente)
  }

  // Teclado físico además del numérico en pantalla. Mientras este modal está
  // abierto, lo que mande el lector no debe llegar al campo de lectura.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) { e.preventDefault(); tecla(e.key) }
      else if (e.key === 'Backspace') { e.preventDefault(); setPin(p => p.slice(0, -1)) }
      else if (e.key === 'Escape') onClose()
      else if (e.key === 'Enter') e.preventDefault()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="px-5 py-4" style={{ backgroundColor: cfg.fondo }}>
          <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: cfg.color }}>{cfg.verbo}</p>
          <p className="font-mono font-bold text-2xl text-slate-900">{oda.codigo}</p>
          <p className="text-sm text-slate-700 truncate">{oda.nombreComercial ?? oda.cliente}</p>
        </div>

        {listo ? (
          <div className="px-5 py-10 text-center">
            <CheckCircle2 className="w-14 h-14 mx-auto" style={{ color: cfg.color }} />
            <p className="mt-3 font-bold text-lg text-slate-900">{cfg.exito}</p>
            <p className="text-sm text-slate-600">Firmó {listo}</p>
          </div>
        ) : (
          <div className="px-5 py-4">
            <p className="text-sm text-slate-600 text-center mb-3">
              PIN de quien {modo === 'dejar' ? 'entrega' : 'recepciona'} ({cfg.quien})
            </p>
            <div className="flex justify-center gap-3 mb-4">
              {[0, 1, 2, 3].map(i => (
                <span key={i} className="w-4 h-4 rounded-full border-2" style={{ borderColor: cfg.color, backgroundColor: pin.length > i ? cfg.color : 'transparent' }} />
              ))}
            </div>
            {error && <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2 mb-3 text-center">{error}</p>}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                <Tecla key={d} onClick={() => tecla(d)} disabled={enviando}>{d}</Tecla>
              ))}
              <Tecla onClick={onClose} disabled={enviando} muted>Cancelar</Tecla>
              <Tecla onClick={() => tecla('0')} disabled={enviando}>0</Tecla>
              <Tecla onClick={() => setPin(p => p.slice(0, -1))} disabled={enviando} muted><Delete className="w-5 h-5 mx-auto" /></Tecla>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Tecla({ children, onClick, disabled, muted }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; muted?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-16 rounded-xl text-2xl font-semibold active:scale-95 transition disabled:opacity-50 ${
        muted ? 'bg-slate-100 text-slate-500 text-sm' : 'bg-slate-50 text-slate-900 border border-slate-200'
      }`}
    >
      {children}
    </button>
  )
}
