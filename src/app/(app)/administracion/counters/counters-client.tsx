'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Tablet, KeyRound, ExternalLink, ClipboardList, Loader2, Power, Plus } from 'lucide-react'
import type { Lab } from '@/lib/counters'
import { crearCuentaCounter, cambiarPasswordCounter, toggleCuentaCounter } from '@/app/actions/counters-admin'
import { PinCounter } from '@/components/pin-counter'
import { ROL_LABELS, AREA_LABELS } from '@/lib/constants'

export interface CuentaCounter { id: string; email: string; nombre: string; activo: boolean; creada: string }
export interface PersonaPin {
  id: string; nombre: string; email: string; rol: string; area: string | null; esJefeLab: boolean; tienePin: boolean; esYo: boolean
}

const inputCls = 'w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]/30'
const btnCls = 'px-3 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50'

export function CountersClient({ labs, cuentas, personas }: {
  labs: Lab[]
  cuentas: Record<string, CuentaCounter | null>
  personas: PersonaPin[]
}) {
  const entregan = personas.filter(p => p.rol !== 'ANALISTA')
  const porLab = (area: string) => personas.filter(p => p.rol === 'ANALISTA' && p.area === area)
  const sinArea = personas.filter(p => p.rol === 'ANALISTA' && !p.area)

  return (
    <div className="space-y-8">
      {/* ── Cuentas de tablet ─────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
          <Tablet className="w-4 h-4" /> Cuentas de las tablets
        </h2>
        <p className="text-xs text-slate-500 mb-3">
          Una por mostrador. La tablet queda con esta sesión abierta y solo puede ver su counter; nunca firma: las firmas son los PIN de las personas.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {labs.map(lab => <TarjetaLab key={lab.slug} lab={lab} cuenta={cuentas[lab.area]} />)}
        </div>
      </section>

      {/* ── PIN del personal ───────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
          <KeyRound className="w-4 h-4" /> PIN del personal
        </h2>
        <p className="text-xs text-slate-500 mb-3">
          4 dígitos, distintos por persona. Quien deja la muestra firma con PIN de Administración; quien la recepciona, con PIN de analista de ese laboratorio.
        </p>

        <GrupoPin titulo="Dejan muestras en el counter (Administración y Calidad)" personas={entregan} />
        {labs.map(lab => (
          <GrupoPin key={lab.slug} titulo={`Recepcionan en ${lab.nombre} (analistas)`} personas={porLab(lab.area)} />
        ))}
        {sinArea.length > 0 && <GrupoPin titulo="Analistas sin área asignada (no pueden recepcionar hasta tener área)" personas={sinArea} />}
      </section>
    </div>
  )
}

function TarjetaLab({ lab, cuenta }: { lab: Lab; cuenta: CuentaCounter | null }) {
  const [pending, start] = useTransition()
  const [modo, setModo] = useState<'ver' | 'crear' | 'password'>(cuenta ? 'ver' : 'ver')
  const [password, setPassword] = useState('')

  function crear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => {
      const r = await crearCuentaCounter(fd).catch(() => ({ ok: false as const, error: 'Sin conexión con el servidor' }))
      if (!r.ok) { toast.error(r.error); return }
      toast.success(`Cuenta del counter de ${lab.nombre} creada: ${r.email}`)
      setModo('ver')
    })
  }

  function cambiarPassword() {
    if (!cuenta) return
    start(async () => {
      const r = await cambiarPasswordCounter(cuenta.id, password).catch(() => ({ ok: false as const, error: 'Sin conexión con el servidor' }))
      if (!r.ok) { toast.error(r.error); return }
      toast.success('Contraseña actualizada; la tablet debe volver a iniciar sesión')
      setPassword('')
      setModo('ver')
    })
  }

  function toggle() {
    if (!cuenta) return
    start(async () => {
      const r = await toggleCuentaCounter(cuenta.id, !cuenta.activo).catch(() => ({ ok: false as const, error: 'Sin conexión con el servidor' }))
      if (!r.ok) { toast.error(r.error); return }
      toast.success(cuenta.activo ? 'Counter desactivado' : 'Counter activado')
    })
  }

  return (
    <div className="cetox-card p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#13602C' }}>{lab.area}</div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800">Counter de {lab.nombre}</p>
          {cuenta ? (
            <p className="text-xs text-slate-500 truncate">{cuenta.email}</p>
          ) : (
            <p className="text-xs text-slate-400 italic">Sin cuenta todavía</p>
          )}
        </div>
        {cuenta && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={cuenta.activo ? { backgroundColor: '#dcfce7', color: '#15803d' } : { backgroundColor: '#fee2e2', color: '#b91c1c' }}>
            {cuenta.activo ? 'Activa' : 'Desactivada'}
          </span>
        )}
      </div>

      {!cuenta && modo !== 'crear' && (
        <button onClick={() => setModo('crear')} className={`${btnCls} flex items-center justify-center gap-1.5`} style={{ backgroundColor: '#13602C' }}>
          <Plus className="w-4 h-4" /> Crear cuenta de tablet
        </button>
      )}

      {!cuenta && modo === 'crear' && (
        <form onSubmit={crear} className="space-y-2">
          <input type="hidden" name="area" value={lab.area} />
          <input name="email" type="email" required placeholder={`counter.${lab.slug}@cetox.com.pe`} className={inputCls} />
          <input name="nombre" placeholder={`Tablet Counter ${lab.nombre}`} className={inputCls} />
          <input name="password" type="text" required minLength={8} placeholder="Contraseña (mínimo 8 caracteres)" className={inputCls} autoComplete="new-password" />
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className={btnCls} style={{ backgroundColor: '#13602C' }}>
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear'}
            </button>
            <button type="button" onClick={() => setModo('ver')} className="text-sm text-slate-500 hover:text-slate-800">Cancelar</button>
          </div>
        </form>
      )}

      {cuenta && modo === 'ver' && (
        <div className="flex flex-wrap gap-2 text-sm">
          <button onClick={() => setModo('password')} className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50">Cambiar contraseña</button>
          <button onClick={toggle} disabled={pending} className={`px-3 py-1.5 rounded-md border flex items-center gap-1 ${cuenta.activo ? 'border-red-300 text-red-700 hover:bg-red-50' : 'border-green-300 text-green-700 hover:bg-green-50'}`}>
            <Power className="w-3.5 h-3.5" />{cuenta.activo ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      )}

      {cuenta && modo === 'password' && (
        <div className="space-y-2">
          <input type="text" value={password} onChange={e => setPassword(e.target.value)} minLength={8} placeholder="Nueva contraseña (mínimo 8)" className={inputCls} autoComplete="new-password" />
          <div className="flex gap-2">
            <button onClick={cambiarPassword} disabled={pending || password.length < 8} className={btnCls} style={{ backgroundColor: '#13602C' }}>
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
            </button>
            <button onClick={() => { setModo('ver'); setPassword('') }} className="text-sm text-slate-500 hover:text-slate-800">Cancelar</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-xs pt-2 border-t border-slate-100">
        <Link href={`/counter/${lab.slug}`} target="_blank" className="inline-flex items-center gap-1 text-[#13602C] hover:underline">
          <ExternalLink className="w-3 h-3" /> Abrir counter
        </Link>
        <Link href={`/entregas/${lab.slug}`} className="inline-flex items-center gap-1 text-[#13602C] hover:underline">
          <ClipboardList className="w-3 h-3" /> Registro de entregas
        </Link>
      </div>
    </div>
  )
}

function GrupoPin({ titulo, personas }: { titulo: string; personas: PersonaPin[] }) {
  return (
    <div className="cetox-card overflow-hidden mb-4">
      <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <p className="text-sm font-semibold text-slate-700">{titulo}</p>
        <p className="text-xs text-slate-400">{personas.filter(p => p.tienePin).length} de {personas.length} con PIN</p>
      </div>
      {personas.length === 0 ? (
        <p className="px-5 py-4 text-sm text-slate-400">Nadie en este grupo.</p>
      ) : (
        <div className="divide-y divide-slate-50">
          {personas.map(p => (
            <div key={p.id} className="flex items-center gap-4 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {p.nombre}
                  {p.esJefeLab && <span className="ml-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Jefe de lab</span>}
                  {p.esYo && <span className="ml-2 text-[10px] text-slate-400">(tú)</span>}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {ROL_LABELS[p.rol] ?? p.rol}{p.area ? ` · ${AREA_LABELS[p.area] ?? p.area}` : ''} · {p.email}
                </p>
              </div>
              <PinCounter usuarioId={p.id} tienePin={p.tienePin} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
