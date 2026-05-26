import { requireRol } from '@/lib/roles'
import { crearProveedor } from '@/app/actions/proveedores'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NuevoProveedorPage() {
  await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/operaciones/proveedores">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Volver</Button>
        </Link>
        <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>Nuevo Proveedor</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form action={crearProveedor} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social *</label>
              <input name="razonSocial" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RUC *</label>
              <input name="ruc" required maxLength={11} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rubro</label>
              <input name="rubro" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input name="direccion" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
              <input name="contacto" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input name="telefono" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="bg-[#13602C] hover:bg-[#0e4a21] text-white">Guardar proveedor</Button>
            <Link href="/operaciones/proveedores">
              <Button type="button" variant="outline">Cancelar</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
