'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { editarVacaciones } from '@/app/actions/rrhh'
import Link from 'next/link'
import { ChevronLeft, PalmtreeIcon } from 'lucide-react'

interface Props {
  empleadoId: string
  nombre:     string
  vacacion: {
    diasAtrasados:         number
    diasReglamentarios:    number
    adelantadasTomadas:    number
    adelantadasPendientes: number
  } | null
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition bg-white text-center font-mono text-base'
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1'

export function EditarVacacionesForm({ empleadoId, nombre, vacacion }: Props) {
  const [isPending, start] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => {
      await editarVacaciones(empleadoId, fd)
      router.push('/rrhh/vacaciones')
    })
  }

  const v = vacacion ?? { diasAtrasados: 0, diasReglamentarios: 0, adelantadasTomadas: 0, adelantadasPendientes: 0 }

  return (
    <>
      <Link
        href="/rrhh/vacaciones"
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-6 transition-colors"
      >
        <ChevronLeft className="w-3 h-3" />
        Volver a vacaciones
      </Link>

      <form onSubmit={handleSubmit} className="cetox-card p-6 space-y-6">

        {/* Vacaciones por cobrar */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full" style={{ backgroundColor: '#13602C' }} />
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider" style={{ fontFamily: 'var(--font-montserrat)' }}>
              Vacaciones por cobrar
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Días atrasados</label>
              <p className="text-[10px] text-slate-400 mb-1.5">Vacaciones de años anteriores no tomadas</p>
              <input
                name="diasAtrasados"
                type="number"
                min={0}
                max={365}
                defaultValue={v.diasAtrasados}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Días reglamentarios</label>
              <p className="text-[10px] text-slate-400 mb-1.5">Vacaciones del año en curso</p>
              <input
                name="diasReglamentarios"
                type="number"
                min={0}
                max={365}
                defaultValue={v.diasReglamentarios}
                className={inputCls}
              />
            </div>
          </div>
          <div
            className="flex items-center justify-between mt-3 px-3 py-2 rounded-lg text-xs"
            style={{ backgroundColor: 'rgba(245,158,11,0.08)', color: '#d97706' }}
          >
            <span className="font-medium">Total por cobrar (calculado):</span>
            <span className="font-bold text-sm">{v.diasAtrasados + v.diasReglamentarios} días</span>
          </div>
        </div>

        {/* Vacaciones adelantadas */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full" style={{ backgroundColor: '#8b5cf6' }} />
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider" style={{ fontFamily: 'var(--font-montserrat)' }}>
              Vacaciones adelantadas
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tomadas</label>
              <p className="text-[10px] text-slate-400 mb-1.5">Días adelantados ya disfrutados</p>
              <input
                name="adelantadasTomadas"
                type="number"
                min={0}
                max={365}
                defaultValue={v.adelantadasTomadas}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Pendientes</label>
              <p className="text-[10px] text-slate-400 mb-1.5">Días adelantados aún por tomar</p>
              <input
                name="adelantadasPendientes"
                type="number"
                min={0}
                max={365}
                defaultValue={v.adelantadasPendientes}
                className={inputCls}
              />
            </div>
          </div>
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
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', fontFamily: 'var(--font-montserrat)' }}
          >
            {isPending ? 'Guardando…' : 'Guardar días'}
          </button>
        </div>

      </form>
    </>
  )
}
