import { requireOperaciones } from '@/lib/roles'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import NuevoItemForm from './form'

export default async function NuevoInventarioItemPage() {
  await requireOperaciones()
  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/operaciones/inventario">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Nuevo ítem de inventario
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Agrega un producto o material al inventario</p>
        </div>
      </div>
      <NuevoItemForm />
    </div>
  )
}
