'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import {
  Bell, FileCheck, CheckCircle2, FileText, ClipboardList,
  BellOff, Banknote, ShieldCheck,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { marcarLeida, marcarTodasLeidas } from '@/app/actions/notificaciones'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NotificacionData {
  id:        string
  tipo:      string
  titulo:    string
  mensaje:   string
  enlace:    string | null
  leida:     boolean
  createdAt: string
}

interface Props {
  notificaciones: NotificacionData[]
}

// ── Notification type metadata ────────────────────────────────────────────────

const TIPO_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  INFORME_EMITIDO:                 { icon: FileCheck,      color: '#4AC3B2', bg: 'rgba(74,195,178,0.12)'  },
  SET_COMPLETO:                    { icon: CheckCircle2,   color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  COTIZACION_NUEVA:                { icon: FileText,       color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
  COTIZACION_PROVEEDOR_REVISION:   { icon: ClipboardList,  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  PETICION_EFECTIVO:               { icon: Banknote,       color: '#13602C', bg: 'rgba(19,96,44,0.10)'   },
  ASEGURAMIENTO_INICIO:            { icon: ShieldCheck,    color: '#7e22ce', bg: 'rgba(126,34,206,0.10)'  },
  default:                         { icon: Bell,           color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
}

function getMeta(tipo: string) {
  return TIPO_META[tipo] ?? TIPO_META.default
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'ahora mismo'
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `hace ${hrs} h`
  const days = Math.floor(hrs / 24)
  return `hace ${days} día${days > 1 ? 's' : ''}`
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NotificationBell({ notificaciones }: Props) {
  const [open,        setOpen]        = useState(false)
  const [localNotifs, setLocalNotifs] = useState(notificaciones)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const ref    = useRef<HTMLDivElement>(null)

  useEffect(() => { setLocalNotifs(notificaciones) }, [notificaciones])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return ()  => document.removeEventListener('mousedown', handler)
  }, [open])

  const unread = localNotifs.filter((n) => !n.leida).length

  // Auto-marcar como leídas al cerrar el dropdown si hay no leídas.
  // Cubre todos los caminos de cierre (outside click, click en notif, click en campana).
  const wasOpenRef = useRef(open)
  useEffect(() => {
    if (wasOpenRef.current && !open && unread > 0) {
      setLocalNotifs((prev) => prev.map((n) => ({ ...n, leida: true })))
      startTransition(async () => { await marcarTodasLeidas() })
    }
    wasOpenRef.current = open
  }, [open, unread, startTransition])

  function handleClick(notif: NotificacionData) {
    setLocalNotifs((prev) => prev.map((n) => n.id === notif.id ? { ...n, leida: true } : n))
    startTransition(async () => { await marcarLeida(notif.id) })
    if (notif.enlace) { setOpen(false); router.push(notif.enlace) }
  }

  return (
    <div ref={ref} className="relative">

      {/* ── Bell button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notificaciones"
        className="relative flex items-center justify-center transition-all duration-200"
        style={{
          width:        36,
          height:       36,
          borderRadius: 10,
          background:   'linear-gradient(145deg, #1e2d3d 0%, #0f1e2e 100%)',
          boxShadow:    open
            ? '0 6px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)'
            : '0 2px 12px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.06)',
          border:       '1px solid rgba(255,255,255,0.07)',
          transform:    open ? 'translateY(1px)' : 'translateY(0)',
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)'
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.06)'
          }
        }}
      >
        <Bell
          style={{
            width:  17,
            height: 17,
            color:  unread > 0 ? '#fbbf24' : 'rgba(255,255,255,0.82)',
            transition: 'color 0.2s ease',
          }}
        />

        {/* Badge */}
        {unread > 0 && (
          <span
            className="absolute flex items-center justify-center font-bold leading-none"
            style={{
              top:          -5,
              right:        -5,
              minWidth:     17,
              height:       17,
              borderRadius: 99,
              fontSize:     9,
              paddingInline: 4,
              backgroundColor: '#ef4444',
              color:           'white',
              border:          '2px solid #0f1e2e',
              fontFamily:      'var(--font-montserrat)',
            }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div
          className="absolute right-0 z-50 flex flex-col overflow-hidden"
          style={{
            top:          44,
            width:        320,
            borderRadius: 16,
            background:   'white',
            boxShadow:    '0 8px 40px rgba(0,0,0,0.14), 0 2px 10px rgba(0,0,0,0.08)',
            border:       '1px solid rgba(0,0,0,0.06)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{
              background:   'linear-gradient(145deg, #1e2d3d 0%, #0f1e2e 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
              <span className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-montserrat)' }}>
                Notificaciones
              </span>
              {unread > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: '#ef4444', color: 'white' }}
                >
                  {unread}
                </span>
              )}
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto cetox-scroll" style={{ maxHeight: 380 }}>
            {localNotifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12">
                <BellOff className="h-8 w-8 text-slate-200" />
                <p className="text-slate-400 text-sm">Sin notificaciones</p>
              </div>
            ) : (
              localNotifs.map((notif, i) => {
                const meta   = getMeta(notif.tipo)
                const Icon   = meta.icon
                const isLast = i === localNotifs.length - 1

                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className="w-full text-left flex items-start gap-3 px-4 py-3 transition-colors"
                    style={{
                      borderBottom:    isLast ? 'none' : '1px solid rgba(0,0,0,0.05)',
                      backgroundColor: !notif.leida ? `${meta.color}08` : 'transparent',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = !notif.leida ? `${meta.color}08` : 'transparent' }}
                  >
                    {/* Type icon */}
                    <div
                      className="flex-shrink-0 flex items-center justify-center mt-0.5"
                      style={{
                        width:           34,
                        height:          34,
                        borderRadius:    10,
                        backgroundColor: meta.bg,
                      }}
                    >
                      <Icon style={{ width: 16, height: 16, color: meta.color }} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className="text-xs font-semibold leading-snug text-slate-800"
                          style={{ fontFamily: 'var(--font-montserrat)' }}
                        >
                          {notif.titulo}
                        </p>
                        {!notif.leida && (
                          <span
                            className="flex-shrink-0 w-2 h-2 rounded-full mt-0.5"
                            style={{ backgroundColor: meta.color }}
                          />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                        {notif.mensaje}
                      </p>
                      <p className="text-[10px] mt-1.5" style={{ color: meta.color, opacity: 0.8 }}>
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
