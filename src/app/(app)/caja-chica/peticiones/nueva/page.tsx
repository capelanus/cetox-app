import { requireRol } from '@/lib/roles'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { NuevaPeticionForm } from './form'

export default async function NuevaPeticionPage() {
  await requireRol(['DIRECTOR_CALIDAD'])

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/caja-chica/peticiones"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Peticiones
        </Link>
        <span className="text-slate-300">/</span>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-oswald)', color: '#13602C', letterSpacing: '0.04em' }}
        >
          Nueva Petición de Efectivo
        </h1>
      </div>

      <p className="text-sm text-slate-500 mb-5">
        Completa el formulario para solicitar efectivo. Andrea revisará y aprobará la solicitud.
      </p>

      <NuevaPeticionForm />
    </div>
  )
}
