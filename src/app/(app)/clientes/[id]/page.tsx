import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { actualizarCliente, eliminarCliente } from '@/app/actions/clientes'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ClienteForm } from '@/components/forms/cliente-form'
import { EliminarClienteBtn } from '@/components/eliminar-cliente-btn'

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol(['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'])
  const { id } = await params
  const cliente = await prisma.cliente.findUnique({ where: { id } })
  if (!cliente) notFound()

  const action = actualizarCliente.bind(null, id)
  const deleteAction = eliminarCliente.bind(null, id)

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/clientes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Clientes
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Editar cliente</h1>
        <div className="ml-auto">
          <EliminarClienteBtn action={deleteAction} nombre={cliente.razonSocial} />
        </div>
      </div>
      <ClienteForm action={action} cliente={cliente} />
    </div>
  )
}
