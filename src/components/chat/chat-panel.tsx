'use client'

import { useState, useEffect, useRef, useTransition, useCallback } from 'react'
import { MessageSquare, X, Send, Hash } from 'lucide-react'
import { enviarMensaje } from '@/app/actions/chat'
import { format, isToday, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Mensaje {
  id:        string
  contenido: string
  createdAt: string
  autorId:   string
  autor:     { nombre: string; rol: string }
}

interface MensajeAgrupado extends Mensaje { showHeader: boolean }

interface Props {
  userId:   string
  userRol:  string
  userName: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TODOS_LOS_CANALES = [
  'general', 'gerencia', 'administracion', 'operaciones',
  'calidad', 'biologia', 'quimica', 'microbiologia',
]

const CANALES_INFO: Record<string, string> = {
  general:        'General',
  gerencia:       'Gerencia',
  administracion: 'Administración',
  operaciones:    'Operaciones',
  calidad:        'Calidad',
  biologia:       'Biología',
  quimica:        'Química',
  microbiologia:  'Microbiología',
}

const ACCESO_POR_ROL: Record<string, string[]> = {
  DIRECTOR_CALIDAD:    TODOS_LOS_CANALES,
  GERENTE_TECNICO:     TODOS_LOS_CANALES,
  ADMINISTRACION:      TODOS_LOS_CANALES,
  ANALISTA:            TODOS_LOS_CANALES,
  JEFE_OPERACIONES:    TODOS_LOS_CANALES,
  ASISTENTE_LOGISTICA: TODOS_LOS_CANALES,
  SUPER_ADMIN:         TODOS_LOS_CANALES,
}

const ROL_COLOR: Record<string, string> = {
  DIRECTOR_CALIDAD:    '#4AC3B2',
  ADMINISTRACION:      '#1F4E79',
  GERENTE_TECNICO:     '#7C3AED',
  ANALISTA:            '#F59E0B',
  JEFE_OPERACIONES:    '#10B981',
  ASISTENTE_LOGISTICA: '#06B6D4',
  SUPER_ADMIN:         '#EF4444',
}

const ROL_LABEL: Record<string, string> = {
  DIRECTOR_CALIDAD:    'Dir. Calidad',
  ADMINISTRACION:      'Administración',
  GERENTE_TECNICO:     'Gte. Técnico',
  ANALISTA:            'Analista',
  JEFE_OPERACIONES:    'Jefe Ops.',
  ASISTENTE_LOGISTICA: 'Asist. Logística',
  SUPER_ADMIN:         'Admin',
}

const LS_KEY = 'cetox_chat_lastRead'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFecha(iso: string): string {
  const d = new Date(iso)
  if (isToday(d))     return `Hoy ${format(d, 'HH:mm')}`
  if (isYesterday(d)) return `Ayer ${format(d, 'HH:mm')}`
  return format(d, "d MMM 'a las' HH:mm", { locale: es })
}

function formatHora(iso: string): string {
  return format(new Date(iso), 'HH:mm')
}

function agrupar(mensajes: Mensaje[]): MensajeAgrupado[] {
  return mensajes.map((m, i) => {
    const prev = mensajes[i - 1]
    const mismaSerie =
      prev &&
      prev.autorId === m.autorId &&
      new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000
    return { ...m, showHeader: !mismaSerie }
  })
}

function loadLastRead(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    const stored: Record<string, string> = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
    // Initialize missing channels to "now" so old messages don't appear as unread
    const now = new Date().toISOString()
    let changed = false
    for (const slug of TODOS_LOS_CANALES) {
      if (!stored[slug]) { stored[slug] = now; changed = true }
    }
    if (changed) localStorage.setItem(LS_KEY, JSON.stringify(stored))
    return stored
  } catch { return {} }
}

function saveLastRead(data: Record<string, string>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {}
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChatPanel({ userId, userRol, userName }: Props) {
  const [open,         setOpen]        = useState(false)
  const [canal,        setCanal]       = useState('general')
  const [mensajes,     setMensajes]    = useState<Mensaje[]>([])
  const [texto,        setTexto]       = useState('')
  const [cargando,     setCargando]    = useState(false)
  const [lastRead,     setLastRead]    = useState<Record<string, string>>(loadLastRead)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [isPending,    startTransition] = useTransition()

  const lastTsRef      = useRef<string | null>(null)
  const isOpenRef      = useRef(false)
  const activeCanalRef = useRef('general')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLInputElement>(null)
  const scrollRef      = useRef<HTMLDivElement>(null)
  const msgPollRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const unreadPollRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  const canales = ACCESO_POR_ROL[userRol] ?? TODOS_LOS_CANALES

  useEffect(() => { isOpenRef.current = open },   [open])
  useEffect(() => { activeCanalRef.current = canal }, [canal])

  const totalUnread = Object.values(unreadCounts).reduce((s, n) => s + n, 0)

  // ── Mark channel as read ──────────────────────────────────────────────────

  const marcarLeido = useCallback((slug: string) => {
    const now = new Date().toISOString()
    setUnreadCounts(prev => ({ ...prev, [slug]: 0 }))
    setLastRead(prev => {
      const updated = { ...prev, [slug]: now }
      saveLastRead(updated)
      return updated
    })
  }, [])

  // ── Fetch unread counts (background, all channels) ────────────────────────

  const fetchUnread = useCallback(async (currentLastRead: Record<string, string>) => {
    try {
      const params = new URLSearchParams()
      for (const slug of canales) {
        if (currentLastRead[slug]) params.set(slug, currentLastRead[slug])
      }
      const res  = await fetch(`/api/chat/unread?${params}`)
      if (!res.ok) return
      const data: Record<string, number> = await res.json()
      setUnreadCounts(prev => {
        // Only update channels not currently active & open (those are marked read on arrival)
        const updated = { ...prev }
        for (const slug of Object.keys(data)) {
          if (isOpenRef.current && slug === activeCanalRef.current) continue
          updated[slug] = data[slug] ?? 0
        }
        return updated
      })
    } catch { /* ignore */ }
  }, [canales])

  // ── Messages fetch & poll (active channel when open) ─────────────────────

  function isNearBottom() {
    const el = scrollRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }

  function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  async function cargar(slug: string) {
    setCargando(true)
    lastTsRef.current = null
    try {
      const res  = await fetch(`/api/chat/mensajes?canal=${slug}`)
      if (!res.ok) return
      const data: Mensaje[] = await res.json()
      setMensajes(data)
      if (data.length) lastTsRef.current = data[data.length - 1].createdAt
      setTimeout(() => scrollToBottom('instant'), 50)
      marcarLeido(slug)
    } finally {
      setCargando(false)
    }
  }

  async function pollMensajes(slug: string) {
    if (!lastTsRef.current) return
    try {
      const res  = await fetch(`/api/chat/mensajes?canal=${slug}&desde=${encodeURIComponent(lastTsRef.current)}`)
      if (!res.ok) return
      const data: Mensaje[] = await res.json()
      if (!data.length) return

      setMensajes(prev => {
        const ids  = new Set(prev.map(m => m.id))
        const news = data.filter(m => !ids.has(m.id))
        if (!news.length) return prev
        lastTsRef.current = news[news.length - 1].createdAt
        if (isNearBottom()) setTimeout(scrollToBottom, 80)
        return [...prev, ...news]
      })
      // Auto-mark read since user is looking at this channel
      marcarLeido(slug)
    } catch { /* ignore */ }
  }

  // ── Background unread poll (every 8s, even when closed) ──────────────────

  useEffect(() => {
    fetchUnread(lastRead) // initial fetch
    unreadPollRef.current = setInterval(() => {
      fetchUnread(lastRead)
    }, 8000)
    return () => { if (unreadPollRef.current) clearInterval(unreadPollRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // only on mount — uses lastRead via closure on first run; subsequent runs get fresh state via setLastRead

  // Restart unread poll when lastRead changes (so we use fresh timestamps)
  useEffect(() => {
    if (unreadPollRef.current) clearInterval(unreadPollRef.current)
    unreadPollRef.current = setInterval(() => fetchUnread(lastRead), 8000)
    return () => { if (unreadPollRef.current) clearInterval(unreadPollRef.current) }
  }, [lastRead, fetchUnread])

  // ── Messages poll when panel open ────────────────────────────────────────

  useEffect(() => {
    if (!open) return
    cargar(canal)
    if (msgPollRef.current) clearInterval(msgPollRef.current)
    msgPollRef.current = setInterval(() => pollMensajes(canal), 3000)
    return () => { if (msgPollRef.current) clearInterval(msgPollRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, canal])

  // ── Auto-switch to channel with unread on open ────────────────────────────

  function handleOpen() {
    // Find channel with most unread messages
    let maxCount = 0
    let target = canal
    for (const slug of canales) {
      const count = unreadCounts[slug] ?? 0
      if (count > maxCount) { maxCount = count; target = slug }
    }
    if (target !== canal) setCanal(target)
    setOpen(true)
  }

  // ── Focus input on open ──────────────────────────────────────────────────

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250)
  }, [open])

  // ── Send message ─────────────────────────────────────────────────────────

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const contenido = texto.trim()
    if (!contenido || isPending) return
    setTexto('')
    startTransition(async () => {
      try {
        const nuevo = await enviarMensaje(canal, contenido)
        setMensajes(prev => {
          if (prev.find(m => m.id === nuevo.id)) return prev
          return [...prev, nuevo]
        })
        lastTsRef.current = nuevo.createdAt
        marcarLeido(canal)
        setTimeout(scrollToBottom, 80)
      } catch {
        setTexto(contenido)
      }
    })
  }

  const agrupados = agrupar(mensajes)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Floating FAB ── */}
      <button
        onClick={handleOpen}
        title="Chat interno"
        className="fixed z-40 flex items-center justify-center transition-all duration-200 select-none"
        style={{
          bottom: 28, right: 28,
          width: 52, height: 52,
          borderRadius: 16,
          background: 'linear-gradient(145deg, #1e2d3d 0%, #0f1e2e 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.22), 0 1px 6px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-3px)'
          e.currentTarget.style.boxShadow = '0 10px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.08)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.22), 0 1px 6px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)'
        }}
        onMouseDown={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseUp={e   => { e.currentTarget.style.transform = 'translateY(-3px)' }}
      >
        <MessageSquare className="h-[22px] w-[22px]" style={{ color: 'rgba(255,255,255,0.88)' }} />

        {/* Total unread badge */}
        {totalUnread > 0 && (
          <span
            className="absolute flex items-center justify-center font-bold leading-none"
            style={{
              top: -6, right: -6,
              minWidth: 18, height: 18,
              borderRadius: 99,
              fontSize: 9,
              paddingInline: 4,
              backgroundColor: '#ef4444',
              color: 'white',
              border: '2px solid #0f1e2e',
              fontFamily: 'var(--font-montserrat)',
            }}
          >
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      {/* ── Backdrop ── */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/25" onClick={() => setOpen(false)} />
      )}

      {/* ── Panel ── */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-white shadow-2xl"
        style={{
          width: 380,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{
            background: 'linear-gradient(145deg, #1e2d3d 0%, #0f1e2e 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
            <span className="text-white font-semibold text-sm" style={{ fontFamily: 'var(--font-montserrat)' }}>
              Chat interno
            </span>
            {totalUnread > 0 && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: '#ef4444', color: 'white' }}
              >
                {totalUnread}
              </span>
            )}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-7 h-7 rounded-md transition-colors"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = 'white' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Channel tabs */}
        <div className="flex flex-shrink-0 border-b bg-slate-50 overflow-x-auto cetox-scroll">
          {canales.map((slug) => {
            const active  = canal === slug
            const unread  = unreadCounts[slug] ?? 0
            return (
              <button
                key={slug}
                onClick={() => setCanal(slug)}
                className="relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 flex-shrink-0"
                style={{
                  borderBottomColor: active ? '#1F4E79' : 'transparent',
                  color: active ? '#1F4E79' : unread > 0 ? '#374151' : '#94a3b8',
                  fontWeight: unread > 0 ? 700 : undefined,
                }}
              >
                <Hash className="h-3 w-3 flex-shrink-0" />
                {CANALES_INFO[slug] ?? slug}
                {unread > 0 && (
                  <span
                    className="flex items-center justify-center font-bold leading-none rounded-full"
                    style={{
                      minWidth: 16, height: 16,
                      fontSize: 9,
                      paddingInline: 3,
                      backgroundColor: active ? '#1F4E79' : '#ef4444',
                      color: 'white',
                    }}
                  >
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 cetox-scroll">
          {cargando ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-300 text-sm">Cargando…</p>
            </div>
          ) : agrupados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
              <Hash className="h-10 w-10 text-slate-200" />
              <p className="text-slate-400 text-sm font-medium">Sin mensajes aún</p>
              <p className="text-slate-300 text-xs">¡Sé el primero en escribir!</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {agrupados.map((m) => {
                const esPropio = m.autorId === userId
                const color    = ROL_COLOR[m.autor.rol] ?? '#94a3b8'
                const inicial  = m.autor.nombre.charAt(0).toUpperCase()

                return (
                  <div
                    key={m.id}
                    className={`flex gap-2 ${esPropio ? 'flex-row-reverse' : 'flex-row'} ${m.showHeader ? 'mt-4' : 'mt-0.5'}`}
                  >
                    {m.showHeader ? (
                      <div
                        title={`${m.autor.nombre} · ${ROL_LABEL[m.autor.rol] ?? m.autor.rol}`}
                        className="flex-shrink-0 flex items-center justify-center rounded-full text-white text-xs font-bold"
                        style={{
                          backgroundColor: color, width: 32, height: 32,
                          fontFamily: 'var(--font-oswald)', marginTop: 2,
                        }}
                      >
                        {inicial}
                      </div>
                    ) : (
                      <div className="w-8 flex-shrink-0" />
                    )}

                    <div className={`flex-1 min-w-0 flex flex-col ${esPropio ? 'items-end' : 'items-start'}`}>
                      {m.showHeader && (
                        <div className={`flex items-center gap-2 mb-1 ${esPropio ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">
                            {esPropio ? 'Tú' : m.autor.nombre.split(' ')[0]}
                          </span>
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: `${color}20`, color }}
                          >
                            {ROL_LABEL[m.autor.rol] ?? m.autor.rol}
                          </span>
                          <span className="text-[10px] text-slate-300">{formatFecha(m.createdAt)}</span>
                        </div>
                      )}

                      <div
                        className="group relative inline-block px-3 py-2 rounded-2xl text-sm leading-relaxed break-words"
                        style={{
                          maxWidth: 260,
                          backgroundColor: esPropio ? '#4AC3B2' : '#F1F5F9',
                          color: esPropio ? 'white' : '#334155',
                          borderTopRightRadius: esPropio && m.showHeader ? 4 : 16,
                          borderTopLeftRadius: !esPropio && m.showHeader ? 4 : 16,
                        }}
                      >
                        {m.contenido}
                        {!m.showHeader && (
                          <span className="absolute bottom-full left-0 mb-1 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {formatHora(m.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex-shrink-0 px-3 py-3 border-t bg-white">
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2 border transition-colors focus-within:border-slate-300"
            style={{ backgroundColor: '#F8FAFC' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(e as unknown as React.FormEvent)
                }
              }}
              placeholder={`Mensaje en #${CANALES_INFO[canal] ?? canal}…`}
              maxLength={1000}
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
            />
            <button
              type="submit"
              disabled={!texto.trim() || isPending}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-all disabled:opacity-30"
              style={{ backgroundColor: texto.trim() && !isPending ? '#1F4E79' : '#E2E8F0' }}
            >
              <Send className="h-4 w-4" style={{ color: texto.trim() && !isPending ? 'white' : '#94a3b8' }} />
            </button>
          </div>
          <p className="text-[10px] text-slate-300 mt-1.5 px-1">
            Enter para enviar · {1000 - texto.length} caracteres restantes
          </p>
        </form>
      </div>
    </>
  )
}
