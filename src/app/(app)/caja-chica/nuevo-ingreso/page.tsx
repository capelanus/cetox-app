import { requireRol } from '@/lib/roles'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { IngresoForm } from './ingreso-form'

export default async function NuevoIngresoPage() {
  await requireRol(['DIRECTOR_CALIDAD'])

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/caja-chica">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Caja Chica
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Registrar ingreso</h1>
      </div>

      <IngresoForm today={today} />
    </div>
  )
}
