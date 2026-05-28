import { requireOperaciones } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Building2, Search } from 'lucide-react'
import ProveedoresFilters from './filters-client'

export default async function ProveedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; especialidad?: string; estado?: string; producto?: string }>
}) {
  await requireOperaciones()

  const { q, especialidad, estado, producto } = await searchParams

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (q) {
    where.OR = [
      { razonSocial:  { contains: q, mode: 'insensitive' } },
      { ruc:          { contains: q, mode: 'insensitive' } },
      { especialidad: { contains: q, mode: 'insensitive' } },
      { email:        { contains: q, mode: 'insensitive' } },
    ]
  }
  if (especialidad) where.especialidad = { contains: especialidad, mode: 'insensitive' }
  if (producto) where.productosTexto = { contains: producto, mode: 'insensitive' }
  if (estado === 'activo')   where.activo = true
  if (estado === 'inactivo') where.activo = false

  const proveedores = await prisma.proveedor.findMany({
    where,
    orderBy: { razonSocial: 'asc' },
    include: {
      _count: { select: { ordenesCompra: true } },
    },
  })

  // KPIs (global, sin filtros)
  const [total, activos] = await Promise.all([
    prisma.proveedor.count(),
    prisma.proveedor.count({ where: { activo: true } }),
  ])

  // Unique especialidades for filter
  const especialidades = await prisma.proveedor.findMany({
    where: { especialidad: { not: null } },
    select: { especialidad: true },
    distinct: ['especialidad'],
    orderBy: { especialidad: 'asc' },
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Proveedores
          </h1>
          <p className="text-gray-500 text-sm mt-1">Directorio de empresas proveedoras</p>
        </div>
        <Link href="/operaciones/proveedores/nuevo">
          <Button className="bg-[#13602C] hover:bg-[#0e4a21] text-white">
            <Plus className="w-4 h-4 mr-2" />Nuevo proveedor
          </Button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
          <p className="text-3xl font-bold text-[#13602C] mt-1">{total}</p>
          <p className="text-xs text-gray-400 mt-1">proveedores registrados</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Activos</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{activos}</p>
          <p className="text-xs text-gray-400 mt-1">habilitados para operar</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Inactivos</p>
          <p className="text-3xl font-bold text-gray-400 mt-1">{total - activos}</p>
          <p className="text-xs text-gray-400 mt-1">deshabilitados</p>
        </div>
      </div>

      {/* Filters */}
      <ProveedoresFilters
        especialidades={especialidades.map(e => e.especialidad!).filter(Boolean)}
        currentQ={q}
        currentEspecialidad={especialidad}
        currentEstado={estado}
        currentProducto={producto}
      />

      {/* Table */}
      {proveedores.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center py-16 gap-3">
          <Building2 className="w-10 h-10 text-gray-300" />
          <p className="text-gray-500 font-medium">No se encontraron proveedores</p>
          <p className="text-gray-400 text-sm">Ajusta los filtros o agrega un nuevo proveedor</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Razón Social</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">RUC</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Especialidad</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Contacto</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">OC</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {proveedores.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/operaciones/proveedores/${p.id}`} className="font-medium text-[#13602C] hover:underline">
                      {p.razonSocial}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.ruc ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px]">
                    {p.especialidad
                      ? <span className="line-clamp-1 text-xs">{p.especialidad}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="text-xs space-y-0.5">
                      {p.telefono && <p>{p.telefono}</p>}
                      {p.email    && <p className="text-blue-600 truncate max-w-[160px]">{p.email}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-gray-700">{p._count.ordenesCompra}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/operaciones/proveedores/${p.id}`} className="text-[#13602C] hover:text-[#0e4a21] font-medium text-xs">
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {proveedores.length} proveedor{proveedores.length !== 1 ? 'es' : ''}
            {(q || especialidad || estado || producto) ? ` (filtrado de ${total})` : ''}
          </div>
        </div>
      )}
    </div>
  )
}
