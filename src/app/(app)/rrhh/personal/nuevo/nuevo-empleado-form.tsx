'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { crearEmpleado } from '@/app/actions/rrhh'

// ── Shared field style ────────────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition bg-white'
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1'

// ── Component ─────────────────────────────────────────────────────────────────

export function NuevoEmpleadoForm() {
  const [isPending, start] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => {
      try {
        await crearEmpleado(fd)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al guardar'
        alert(msg)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="cetox-card p-6 space-y-5">

      {/* DNI + Nombre */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>DNI *</label>
          <input name="dni" required maxLength={12} placeholder="00000000" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Nombre completo *</label>
          <input name="nombre" required maxLength={120} placeholder="Apellidos y nombre" className={inputCls} />
        </div>
      </div>

      {/* Cargo + Área */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Cargo</label>
          <input name="cargo" maxLength={80} placeholder="Analista, Técnico, etc." className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Área</label>
          <select name="area" className={inputCls}>
            <option value="">— Sin área asignada —</option>
            <option value="Gerencia">Gerencia</option>
            <option value="Calidad">Calidad</option>
            <option value="Administración">Administración</option>
            <option value="RRHH">RRHH</option>
            <option value="Operaciones">Operaciones</option>
            <option value="Biología">Biología</option>
            <option value="Química">Química</option>
            <option value="Microbiología">Microbiología</option>
          </select>
        </div>
      </div>

      {/* Tipo de contrato */}
      <div>
        <label className={labelCls}>Tipo de contrato *</label>
        <select name="tipoContrato" required className={inputCls}>
          <option value="PERMANENTE">Permanente</option>
          <option value="PLAZO_FIJO">A plazo fijo / Modalidad: Servicio Específico</option>
        </select>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Fecha de ingreso a planilla *</label>
          <input name="fechaIngreso" type="date" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Fin de contrato <span className="text-slate-400 font-normal">(dejar vacío = Indeterminado)</span></label>
          <input name="finContrato" type="date" className={inputCls} />
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className={labelCls}>Notas</label>
        <textarea name="notas" rows={3} maxLength={500} placeholder="Observaciones adicionales..." className={`${inputCls} resize-none`} />
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isPending}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition disabled:opacity-40"
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #1F4E79 0%, #2d6fa8 100%)', fontFamily: 'var(--font-montserrat)' }}
        >
          {isPending ? 'Guardando…' : 'Crear empleado'}
        </button>
      </div>

    </form>
  )
}
