'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PAISES } from '@/lib/paises'

const FORMA_CONTACTO_OPTIONS = [
  { value: 'EMAIL',     label: 'Email'      },
  { value: 'WHATSAPP',  label: 'WhatsApp'   },
  { value: 'TELEFONICA',label: 'Telefónica' },
  { value: 'PERSONAL',  label: 'Personal'   },
  { value: 'OTROS',     label: 'Otros'      },
]

interface ContactoFieldsProps {
  defaults?: {
    contactoNombre?: string | null
    contactoEmail?: string | null
    paisOrigen?: string | null
    contactoRuc?: string | null
    contactoTelefono?: string | null
    formaContacto?: string | null
    fechaContacto?: string | null
    horaContacto?: string | null
  }
}

export function ContactoFields({ defaults = {} }: ContactoFieldsProps) {
  const [pais, setPais] = useState(defaults.paisOrigen ?? 'PE')
  const [prefijo, setPrefijo] = useState('')
  const [telefono, setTelefono] = useState(defaults.contactoTelefono ?? '')

  useEffect(() => {
    const found = PAISES.find((p) => p.codigo === pais)
    const nuevoPrefijo = found?.prefijo ?? '+'
    setPrefijo(nuevoPrefijo)
    // Si el teléfono actual empieza con un prefijo anterior, lo reemplaza
    setTelefono((prev) => {
      if (!prev || prev === nuevoPrefijo) return nuevoPrefijo + ' '
      // Si ya tenía un prefijo diferente, reemplázalo
      const sinPrefijo = prev.replace(/^\+[\d-]+ ?/, '')
      return nuevoPrefijo + ' ' + sinPrefijo
    })
  }, [pais])

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 1. Nombre del contacto */}
      <div className="space-y-2">
        <Label>Nombre del contacto</Label>
        <Input
          name="contactoNombre"
          defaultValue={defaults.contactoNombre ?? ''}
          placeholder="Nombre completo"
        />
      </div>

      {/* 2. Email del contacto */}
      <div className="space-y-2">
        <Label>Email del contacto</Label>
        <Input
          name="contactoEmail"
          type="email"
          defaultValue={defaults.contactoEmail ?? ''}
          placeholder="correo@empresa.com"
        />
      </div>

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
          defaultValue={defaults.contactoRuc ?? ''}
          placeholder="20330791501"
        />
      </div>

      {/* 5. Teléfono con prefijo */}
      <div className="space-y-2">
        <Label>Teléfono</Label>
        <div className="flex gap-2">
          <div className="flex items-center h-9 px-3 rounded-md border border-input bg-slate-50 text-sm font-mono text-slate-600 shrink-0">
            {prefijo || '+'}
          </div>
          <Input
            name="contactoTelefono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder={prefijo + ' 999 999 999'}
            className="flex-1"
          />
        </div>
      </div>

      {/* 6. Forma de contacto */}
      <div className="space-y-2">
        <Label>Forma de contacto</Label>
        <select
          name="formaContacto"
          defaultValue={defaults.formaContacto ?? ''}
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        >
          <option value="">Seleccionar...</option>
          {FORMA_CONTACTO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* 7. Fecha de contacto */}
      <div className="space-y-2">
        <Label>Fecha de contacto</Label>
        <Input
          name="fechaContacto"
          type="date"
          defaultValue={defaults.fechaContacto ?? new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* 8. Hora */}
      <div className="space-y-2">
        <Label>Hora</Label>
        <Input
          name="horaContacto"
          type="time"
          defaultValue={defaults.horaContacto ?? ''}
        />
      </div>
    </div>
  )
}
