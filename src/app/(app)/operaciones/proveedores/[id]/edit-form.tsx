'use client'

import { useState } from 'react'
import { actualizarProveedor } from '@/app/actions/proveedores'
import { ChevronDown, ChevronUp, Save } from 'lucide-react'

interface Props {
  proveedor: {
    id: string
    razonSocial: string
    ruc: string
    especialidad: string
    direccion: string
    contacto: string
    telefono: string
    telefono2: string
    telefono3: string
    email: string
    email2: string
    email3: string
    cuentaBancaria: string
  }
}

const INPUT = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]'

export default function ProveedorEditForm({ proveedor }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const actualizar = actualizarProveedor.bind(null, proveedor.id)

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    await actualizar(formData)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-700">Editar datos del proveedor</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <form action={handleSubmit} className="px-5 pb-6 pt-4 border-t border-gray-100 space-y-5">
          {/* Datos generales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social *</label>
              <input name="razonSocial" required defaultValue={proveedor.razonSocial} className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RUC</label>
              <input name="ruc" defaultValue={proveedor.ruc} maxLength={11} className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad / Rubro</label>
              <input name="especialidad" defaultValue={proveedor.especialidad} className={INPUT} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input name="direccion" defaultValue={proveedor.direccion} className={INPUT} />
            </div>
          </div>

          {/* Teléfonos */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Teléfonos</p>
            <div className="grid grid-cols-3 gap-3">
              <input name="telefono"  defaultValue={proveedor.telefono}  placeholder="Teléfono 1" className={INPUT} />
              <input name="telefono2" defaultValue={proveedor.telefono2} placeholder="Teléfono 2" className={INPUT} />
              <input name="telefono3" defaultValue={proveedor.telefono3} placeholder="Teléfono 3" className={INPUT} />
            </div>
          </div>

          {/* Emails */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Emails</p>
            <div className="grid grid-cols-3 gap-3">
              <input name="email"  type="email" defaultValue={proveedor.email}  placeholder="Email 1" className={INPUT} />
              <input name="email2" type="email" defaultValue={proveedor.email2} placeholder="Email 2" className={INPUT} />
              <input name="email3" type="email" defaultValue={proveedor.email3} placeholder="Email 3" className={INPUT} />
            </div>
          </div>

          {/* Cuenta bancaria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Bancaria</label>
            <textarea
              name="cuentaBancaria"
              defaultValue={proveedor.cuentaBancaria}
              rows={2}
              placeholder="Ej: BCP (S/): 191-XXXXXXX / CCI: XXXXXX"
              className={INPUT + ' resize-none'}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[#13602C] text-white hover:bg-[#0e4a21] disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      )}
    </div>
  )
}
