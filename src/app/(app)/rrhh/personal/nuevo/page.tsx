import { requireRol } from '@/lib/roles'
import { NuevoEmpleadoForm } from './nuevo-empleado-form'

export default async function NuevoEmpleadoPage() {
  await requireRol(['ADMINISTRACION', 'GERENTE_TECNICO'])
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold text-slate-900 mb-6" style={{ fontFamily: 'var(--font-oswald)', letterSpacing: '0.05em' }}>
        NUEVO EMPLEADO
      </h1>
      <NuevoEmpleadoForm />
    </div>
  )
}
