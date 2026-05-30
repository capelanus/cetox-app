import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { EditarVacacionesForm } from './editar-vacaciones-form'

export default async function EditarVacacionesPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_ADMINISTRACION', 'GERENTE_TECNICO'])
  const { id } = await params

  const emp = await prisma.empleado.findUnique({
    where: { id },
    include: { vacacion: true },
  })
  if (!emp) notFound()

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-lg font-bold text-slate-900 mb-1" style={{ fontFamily: 'var(--font-oswald)', letterSpacing: '0.05em' }}>
        EDITAR VACACIONES
      </h1>
      <p className="text-sm text-slate-500 mb-6">{emp.nombre}</p>

      <EditarVacacionesForm
        empleadoId={emp.id}
        nombre={emp.nombre}
        vacacion={emp.vacacion ? {
          diasAtrasados:         emp.vacacion.diasAtrasados,
          diasReglamentarios:    emp.vacacion.diasReglamentarios,
          adelantadasTomadas:    emp.vacacion.adelantadasTomadas,
          adelantadasPendientes: emp.vacacion.adelantadasPendientes,
        } : null}
      />
    </div>
  )
}
