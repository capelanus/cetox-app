import { requireRol } from '@/lib/roles'
import { crearEnsayo } from '@/app/actions/ensayos'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EnsayoForm } from '@/components/forms/ensayo-form'

export default async function NuevoEnsayoPage() {
  await requireRol(['DIRECTOR_CALIDAD', 'GERENTE_TECNICO', 'ADMINISTRACION'])
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/ensayos">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Ensayos</Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Nuevo ensayo</h1>
      </div>
      <EnsayoForm action={crearEnsayo} />
    </div>
  )
}
