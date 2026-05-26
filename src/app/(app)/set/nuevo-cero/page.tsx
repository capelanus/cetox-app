import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { SetCeroForm } from '@/components/forms/set-cero-form'

export default async function NuevoSETCeroPage() {
  await requireRol(['ADMINISTRACION'])

  const [clientes, ensayos] = await Promise.all([
    prisma.cliente.findMany({ where: { activo: true }, orderBy: { razonSocial: 'asc' } }),
    prisma.ensayo.findMany({ where: { activo: true }, orderBy: [{ area: 'asc' }, { nombre: 'asc' }] }),
  ])

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/set">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            SETs
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo SET sin costo</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Reensayo · Ingresos internos · Modificación sin costo
          </p>
        </div>
      </div>

      <SetCeroForm clientes={clientes} ensayos={ensayos} />
    </div>
  )
}
