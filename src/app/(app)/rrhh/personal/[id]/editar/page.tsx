import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { EditarEmpleadoForm } from './editar-empleado-form'

export default async function EditarEmpleadoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol(['ADMINISTRACION', 'GERENTE_TECNICO'])
  const { id } = await params

  const emp = await prisma.empleado.findUnique({ where: { id } })
  if (!emp) notFound()

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold text-slate-900 mb-6" style={{ fontFamily: 'var(--font-oswald)', letterSpacing: '0.05em' }}>
        EDITAR EMPLEADO
      </h1>
      <EditarEmpleadoForm empleado={{
        id:           emp.id,
        dni:          emp.dni,
        nombre:       emp.nombre,
        tipoContrato: emp.tipoContrato,
        fechaIngreso: emp.fechaIngreso.toISOString().split('T')[0],
        finContrato:  emp.finContrato ? emp.finContrato.toISOString().split('T')[0] : '',
        cargo:        emp.cargo ?? '',
        area:         emp.area  ?? '',
        notas:        emp.notas ?? '',
        activo:       emp.activo,
      }} />
    </div>
  )
}
