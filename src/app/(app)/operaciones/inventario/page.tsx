import { requireOperaciones } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Package, Plus, AlertTriangle } from 'lucide-react'
import InventarioSearchClient from './search-client'

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; alerta?: string }>
}) {
  await requireOperaciones()

  const { q, categoria, alerta } = await searchParams

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { activo: true }

  if (q) {
    where.OR = [
      { descripcion: { contains: q, mode: 'insensitive' } },
      { codOrden:    { contains: q, mode: 'insensitive' } },
    ]
  }

  if (categoria) {
    where.categoria = categoria
  }

  const items = await prisma.inventarioItem.findMany({
    where,
    orderBy: { descripcion: 'asc' },
  })

  // Filter by alerta (stock bajo) in memory
  const filteredItems = alerta === '1'
    ? items.filter(i => i.stockMinimo !== null && i.stock <= i.stockMinimo)
    : items

  // Get all unique categories for filter
  const categorias = await prisma.inventarioItem.findMany({
    where: { activo: true, categoria: { not: null } },
    select: { categoria: true },
    distinct: ['categoria'],
    orderBy: { categoria: 'asc' },
  })

  // KPIs
  const total    = await prisma.inventarioItem.count({ where: { activo: true } })
  const allItems = await prisma.inventarioItem.findMany({
    where: { activo: true },
    select: { stock: true, stockMinimo: true },
  })
  const alertaCount = allItems.filter(i => i.stockMinimo !== null && i.stock <= i.stockMinimo!).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Inventario
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Reactivos, materiales y equipos del laboratorio
          </p>
        </div>
        <Link href="/operaciones/inventario/nuevo">
          <Button className="bg-[#13602C] hover:bg-[#0e4a21] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo ítem
          </Button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total ítems</p>
          <p className="text-3xl font-bold text-[#13602C] mt-1">{total}</p>
          <p className="text-xs text-gray-400 mt-1">productos registrados</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Con stock mínimo</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{allItems.filter(i => i.stockMinimo !== null).length}</p>
          <p className="text-xs text-gray-400 mt-1">ítems monitoreados</p>
        </div>
        <Link href="/operaciones/inventario?alerta=1" className="block">
          <div className={`rounded-xl border p-4 transition-all ${alertaCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Stock bajo</p>
            <p className={`text-3xl font-bold mt-1 ${alertaCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{alertaCount}</p>
            <p className="text-xs text-gray-400 mt-1">por debajo del mínimo</p>
          </div>
        </Link>
      </div>

      {/* Search + filters (client) */}
      <InventarioSearchClient
        categorias={categorias.map(c => c.categoria!).filter(Boolean)}
        currentQ={q}
        currentCategoria={categoria}
        currentAlerta={alerta}
      />

      {/* Table */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center py-16 gap-3">
          <Package className="w-10 h-10 text-gray-300" />
          <p className="text-gray-500 font-medium">No se encontraron ítems</p>
          <p className="text-gray-400 text-sm">Ajusta los filtros o agrega un nuevo ítem</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Cód. Orden</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Descripción</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Categoría</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Unidad</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Mínimo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map(item => {
                const alerta = item.stockMinimo !== null && item.stock <= item.stockMinimo
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{item.codOrden || '—'}</td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-gray-800 line-clamp-2 max-w-xs">{item.descripcion}</p>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {item.categoria
                        ? <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs">{item.categoria}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{item.unidad || '—'}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`font-semibold ${alerta ? 'text-red-600' : 'text-gray-800'}`}>
                        {item.stock % 1 === 0 ? item.stock : item.stock.toFixed(2)}
                      </span>
                      {alerta && <AlertTriangle className="w-3.5 h-3.5 text-red-500 inline-block ml-1" />}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-400">
                      {item.stockMinimo !== null ? item.stockMinimo : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/operaciones/inventario/${item.id}`}
                        className="text-[#13602C] hover:text-[#0e4a21] font-medium text-xs"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {filteredItems.length} ítem{filteredItems.length !== 1 ? 's' : ''}
            {q || categoria || alerta ? ` (filtrado de ${total})` : ''}
          </div>
        </div>
      )}
    </div>
  )
}
