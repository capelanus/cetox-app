'use client'

import { useState, useTransition } from 'react'
import { KeyRound, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { asignarPin, quitarPin } from '@/app/actions/gerencia'

// PIN de 4 dígitos con el que la persona firma en la tablet del counter.
export function PinCounter({ usuarioId, tienePin }: { usuarioId: string; tienePin: boolean }) {
  const [editando, setEditando] = useState(false)
  const [pin, setPin] = useState('')
  const [pending, start] = useTransition()

  function guardar() {
    if (!/^\d{4}$/.test(pin)) { toast.error('El PIN son 4 dígitos'); return }
    start(async () => {
      try {
        const r = await asignarPin(usuarioId, pin)
        toast.success(`PIN asignado a ${r.nombre}`)
        setEditando(false)
        setPin('')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'No se pudo asignar el PIN')
      }
    })
  }

  function quitar() {
    start(async () => {
      try {
        const r = await quitarPin(usuarioId)
        toast.success(`PIN retirado a ${r.nombre}`)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'No se pudo retirar el PIN')
      }
    })
  }

  if (editando) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          onKeyDown={e => { if (e.key === 'Enter') guardar(); if (e.key === 'Escape') setEditando(false) }}
          placeholder="4 dígitos"
          className="w-24 border border-slate-300 rounded-md px-2 py-1 text-xs font-mono tracking-widest text-center"
        />
        <button onClick={guardar} disabled={pending} className="px-2.5 py-1 rounded-md text-xs font-bold text-white" style={{ backgroundColor: '#13602C' }}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Guardar'}
        </button>
        <button onClick={() => { setEditando(false); setPin('') }} className="text-xs text-slate-400 hover:text-slate-600">Cancelar</button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
        style={tienePin ? { backgroundColor: '#dcfce7', color: '#15803d' } : { backgroundColor: '#f1f5f9', color: '#94a3b8' }}
        title="PIN para firmar en la tablet del counter"
      >
        <KeyRound className="h-3 w-3" />{tienePin ? 'PIN ••••' : 'Sin PIN'}
      </span>
      <button onClick={() => setEditando(true)} disabled={pending} className="text-xs text-[#13602C] hover:underline">
        {tienePin ? 'Cambiar' : 'Asignar'}
      </button>
      {tienePin && (
        <button onClick={quitar} disabled={pending} className="text-xs text-slate-400 hover:text-red-600">Quitar</button>
      )}
    </div>
  )
}
