'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ── Auth helper ───────────────────────────────────────────────────────────────

async function requireRRHH() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')
  const rol = session.user.rol
  if (rol !== 'ADMINISTRACION' && rol !== 'DIRECTOR_ADMINISTRACION' && rol !== 'GERENTE_TECNICO' && rol !== 'SUPER_ADMIN') {
    throw new Error('Sin permiso')
  }
  return session
}

// ── Empleados ─────────────────────────────────────────────────────────────────

export async function crearEmpleado(formData: FormData) {
  await requireRRHH()

  const dni          = (formData.get('dni') as string).trim()
  const nombre       = (formData.get('nombre') as string).trim()
  const tipoContrato = formData.get('tipoContrato') as string
  const fechaIngreso = formData.get('fechaIngreso') as string
  const finContrato  = formData.get('finContrato') as string | null
  const cargo        = (formData.get('cargo') as string | null)?.trim() || null
  const area         = (formData.get('area') as string | null)?.trim() || null
  const notas        = (formData.get('notas') as string | null)?.trim() || null

  if (!dni || !nombre || !tipoContrato || !fechaIngreso) {
    throw new Error('Campos obligatorios faltantes')
  }

  const empleado = await prisma.empleado.create({
    data: {
      dni,
      nombre,
      tipoContrato,
      fechaIngreso: new Date(fechaIngreso),
      finContrato:  finContrato ? new Date(finContrato) : null,
      cargo,
      area,
      notas,
      vacacion: {
        create: {
          diasAtrasados:         0,
          diasReglamentarios:    0,
          adelantadasTomadas:    0,
          adelantadasPendientes: 0,
        },
      },
    },
  })

  revalidatePath('/rrhh/personal')
  redirect(`/rrhh/personal/${empleado.id}`)
}

export async function editarEmpleado(id: string, formData: FormData) {
  await requireRRHH()

  const dni          = (formData.get('dni') as string).trim()
  const nombre       = (formData.get('nombre') as string).trim()
  const tipoContrato = formData.get('tipoContrato') as string
  const fechaIngreso = formData.get('fechaIngreso') as string
  const finContrato  = formData.get('finContrato') as string | null
  const cargo        = (formData.get('cargo') as string | null)?.trim() || null
  const area         = (formData.get('area') as string | null)?.trim() || null
  const notas        = (formData.get('notas') as string | null)?.trim() || null
  const activo       = formData.get('activo') === 'true'

  await prisma.empleado.update({
    where: { id },
    data: {
      dni,
      nombre,
      tipoContrato,
      fechaIngreso: new Date(fechaIngreso),
      finContrato:  finContrato ? new Date(finContrato) : null,
      cargo,
      area,
      notas,
      activo,
    },
  })

  revalidatePath('/rrhh/personal')
  revalidatePath(`/rrhh/personal/${id}`)
  redirect(`/rrhh/personal/${id}`)
}

export async function desactivarEmpleado(id: string) {
  await requireRRHH()
  await prisma.empleado.update({ where: { id }, data: { activo: false } })
  revalidatePath('/rrhh/personal')
}

export async function activarEmpleado(id: string) {
  await requireRRHH()
  await prisma.empleado.update({ where: { id }, data: { activo: true } })
  revalidatePath('/rrhh/personal')
}

// ── Vacaciones ────────────────────────────────────────────────────────────────

export async function editarVacaciones(empleadoId: string, formData: FormData) {
  await requireRRHH()

  const diasAtrasados         = parseInt(formData.get('diasAtrasados')         as string) || 0
  const diasReglamentarios    = parseInt(formData.get('diasReglamentarios')    as string) || 0
  const adelantadasTomadas    = parseInt(formData.get('adelantadasTomadas')    as string) || 0
  const adelantadasPendientes = parseInt(formData.get('adelantadasPendientes') as string) || 0

  await prisma.vacacionBalance.upsert({
    where:  { empleadoId },
    update: { diasAtrasados, diasReglamentarios, adelantadasTomadas, adelantadasPendientes },
    create: { empleadoId, diasAtrasados, diasReglamentarios, adelantadasTomadas, adelantadasPendientes },
  })

  revalidatePath('/rrhh/vacaciones')
  revalidatePath(`/rrhh/personal/${empleadoId}`)
}
