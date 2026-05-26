import { requireNotAnalista, hasRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { EnsayosTable } from '@/components/ensayos-table'

export default async function EnsayosPage() {
  const session = await requireNotAnalista()
  const ensayos = await prisma.ensayo.findMany({ orderBy: [{ area: 'asc' }, { nombre: 'asc' }] })
  const canEdit = hasRol(session?.user.rol ?? '', 'DIRECTOR_CALIDAD', 'GERENTE_TECNICO', 'ADMINISTRACION')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Catálogo de Ensayos</h1>
        {canEdit && (
          <Link href="/ensayos/nuevo">
            <Button style={{ backgroundColor: '#1F4E79' }}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo ensayo
            </Button>
          </Link>
        )}
      </div>

      <EnsayosTable ensayos={ensayos} canEdit={canEdit} />
    </div>
  )
}
