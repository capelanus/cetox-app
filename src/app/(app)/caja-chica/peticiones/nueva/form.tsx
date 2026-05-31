'use client'

import { useTransition, useState } from 'react'
import { crearPeticion } from '@/app/actions/peticiones'
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'

export function NuevaPeticionForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError]             = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await crearPeticion(formData)
        // redirect happens inside crearPeticion on success
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al crear la petición'
        // NEXT_REDIRECT is not a real error — it means the redirect fired correctly
        if (msg.includes('NEXT_REDIRECT')) return
        setError(msg)
        toast.error(msg)
      }
    })
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 4,
    fontFamily: 'var(--font-montserrat)',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 8,
    border: '1.5px solid #d1d5db',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.15s ease',
    backgroundColor: '#fff',
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        backgroundColor: '#fff',
        borderRadius: 14,
        border: '1px solid #e5e7eb',
        padding: 28,
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      }}
    >
      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-lg text-sm"
          style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' }}
        >
          {error}
        </div>
      )}

      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>
          Concepto <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <input
          name="concepto"
          type="text"
          required
          placeholder="Ej. Compra de útiles de oficina"
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = '#4AC3B2')}
          onBlur={e => (e.target.style.borderColor = '#d1d5db')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
        <div>
          <label style={labelStyle}>
            Monto <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            name="monto"
            type="number"
            min="0.01"
            step="0.01"
            required
            placeholder="0.00"
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = '#4AC3B2')}
            onBlur={e => (e.target.style.borderColor = '#d1d5db')}
          />
        </div>
        <div>
          <label style={labelStyle}>Moneda</label>
          <select
            name="moneda"
            defaultValue="PEN"
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = '#4AC3B2')}
            onBlur={e => (e.target.style.borderColor = '#d1d5db')}
          >
            <option value="PEN">Soles (PEN)</option>
            <option value="USD">Dólares (USD)</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Justificación</label>
        <textarea
          name="justificacion"
          rows={3}
          placeholder="Describe brevemente el motivo de la solicitud…"
          style={{ ...inputStyle, resize: 'vertical' }}
          onFocus={e => (e.target.style.borderColor = '#4AC3B2')}
          onBlur={e => (e.target.style.borderColor = '#d1d5db')}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ backgroundColor: '#13602C' }}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isPending ? 'Enviando…' : 'Enviar Petición'}
        </button>
      </div>
    </form>
  )
}
