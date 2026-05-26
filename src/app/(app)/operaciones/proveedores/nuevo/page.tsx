import { requireOperaciones } from '@/lib/roles'
import { crearProveedor } from '@/app/actions/proveedores'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

const INPUT = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]'

export default async function NuevoProveedorPage() {
  await requireOperaciones()

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/operaciones/proveedores">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Volver</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Nuevo Proveedor
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Registra una nueva empresa proveedora</p>
        </div>
      </div>

      <form action={crearProveedor} className="space-y-5">
        {/* Datos generales */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700">Datos generales</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social *</label>
              <input name="razonSocial" required placeholder="Nombre completo de la empresa" className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RUC</label>
              <input name="ruc" maxLength={11} placeholder="20XXXXXXXXX" className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad / Rubro</label>
              <input name="especialidad" placeholder="Ej: Reactivos y equipos de laboratorio" className={INPUT} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input name="direccion" placeholder="Dirección completa" className={INPUT} />
            </div>
          </div>
        </div>

        {/* Teléfonos */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700">Teléfonos de contacto</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono 1</label>
              <input name="telefono" placeholder="Ej: 999 123 456" className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono 2</label>
              <input name="telefono2" placeholder="Opcional" className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono 3</label>
              <input name="telefono3" placeholder="Opcional" className={INPUT} />
            </div>
          </div>
        </div>

        {/* Emails */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700">Emails de contacto</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email 1</label>
              <input name="email" type="email" placeholder="ventas@empresa.com" className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email 2</label>
              <input name="email2" type="email" placeholder="Opcional" className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email 3</label>
              <input name="email3" type="email" placeholder="Opcional" className={INPUT} />
            </div>
          </div>
        </div>

        {/* Cuenta bancaria */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700">Datos bancarios</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Bancaria</label>
            <textarea
              name="cuentaBancaria"
              rows={2}
              placeholder="Ej: BCP (S/): 191-XXXXXXX-0-XX / CCI: 00219XXXXXXXXXXX"
              className={INPUT + ' resize-none'}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" className="bg-[#13602C] hover:bg-[#0e4a21] text-white">
            Guardar proveedor
          </Button>
          <Link href="/operaciones/proveedores">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
