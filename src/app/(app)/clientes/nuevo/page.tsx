import { requireRol } from '@/lib/roles'
import { crearCliente } from '@/app/actions/clientes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ClienteForm } from '@/components/forms/cliente-form'

export default async function NuevoClientePage() {
  await requireRol(['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'])
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/clientes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Clientes
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Nuevo cliente</h1>
      </div>
      <ClienteForm action={crearCliente} />
    </div>
  )
}
