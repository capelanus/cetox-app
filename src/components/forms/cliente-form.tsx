'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Cliente } from '@/generated/prisma/client'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { PAISES } from '@/lib/paises'
import { Search } from 'lucide-react'

/* ─── PaisSelector ─────────────────────────────────────────────────────────── */

function PaisSelector({ defaultValue = 'PE' }: { defaultValue?: string }) {
  const [query,    setQuery]    = useState('')
  const [open,     setOpen]     = useState(false)
  const [selected, setSelected] = useState(
    PAISES.find(p => p.codigo === defaultValue) ?? PAISES[0]
  )

  const filtrados = query.trim()
    ? PAISES.filter(p =>
        p.nombre.toLowerCase().includes(query.toLowerCase()) ||
        p.codigo.toLowerCase().includes(query.toLowerCase())
      )
    : PAISES

  return (
    <div className="relative">
      {/* Input oculto que envía el valor al form */}
      <input type="hidden" name="pais" value={selected.codigo} />

      {/* Botón trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 h-9 rounded-md border px-3 py-1 text-sm text-left transition-colors"
        style={{
          borderColor:     open ? '#4AC3B2' : '#e2e8f0',
          backgroundColor: 'white',
          boxShadow:       open ? '0 0 0 2px rgba(74,195,178,0.2)' : undefined,
        }}
      >
        <span className="text-base leading-none">{getFlagEmoji(selected.codigo)}</span>
        <span className="flex-1 truncate">{selected.nombre}</span>
        <span className="text-xs text-slate-400 flex-shrink-0">{selected.codigo}</span>
        <svg className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Overlay para cerrar */}
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setQuery('') }} />

          <div
            className="absolute z-20 mt-1 w-full rounded-lg border shadow-lg overflow-hidden"
            style={{ backgroundColor: 'white', borderColor: '#e2e8f0' }}
          >
            {/* Búsqueda */}
            <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: '#EAF4F4' }}>
              <Search className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#808080' }} />
              <input
                autoFocus
                type="text"
                placeholder="Buscar país..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="flex-1 text-sm outline-none bg-transparent"
                style={{ fontFamily: 'var(--font-montserrat)' }}
              />
            </div>

            {/* Lista */}
            <ul className="max-h-52 overflow-y-auto">
              {filtrados.length === 0 && (
                <li className="px-3 py-3 text-sm text-center" style={{ color: '#808080' }}>
                  Sin resultados
                </li>
              )}
              {filtrados.map(pais => {
                const isActive = pais.codigo === selected.codigo
                return (
                  <li key={pais.codigo}>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors"
                      style={{
                        backgroundColor: isActive ? '#DCF0E4' : 'transparent',
                        color:           isActive ? '#13602C' : '#000',
                        fontFamily:      'var(--font-montserrat)',
                      }}
                      onMouseEnter={e => {
                        if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = '#EAF4F4'
                      }}
                      onMouseLeave={e => {
                        if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                      }}
                      onClick={() => {
                        setSelected(pais)
                        setOpen(false)
                        setQuery('')
                      }}
                    >
                      <span className="text-base leading-none">{getFlagEmoji(pais.codigo)}</span>
                      <span className="flex-1">{pais.nombre}</span>
                      <span className="text-xs flex-shrink-0" style={{ color: '#808080' }}>{pais.prefijo}</span>
                      {isActive && (
                        <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#13602C' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

/** Convierte código ISO alpha-2 en emoji de bandera */
function getFlagEmoji(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 127397))
}

/* ─── ClienteForm ──────────────────────────────────────────────────────────── */

interface ClienteFormProps {
  action:   (formData: FormData) => Promise<void>
  cliente?: Cliente
}

export function ClienteForm({ action, cliente }: ClienteFormProps) {
  const ref = useRef<HTMLFormElement>(null)

  async function handleSubmit(formData: FormData) {
    try {
      await action(formData)
    } catch (e) {
      if ((e as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw e
      toast.error('Error al guardar el cliente')
    }
  }

  return (
    <form ref={ref} action={handleSubmit} className="space-y-5 bg-white p-6 rounded-xl border shadow-sm">
      <div className="grid grid-cols-2 gap-4">

        {/* Razón social */}
        <div className="col-span-2 space-y-2">
          <Label htmlFor="razonSocial">Razón social *</Label>
          <Input id="razonSocial" name="razonSocial" defaultValue={cliente?.razonSocial} required />
        </div>

        {/* RUC */}
        <div className="col-span-2 space-y-2">
          <Label htmlFor="ruc">RUC *</Label>
          <Input id="ruc" name="ruc" defaultValue={cliente?.ruc} required maxLength={11} />
        </div>

        {/* Dirección */}
        <div className="col-span-2 space-y-2">
          <Label htmlFor="direccion">Dirección *</Label>
          <Input id="direccion" name="direccion" defaultValue={cliente?.direccion} required />
        </div>

        {/* País */}
        <div className="col-span-2 space-y-2">
          <Label>País *</Label>
          <PaisSelector defaultValue={(cliente as (Cliente & { pais?: string }))?.pais ?? 'PE'} />
        </div>

        {/* Contacto */}
        <div className="space-y-2">
          <Label htmlFor="contacto">Persona de contacto</Label>
          <Input id="contacto" name="contacto" defaultValue={cliente?.contacto ?? ''} />
        </div>

        {/* Teléfono */}
        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" name="telefono" defaultValue={cliente?.telefono ?? ''} />
        </div>

        {/* Email */}
        <div className="col-span-2 space-y-2">
          <Label htmlFor="email">Email de contacto</Label>
          <Input id="email" name="email" type="text" defaultValue={cliente?.email ?? ''} />
          <p className="text-xs text-slate-400">Separar por comas si hay varios: email1@ejemplo.com, email2@ejemplo.com</p>
        </div>

      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" style={{ backgroundColor: '#13602C' }}>
          {cliente ? 'Guardar cambios' : 'Crear cliente'}
        </Button>
      </div>
    </form>
  )
}
