import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { actualizarProveedor } from '@/app/actions/proveedores'

export default async function ProveedorDetallePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  const { id } = await params
  const proveedor = await prisma.proveedor.findUnique({
    where: { id },
    include: {
      cotizacionesProveedor: { orderBy: { createdAt: 'desc' }, take: 5, include: { requerimiento: true } },
      ordenesCompra: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })
  if (!proveedor) notFound()

  const update = actualizarProveedor.bind(null, id)

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/operaciones/proveedores">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Volver</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>{proveedor.razonSocial}</h1>
          <p className="text-sm text-gray-500">RUC: {proveedor.ruc}</p>
        </div>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${proveedor.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {proveedor.activo ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-700 mb-4">Datos del proveedor</h2>
        <form action={update} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social *</label>
              <input name="razonSocial" required defaultValue={proveedor.razonSocial} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RUC *</label>
              <input name="ruc" required defaultValue={proveedor.ruc} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rubro</label>
              <input name="rubro" defaultValue={proveedor.rubro || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input name="direccion" defaultValue={proveedor.direccion || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
              <input name="contacto" defaultValue={proveedor.contacto || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input name="telefono" defaultValue={proveedor.telefono || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" defaultValue={proveedor.email || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
          </div>
          <Button type="submit" className="bg-[#13602C] hover:bg-[#0e4a21] text-white">Guardar cambios</Button>
        </form>
      </div>

      {/* Recent cotizaciones */}
      {proveedor.cotizacionesProveedor.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-700">Últimas cotizaciones</div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Requerimiento</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Total</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {proveedor.cotizacionesProveedor.map(cot => (
                <tr key={cot.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link href={`/operaciones/cotizaciones-proveedor/${cot.id}`} className="text-[#13602C] hover:underline">
                      {cot.requerimiento.descripcion.substring(0, 40)}...
                    </Link>
                  </td>
                  <td className="px-4 py-2 font-mono">{cot.moneda} {cot.total.toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cot.estado === 'APROBADA' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {cot.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
