'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X } from 'lucide-react'
import { PAISES } from '@/lib/paises'

const FORMA_CONTACTO_OPTIONS = [
  { value: 'EMAIL',      label: 'Email'      },
  { value: 'WHATSAPP',   label: 'WhatsApp'   },
  { value: 'TELEFONICA', label: 'Telefónica' },
  { value: 'PERSONAL',   label: 'Personal'   },
  { value: 'OTROS',      label: 'Otros'      },
]

interface ContactoFieldsProps {
  defaults?: {
    contactoNombre?: string | null
    contactoNombre2?: string | null
    contactoNombre3?: string | null
    contactoEmail?: string | null
    contactoEmail2?: string | null
    contactoEmail3?: string | null
    paisOrigen?: string | null
    contactoRuc?: string | null
    contactoTelefono?: string | null
    contactoTelefono2?: string | null
    contactoTelefono3?: string | null
    formaContacto?: string | null
    fechaContacto?: string | null
    horaContacto?: string | null
  }
}

// Campo que permite varios valores; cada slot tiene su propio name de formulario.
function CampoMultiple({ label, names, valores, placeholder, note, minVisible = 1 }: {
  label: string; names: string[]; valores: (string | null | undefined)[]; placeholder: string; note?: string; minVisible?: number
}) {
  const [vals, setVals] = useState<string[]>(() => names.map((_, i) => valores[i] ?? ''))
  const usados = vals.filter(Boolean).length
  const [visibles, setVisibles] = useState<number>(Math.min(names.length, Math.max(minVisible, usados)))
  const set = (i: number, v: string) => setVals(prev => prev.map((x, j) => (j === i ? v : x)))

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {Array.from({ length: visibles }).map((_, i) => (
        <div key={i} className="flex gap-2">
          <Input name={names[i]} value={vals[i]} onChange={(e) => set(i, e.target.value)} placeholder={placeholder} className="flex-1" />
          {i + 1 > minVisible && i + 1 === visibles && (
            <button type="button" onClick={() => { set(i, ''); setVisibles(v => v - 1) }}
              className="h-9 w-9 flex items-center justify-center rounded-md border border-input text-slate-400 hover:text-red-500 shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      {/* Inputs ocultos para conservar el name aunque el slot no esté visible (limpia valores retirados) */}
      {names.slice(visibles).map((n) => <input key={n} type="hidden" name={n} value="" />)}
      {visibles < names.length && (
        <button type="button" onClick={() => setVisibles(v => v + 1)}
          className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800">
          <Plus className="w-3.5 h-3.5" /> Agregar otro
        </button>
      )}
      {note && <p className="text-xs text-slate-400">{note}</p>}
    </div>
  )
}

export function ContactoFields({ defaults = {} }: ContactoFieldsProps) {
  const [ruc, setRuc] = useState(defaults.contactoRuc ?? '')
  const [formaContacto, setFormaContacto] = useState(defaults.formaContacto ?? '')
  const [fecha, setFecha] = useState(defaults.fechaContacto ?? new Date().toISOString().split('T')[0])
  const [hora, setHora] = useState(defaults.horaContacto ?? '')
  const [pais, setPais] = useState(defaults.paisOrigen ?? 'PE')

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 1. Contactos (hasta 3) */}
      <CampoMultiple
        label="Nombre del contacto"
        names={['contactoNombre', 'contactoNombre2', 'contactoNombre3']}
        valores={[defaults.contactoNombre, defaults.contactoNombre2, defaults.contactoNombre3]}
        placeholder="Nombre completo"
      />

      {/* 2. Emails (hasta 3) */}
      <CampoMultiple
        label="Email del contacto"
        names={['contactoEmail', 'contactoEmail2', 'contactoEmail3']}
        valores={[defaults.contactoEmail, defaults.contactoEmail2, defaults.contactoEmail3]}
        placeholder="correo@empresa.com"
        note="Puedes agregar hasta 3 correos."
      />

      {/* 3. País */}
      <div className="space-y-2">
        <Label>País</Label>
        <select
          name="paisOrigen"
          value={pais}
          onChange={(e) => setPais(e.target.value)}
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        >
          {PAISES.map((p) => (
            <option key={p.codigo} value={p.codigo}>{p.nombre}</option>
          ))}
        </select>
      </div>

      {/* 4. RUC (opcional) */}
      <div className="space-y-2">
        <Label>RUC / Documento <span className="text-slate-400 font-normal">(opcional)</span></Label>
        <Input
          name="contactoRuc"
          value={ruc}
          onChange={(e) => setRuc(e.target.value)}
          placeholder="20330791501"
        />
      </div>

      {/* 5. Teléfonos (hasta 3) */}
      <CampoMultiple
        label="Teléfono"
        names={['contactoTelefono', 'contactoTelefono2', 'contactoTelefono3']}
        valores={[defaults.contactoTelefono, defaults.contactoTelefono2, defaults.contactoTelefono3]}
        placeholder="+51 999 999 999"
        note="Puedes agregar hasta 3 teléfonos. Incluye el código de país (ej. +51)."
      />

      {/* 7. Forma de contacto */}
      <div className="space-y-2">
        <Label>Forma de contacto</Label>
        <select
          name="formaContacto"
          value={formaContacto}
          onChange={(e) => setFormaContacto(e.target.value)}
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        >
          <option value="">Seleccionar...</option>
          {FORMA_CONTACTO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* 8. Fecha de contacto */}
      <div className="space-y-2">
        <Label>Fecha de contacto</Label>
        <Input
          name="fechaContacto"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>

      {/* 9. Hora */}
      <div className="space-y-2">
        <Label>Hora</Label>
        <Input
          name="horaContacto"
          type="time"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
        />
      </div>
    </div>
  )
}
