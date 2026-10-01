'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { PackageOpen, FlaskConical, ScanLine, Delete, CheckCircle2, X, LogOut, Keyboard } from 'lucide-react'
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
  const [escaner, setEscaner] = useState<Modo | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  // La tablet queda abierta todo el día: si la otra parte actúa desde su PC,
  // la pantalla se pone al día sola.
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 45_000)
    return () => clearInterval(t)
  }, [router])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 5000)
    return () => clearTimeout(t)
  }, [aviso])

  const resolverCodigo = useCallback(async (modo: Modo, texto: string) => {
    const r = await buscarMuestraPorCodigo(texto)
    if ('error' in r) { setAviso(r.error!); return }
    const cfg = MODO[modo]
    const candidata = r.odas.find(o => o.estado === cfg.esperado)
    if (!candidata) {
      const estados = r.odas.map(o => o.estado)
      setAviso(
        modo === 'dejar'
          ? (estados.includes('ENTREGADA_LAB') ? `${r.set.codigo} ya está en el counter.` : `${r.set.codigo} ya fue recepcionada.`)
          : (estados.includes('EMITIDA') ? `${r.set.codigo} todavía no la dejó Administración.` : `${r.set.codigo} ya fue recepcionada.`),
      )
      return
    }
    const enLista = odas.find(o => o.id === candidata.id)
    setFirma({
      modo,
      oda: enLista ?? {
        id: candidata.id, codigo: r.set.codigo, odaNumero: candidata.numero, estado: candidata.estado,
        nombreComercial: r.set.nombreComercial, cliente: r.set.cliente, tipoMuestra: r.set.tipoMuestra,
        numeroMuestras: r.set.numeroMuestras, ensayos: candidata.ensayos,
        fechaEntregaLab: candidata.fechaEntregaLab, entregadaPor: null,
      },
    })
  }, [odas])

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#EAF4F4' }}>
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

      {aviso && (
        <div className="mx-5 mt-4 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3 text-sm font-medium flex items-center gap-2">
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
            onEscanear={() => setEscaner(modo)}
            onCodigo={texto => resolverCodigo(modo, texto)}
          />
        ))}
      </main>

      {escaner && (
        <Escaner
          modo={escaner}
          onClose={() => setEscaner(null)}
          onLeido={texto => { setEscaner(null); resolverCodigo(escaner, texto) }}
        />
      )}

      {firma && (
        <FirmaPin
          modo={firma.modo}
          oda={firma.oda}
          onClose={() => setFirma(null)}
          onHecho={() => { setFirma(null); router.refresh() }}
        />
      )}
    </div>
  )
}

function Panel({ modo, odas, onElegir, onEscanear, onCodigo }: {
  modo: Modo
  odas: OdaCounter[]
  onElegir: (o: OdaCounter) => void
  onEscanear: () => void
  onCodigo: (texto: string) => void
}) {
  const cfg = MODO[modo]
  const Icono = cfg.icono
  const [texto, setTexto] = useState('')

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-3" style={{ backgroundColor: cfg.fondo, borderBottom: `3px solid ${cfg.color}` }}>
        <Icono className="w-7 h-7" style={{ color: cfg.color }} />
        <div className="flex-1">
          <h2 className="text-xl font-bold" style={{ color: cfg.color }}>{cfg.titulo}</h2>
          <p className="text-xs text-slate-600">{cfg.quien} · {odas.length} pendiente{odas.length === 1 ? '' : 's'}</p>
        </div>
        <button
          onClick={onEscanear}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-white font-semibold text-sm shadow"
          style={{ backgroundColor: cfg.color }}
        >
          <ScanLine className="w-5 h-5" />Escanear
        </button>
      </div>

      {/* Entrada para lector USB (escribe y envía Enter) o para tipear el código. */}
      <form
        onSubmit={e => { e.preventDefault(); if (texto.trim()) { onCodigo(texto); setTexto('') } }}
        className="px-5 py-3 border-b border-slate-100 flex items-center gap-2"
      >
        <Keyboard className="w-4 h-4 text-slate-400" />
        <input
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="o escribe / lee el código aquí y pulsa Enter"
          className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2"
          style={{ ['--tw-ring-color' as string]: cfg.color }}
          autoComplete="off"
        />
      </form>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {odas.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-12">{cfg.vacio}</p>
        ) : odas.map(o => (
          <button
            key={o.id}
            onClick={() => onElegir(o)}
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

function Escaner({ modo, onClose, onLeido }: { modo: Modo; onClose: () => void; onLeido: (t: string) => void }) {
  const cfg = MODO[modo]
  const [error, setError] = useState<string | null>(null)
  const leidoRef = useRef(false)

  useEffect(() => {
    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null
    let cancelado = false
    ;(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (cancelado) return
        const s = new Html5Qrcode('lector-qr')
        scanner = s
        await s.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          texto => {
            if (leidoRef.current) return
            leidoRef.current = true
            onLeido(texto)
          },
          () => {},
        )
      } catch (e) {
        setError(
          'No se pudo abrir la cámara. Revisa el permiso del navegador o escribe el código en el cuadro de texto.',
        )
        console.error(e)
      }
    })()
    return () => {
      cancelado = true
      if (scanner) scanner.stop().then(() => scanner?.clear()).catch(() => {})
    }
  }, [onLeido])

  return (
    <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        <div className="px-5 py-3 flex items-center gap-2" style={{ backgroundColor: cfg.fondo }}>
          <ScanLine className="w-5 h-5" style={{ color: cfg.color }} />
          <p className="font-bold" style={{ color: cfg.color }}>{cfg.titulo} · apunta al QR de la etiqueta</p>
          <button onClick={onClose} className="ml-auto p-1 text-slate-500"><X className="w-5 h-5" /></button>
        </div>
        <div id="lector-qr" className="w-full aspect-square bg-black" />
        {error && <p className="px-5 py-3 text-sm text-red-700 bg-red-50">{error}</p>}
      </div>
    </div>
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

  // Teclado físico (por si la tablet lo tiene) además del numérico en pantalla.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) tecla(e.key)
      else if (e.key === 'Backspace') setPin(p => p.slice(0, -1))
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
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
