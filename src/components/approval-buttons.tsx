'use client'

import { useTransition, useState } from 'react'
import { CheckCircle, XCircle, Send, PlayCircle, CheckSquare, RotateCcw, Loader2 } from 'lucide-react'
import { actualizarEstadoRequerimiento, actualizarEstadoOrdenCompra } from '@/app/actions/aprobaciones'
import { toast } from 'sonner'

// ── Estado config ─────────────────────────────────────────────────────────────

const ESTADO_CFG: Record<string, { label: string; color: string; bg: string }> = {
  BORRADOR:             { label: 'Borrador',            color: '#64748b', bg: '#f1f5f9' },
  PENDIENTE_APROBACION: { label: 'Pend. Aprobación',   color: '#d97706', bg: '#fef3c7' },
  APROBADO:             { label: 'Aprobado',            color: '#16a34a', bg: '#dcfce7' },
  APROBADA:             { label: 'Aprobada',            color: '#16a34a', bg: '#dcfce7' },
  RECHAZADO:            { label: 'Rechazado',           color: '#dc2626', bg: '#fee2e2' },
  RECHAZADA:            { label: 'Rechazada',           color: '#dc2626', bg: '#fee2e2' },
  EN_PROCESO:           { label: 'En Proceso',          color: '#7c3aed', bg: '#f3e8ff' },
  COMPLETADO:           { label: 'Completado',          color: '#4AC3B2', bg: '#ccefe9' },
  EMITIDA:              { label: 'Emitida',             color: '#3b82f6', bg: '#dbeafe' },
  RECIBIDA:             { label: 'Recibida',            color: '#8b5cf6', bg: '#ede9fe' },
  CERRADA:              { label: 'Cerrada',             color: '#475569', bg: '#e2e8f0' },
}

export function EstadoBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_CFG[estado] ?? { label: estado, color: '#64748b', bg: '#f1f5f9' }
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}

// ── Requerimiento approval buttons ────────────────────────────────────────────

interface ReqButtonsProps {
  id:      string
  estado:  string
  userRol: string
}

const ACCIONES_REQ: Record<string, {
  label:  string
  estado: string
  icon:   React.ElementType
  color:  string
  bg:     string
  roles?: string[]  // if undefined, any role can do it
}[]> = {
  BORRADOR:             [{ label: 'Enviar a aprobación', estado: 'PENDIENTE_APROBACION', icon: Send,        color: '#1d4ed8', bg: '#dbeafe' }],
  PENDIENTE_APROBACION: [
    { label: 'Aprobar',   estado: 'APROBADO',  icon: CheckCircle, color: '#16a34a', bg: '#dcfce7', roles: ['JEFE_OPERACIONES','DIRECTOR_CALIDAD','GERENTE_TECNICO'] },
    { label: 'Rechazar',  estado: 'RECHAZADO', icon: XCircle,     color: '#dc2626', bg: '#fee2e2', roles: ['JEFE_OPERACIONES','DIRECTOR_CALIDAD','GERENTE_TECNICO'] },
  ],
  APROBADO:             [{ label: 'Iniciar proceso', estado: 'EN_PROCESO',  icon: PlayCircle, color: '#7c3aed', bg: '#f3e8ff' }],
  EN_PROCESO:           [{ label: 'Marcar completado', estado: 'COMPLETADO', icon: CheckSquare, color: '#4AC3B2', bg: '#ccefe9' }],
  RECHAZADO:            [{ label: 'Volver a borrador', estado: 'BORRADOR',   icon: RotateCcw,  color: '#64748b', bg: '#f1f5f9' }],
}

export function RequerimientoApprovalButtons({ id, estado, userRol }: ReqButtonsProps) {
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming]  = useState<string | null>(null)

  const acciones = (ACCIONES_REQ[estado] ?? []).filter(a =>
    !a.roles || a.roles.includes(userRol)
  )

  if (acciones.length === 0) return null

  function handleClick(nuevoEstado: string) {
    if (nuevoEstado === 'RECHAZADO' && confirming !== nuevoEstado) {
      setConfirming(nuevoEstado)
      return
    }
    setConfirming(null)
    startTransition(async () => {
      try {
        await actualizarEstadoRequerimiento(id, nuevoEstado as never)
        toast.success('Estado actualizado')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error al actualizar')
      }
    })
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {acciones.map(a => {
        const Icon = a.icon
        const isConfirming = confirming === a.estado
        return (
          <button
            key={a.estado}
            onClick={() => handleClick(a.estado)}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
            style={{ backgroundColor: isConfirming ? a.color : a.bg, color: isConfirming ? 'white' : a.color, border: `1px solid ${a.color}30` }}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Icon className="h-3.5 w-3.5" />
            )}
            {isConfirming ? `¿Confirmar ${a.label.toLowerCase()}?` : a.label}
          </button>
        )
      })}
      {confirming && (
        <button
          onClick={() => setConfirming(null)}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Cancelar
        </button>
      )}
    </div>
  )
}

// ── OrdenCompra approval buttons ──────────────────────────────────────────────

interface OCButtonsProps {
  id:      string
  estado:  string
  userRol: string
}

const ACCIONES_OC: Record<string, {
  label:  string
  estado: string
  icon:   React.ElementType
  color:  string
  bg:     string
  roles?: string[]
}[]> = {
  BORRADOR:             [{ label: 'Enviar a aprobación', estado: 'PENDIENTE_APROBACION', icon: Send,        color: '#1d4ed8', bg: '#dbeafe' }],
  PENDIENTE_APROBACION: [
    { label: 'Aprobar',   estado: 'APROBADA',  icon: CheckCircle, color: '#16a34a', bg: '#dcfce7', roles: ['JEFE_OPERACIONES','DIRECTOR_CALIDAD','GERENTE_TECNICO'] },
    { label: 'Rechazar',  estado: 'RECHAZADA', icon: XCircle,     color: '#dc2626', bg: '#fee2e2', roles: ['JEFE_OPERACIONES','DIRECTOR_CALIDAD','GERENTE_TECNICO'] },
  ],
  APROBADA:             [{ label: 'Emitir OC', estado: 'EMITIDA',   icon: Send,        color: '#3b82f6', bg: '#dbeafe' }],
  EMITIDA:              [{ label: 'Marcar recibida', estado: 'RECIBIDA', icon: CheckCircle, color: '#8b5cf6', bg: '#ede9fe' }],
  RECIBIDA:             [{ label: 'Cerrar OC', estado: 'CERRADA',   icon: CheckSquare, color: '#475569', bg: '#e2e8f0' }],
  RECHAZADA:            [{ label: 'Volver a borrador', estado: 'BORRADOR', icon: RotateCcw, color: '#64748b', bg: '#f1f5f9' }],
}

export function OrdenCompraApprovalButtons({ id, estado, userRol }: OCButtonsProps) {
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming]  = useState<string | null>(null)

  const acciones = (ACCIONES_OC[estado] ?? []).filter(a =>
    !a.roles || a.roles.includes(userRol)
  )

  if (acciones.length === 0) return null

  function handleClick(nuevoEstado: string) {
    if (nuevoEstado === 'RECHAZADA' && confirming !== nuevoEstado) {
      setConfirming(nuevoEstado)
      return
    }
    setConfirming(null)
    startTransition(async () => {
      try {
        await actualizarEstadoOrdenCompra(id, nuevoEstado as never)
        toast.success('Estado actualizado')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error al actualizar')
      }
    })
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {acciones.map(a => {
        const Icon = a.icon
        const isConfirming = confirming === a.estado
        return (
          <button
            key={a.estado}
            onClick={() => handleClick(a.estado)}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
            style={{ backgroundColor: isConfirming ? a.color : a.bg, color: isConfirming ? 'white' : a.color, border: `1px solid ${a.color}30` }}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Icon className="h-3.5 w-3.5" />
            )}
            {isConfirming ? `¿Confirmar ${a.label.toLowerCase()}?` : a.label}
          </button>
        )
      })}
      {confirming && (
        <button
          onClick={() => setConfirming(null)}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Cancelar
        </button>
      )}
    </div>
  )
}
