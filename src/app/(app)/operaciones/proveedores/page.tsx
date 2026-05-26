import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function ProveedoresPage() {
  await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])
  const proveedores = await prisma.proveedor.findMany({ orderBy: { razonSocial: 'asc' } })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>Proveedores</h1>
          <p className="text-gray-500 text-sm">{proveedores.length} proveedor(es) registrado(s)</p>
        </div>
        <Link href="/operaciones/proveedores/nuevo">
          <Button className="bg-[#13602C] hover:bg-[#0e4a21] text-white">
            <Plus className="w-4 h-4 mr-2" />Nuevo proveedor
          </Button>
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Razón Social</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">RUC</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Rubro</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {proveedores.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/operaciones/proveedores/${p.id}`} className="font-medium text-[#13602C] hover:underline">
                    {p.razonSocial}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{p.ruc}</td>
                <td className="px-4 py-3 text-gray-600">{p.rubro || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{p.email || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
            {proveedores.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">No hay proveedores registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
