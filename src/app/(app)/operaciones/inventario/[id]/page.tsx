import { requireOperaciones } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Package, AlertTriangle } from 'lucide-react'
import AjustarStockForm from './ajustar-stock-form'
import EditarItemForm from './editar-item-form'

export default async function InventarioItemPage({ params }: { params: Promise<{ id: string }> }) {
  await requireOperaciones()
  const { id } = await params

  const item = await prisma.inventarioItem.findUnique({ where: { id } })
  if (!item) notFound()

  const stockBajo = item.stockMinimo !== null && item.stock <= item.stockMinimo

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/operaciones/inventario">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />Volver
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Package className="w-5 h-5 text-[#13602C]" />
            <h1 className="text-xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
              {item.codOrden ? `[${item.codOrden}]` : 'Sin código'}
            </h1>
            {stockBajo && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                <AlertTriangle className="w-3 h-3" />
                Stock bajo
              </span>
            )}
            {!item.activo && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactivo</span>
            )}
          </div>
          <p className="text-gray-600 text-sm mt-1 leading-snug">{item.descripcion}</p>
        </div>
      </div>

      {/* Stock cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`rounded-xl border p-4 ${stockBajo ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Stock actual</p>
          <p className={`text-3xl font-bold mt-1 ${stockBajo ? 'text-red-600' : 'text-[#13602C]'}`}>
            {item.stock % 1 === 0 ? item.stock : item.stock.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{item.unidad ?? 'unidades'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Stock mínimo</p>
          <p className="text-3xl font-bold text-gray-600 mt-1">
            {item.stockMinimo !== null ? item.stockMinimo : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">nivel de alerta</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Categoría</p>
          <p className="text-lg font-semibold text-gray-700 mt-1">{item.categoria ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-1">familia / grupo</p>
        </div>
      </div>

      {/* Ajustar stock */}
      <AjustarStockForm itemId={item.id} stockActual={item.stock} unidad={item.unidad ?? 'unidades'} />

      {/* Editar datos */}
      <EditarItemForm item={{
        id: item.id,
        codOrden:    item.codOrden ?? '',
        descripcion: item.descripcion,
        unidad:      item.unidad ?? '',
        categoria:   item.categoria ?? '',
        stock:       item.stock,
        stockMinimo: item.stockMinimo ?? undefined,
        notas:       item.notas ?? '',
        activo:      item.activo,
      }} />
    </div>
  )
}
