import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { actualizarEnsayo } from '@/app/actions/ensayos'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EnsayoForm } from '@/components/forms/ensayo-form'

export default async function EditarEnsayoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol(['DIRECTOR_CALIDAD'])
  const { id } = await params
  const ensayo = await prisma.ensayo.findUnique({ where: { id } })
  if (!ensayo) notFound()

  const action = actualizarEnsayo.bind(null, id)

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/ensayos">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Ensayos</Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Editar ensayo</h1>
      </div>
      <EnsayoForm action={action} ensayo={ensayo} />
    </div>
  )
}
