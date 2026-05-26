import { requireNotAnalista, hasRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ClientesTable } from '@/components/clientes-table'

export default async function ClientesPage() {
  const session = await requireNotAnalista()
  const clientes = await prisma.cliente.findMany({ orderBy: { razonSocial: 'asc' } })
  const canEdit = hasRol(session?.user.rol ?? '', 'GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
        {canEdit && (
          <Link href="/clientes/nuevo">
            <Button style={{ backgroundColor: '#1F4E79' }}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo cliente
            </Button>
          </Link>
        )}
      </div>

      <ClientesTable clientes={clientes} canEdit={canEdit} />
    </div>
  )
}
