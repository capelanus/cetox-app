'use client'

import { useState, useEffect, useRef, useTransition, useCallback } from 'react'
import { MessageSquare, X, Send, Paperclip, FileText, Image, File, Download, Loader2, ArrowLeft, Search } from 'lucide-react'
import { enviarMensaje } from '@/app/actions/chat'
import { format, isToday, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'
import { UserAvatar } from '@/components/ui/user-avatar'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Mensaje {
  id:            string
  contenido:     string
  archivoUrl:    string | null
  archivoNombre: string | null
  archivoTipo:   string | null
  createdAt:     string
  autorId:       string
  autor:         { nombre: string; rol: string }
}

interface MensajeAgrupado extends Mensaje { showHeader: boolean }

interface Usuario {
  id:     string
  nombre: string
  rol:    string
}

interface Props {
  userId:   string
  userRol:  string
  userName: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ROL_COLOR: Record<string, string> = {
  DIRECTOR_CALIDAD:    '#4AC3B2',
  ADMINISTRACION:      '#13602C',
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

const LS_KEY = 'cetox_chat_dm_lastRead'

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

function formatBytes(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(tipo: string | null): boolean {
  return !!tipo?.startsWith('image/')
}

function isPdf(tipo: string | null): boolean {
  return tipo === 'application/pdf'
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
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}')
  } catch { return {} }
}

function saveLastRead(data: Record<string, string>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {}
}

// ── File attachment preview ────────────────────────────────────────────────────

function FileIconComponent({ tipo }: { tipo: string | null }) {
  if (isImage(tipo))  return <Image  className="w-4 h-4 flex-shrink-0" />
  if (isPdf(tipo))    return <FileText className="w-4 h-4 flex-shrink-0" />
  return <File className="w-4 h-4 flex-shrink-0" />
}

interface PendingFile {
  file:      File
  preview?:  string
  uploading: boolean
  url?:      string
  error?:    string
}

// ── Attachment bubble ──────────────────────────────────────────────────────────

function AttachmentBubble({ msg, esPropio }: { msg: Mensaje; esPropio: boolean }) {
  const { archivoUrl, archivoNombre, archivoTipo } = msg
  if (!archivoUrl) return null

  const isImg = isImage(archivoTipo)
  const nombre = archivoNombre ?? 'archivo'

  if (isImg) {
    return (
      <a
        href={archivoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl overflow-hidden mt-1"
        style={{ maxWidth: 220 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={archivoUrl}
          alt={nombre}
          className="w-full object-cover rounded-xl hover:opacity-90 transition-opacity"
          style={{ maxHeight: 200 }}
        />
      </a>
    )
  }

  return (
    <a
      href={archivoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-xl px-3 py-2 mt-1 group transition-all"
      style={{
        backgroundColor: esPropio ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.05)',
        border:          esPropio ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.08)',
        maxWidth:        220,
        textDecoration:  'none',
      }}
    >
      <div
        className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
        style={{ backgroundColor: isPdf(archivoTipo) ? '#fee2e2' : '#dbeafe' }}
      >
        <FileIconComponent tipo={archivoTipo} />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="text-xs font-semibold truncate"
          style={{ color: esPropio ? 'white' : '#334155' }}
        >
          {nombre}
        </p>
        <p className="text-[10px]" style={{ color: esPropio ? 'rgba(255,255,255,0.65)' : '#94a3b8' }}>
          {isPdf(archivoTipo) ? 'PDF' : archivoTipo?.split('/')[1]?.toUpperCase() ?? 'Archivo'}
        </p>
      </div>
      <Download className="w-3.5 h-3.5 flex-shrink-0" style={{ color: esPropio ? 'rgba(255,255,255,0.7)' : '#94a3b8' }} />
    </a>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChatPanel({ userId }: Props) {
  const [open,          setOpen]         = useState(false)
  const [usuarios,      setUsuarios]     = useState<Usuario[]>([])
  const [activoId,      setActivoId]     = useState<string | null>(null)
  const [busqueda,      setBusqueda]     = useState('')
  const [mensajes,      setMensajes]     = useState<Mensaje[]>([])
  const [texto,         setTexto]        = useState('')
  const [cargando,      setCargando]     = useState(false)
  const [lastRead,      setLastRead]     = useState<Record<string, string>>(loadLastRead)
  const [unreadCounts,  setUnreadCounts] = useState<Record<string, number>>({})
  const [isPending,     startTransition] = useTransition()
  const [pendingFile,   setPendingFile]  = useState<PendingFile | null>(null)

  const lastTsRef       = useRef<string | null>(null)
  const isOpenRef       = useRef(false)
  const activoIdRef     = useRef<string | null>(null)
  const messagesEndRef  = useRef<HTMLDivElement>(null)
  const inputRef        = useRef<HTMLInputElement>(null)
  const fileInputRef    = useRef<HTMLInputElement>(null)
  const scrollRef       = useRef<HTMLDivElement>(null)
  const msgPollRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const unreadPollRef   = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { isOpenRef.current = open },        [open])
  useEffect(() => { activoIdRef.current = activoId },  [activoId])

  const totalUnread = Object.values(unreadCounts).reduce((s, n) => s + n, 0)
  const usuarioActivo = usuarios.find(u => u.id === activoId)
  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  // ── Load users list once on mount ─────────────────────────────────────────

  useEffect(() => {
    fetch('/api/chat/usuarios')
      .then(r => r.ok ? r.json() : [])
      .then((data: Usuario[]) => setUsuarios(data))
      .catch(() => {})
  }, [])

  // ── Mark conversation as read ──────────────────────────────────────────────

  const marcarLeido = useCallback((otroId: string) => {
    const now = new Date().toISOString()
    setUnreadCounts(prev => ({ ...prev, [otroId]: 0 }))
    setLastRead(prev => {
      const updated = { ...prev, [otroId]: now }
      saveLastRead(updated)
      return updated
    })
  }, [])

  // ── Fetch unread counts (background) ─────────────────────────────────────

  const fetchUnread = useCallback(async (currentLastRead: Record<string, string>, lista: Usuario[]) => {
    if (!lista.length) return
    try {
      const params = new URLSearchParams()
      for (const u of lista) {
        const ts = currentLastRead[u.id] ?? new Date(0).toISOString()
        params.set(u.id, ts)
      }
      const res  = await fetch(`/api/chat/unread?${params}`)
      if (!res.ok) return
      const data: Record<string, number> = await res.json()
      setUnreadCounts(prev => {
        const updated = { ...prev }
        for (const otroId of Object.keys(data)) {
          if (isOpenRef.current && otroId === activoIdRef.current) continue
          updated[otroId] = data[otroId] ?? 0
        }
        return updated
      })
    } catch { /* ignore */ }
  }, [])

  // ── Messages ──────────────────────────────────────────────────────────────

  function isNearBottom() {
    const el = scrollRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }

  function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  async function cargar(otroId: string) {
    setCargando(true)
    lastTsRef.current = null
    try {
      const res  = await fetch(`/api/chat/mensajes?usuario=${otroId}`)
      if (!res.ok) return
      const data: Mensaje[] = await res.json()
      setMensajes(data)
      if (data.length) lastTsRef.current = data[data.length - 1].createdAt
      setTimeout(() => scrollToBottom('instant'), 50)
      marcarLeido(otroId)
    } finally {
      setCargando(false)
    }
  }

  async function pollMensajes(otroId: string) {
    if (!lastTsRef.current) return
    try {
      const res  = await fetch(`/api/chat/mensajes?usuario=${otroId}&desde=${encodeURIComponent(lastTsRef.current)}`)
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
      marcarLeido(otroId)
    } catch { /* ignore */ }
  }

  // ── Unread poll (background, even when closed) ────────────────────────────

  useEffect(() => {
    if (!usuarios.length) return
    fetchUnread(lastRead, usuarios)
    if (unreadPollRef.current) clearInterval(unreadPollRef.current)
    unreadPollRef.current = setInterval(() => fetchUnread(lastRead, usuarios), 8000)
    return () => { if (unreadPollRef.current) clearInterval(unreadPollRef.current) }
  }, [usuarios, lastRead, fetchUnread])

  // ── Messages poll when panel open and a user is active ────────────────────

  useEffect(() => {
    if (!open || !activoId) return
    cargar(activoId)
    if (msgPollRef.current) clearInterval(msgPollRef.current)
    msgPollRef.current = setInterval(() => pollMensajes(activoId), 3000)
    return () => { if (msgPollRef.current) clearInterval(msgPollRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activoId])

  function handleOpen() {
    setOpen(true)
  }

  function abrirConversacion(otroId: string) {
    setActivoId(otroId)
  }

  function volverALista() {
    setActivoId(null)
    setMensajes([])
    if (msgPollRef.current) clearInterval(msgPollRef.current)
  }

  useEffect(() => {
    if (open && activoId) setTimeout(() => inputRef.current?.focus(), 250)
  }, [open, activoId])

  // ── File attachment ───────────────────────────────────────────────────────

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 20 * 1024 * 1024) {
      alert('El archivo no puede superar 20 MB')
      e.target.value = ''
      return
    }

    const newPending: PendingFile = { file, uploading: true }
    if (file.type.startsWith('image/')) {
      newPending.preview = URL.createObjectURL(file)
    }

    setPendingFile(newPending)
    e.target.value = ''

    const formData = new FormData()
    formData.append('file', file)

    fetch('/api/upload', { method: 'POST', body: formData })
      .then(r => r.json())
      .then((data: { url?: string; error?: string }) => {
        if (data.url) {
          setPendingFile(prev => prev ? { ...prev, uploading: false, url: data.url } : null)
        } else {
          setPendingFile(prev => prev ? { ...prev, uploading: false, error: 'Error al subir' } : null)
        }
      })
      .catch(() => {
        setPendingFile(prev => prev ? { ...prev, uploading: false, error: 'Error de red' } : null)
      })
  }

  function cancelFile() {
    if (pendingFile?.preview) URL.revokeObjectURL(pendingFile.preview)
    setPendingFile(null)
  }

  // ── Send message ─────────────────────────────────────────────────────────

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!activoId) return
    const contenido = texto.trim()
    if ((!contenido && !pendingFile?.url) || isPending) return
    if (pendingFile?.uploading) return

    const archivoUrl    = pendingFile?.url    ?? null
    const archivoNombre = pendingFile?.file.name ?? null
    const archivoTipo   = pendingFile?.file.type ?? null

    setTexto('')
    if (pendingFile?.preview) URL.revokeObjectURL(pendingFile.preview)
    setPendingFile(null)

    startTransition(async () => {
      try {
        const nuevo = await enviarMensaje(activoId, contenido, archivoUrl, archivoNombre, archivoTipo)
        setMensajes(prev => {
          if (prev.find(m => m.id === nuevo.id)) return prev
          return [...prev, nuevo]
        })
        lastTsRef.current = nuevo.createdAt
        marcarLeido(activoId)
        setTimeout(scrollToBottom, 80)
      } catch {
        setTexto(contenido)
      }
    })
  }

  const agrupados = agrupar(mensajes)
  const canSend   = activoId !== null && (texto.trim().length > 0 || (pendingFile?.url != null)) && !isPending && !pendingFile?.uploading

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
          <div className="flex items-center gap-2 min-w-0">
            {activoId && (
              <button
                onClick={volverALista}
                className="flex items-center justify-center w-7 h-7 rounded-md transition-colors flex-shrink-0"
                style={{ color: 'rgba(255,255,255,0.7)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                title="Volver"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            {usuarioActivo ? (
              <>
                <UserAvatar nombre={usuarioActivo.nombre} size="sm" />
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate" style={{ fontFamily: 'var(--font-montserrat)' }}>
                    {usuarioActivo.nombre}
                  </p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {ROL_LABEL[usuarioActivo.rol] ?? usuarioActivo.rol}
                  </p>
                </div>
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
                <span className="text-white font-semibold text-sm" style={{ fontFamily: 'var(--font-montserrat)' }}>
                  Mensajes
                </span>
                {totalUnread > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#ef4444', color: 'white' }}>
                    {totalUnread}
                  </span>
                )}
              </>
            )}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-7 h-7 rounded-md transition-colors flex-shrink-0"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = 'white' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── User list (when no active conversation) ── */}
        {!activoId && (
          <>
            <div className="flex-shrink-0 px-3 py-2 border-b bg-slate-50">
              <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-white border">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar usuario…"
                  className="flex-1 bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto cetox-scroll">
              {usuariosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
                  <MessageSquare className="h-10 w-10 text-slate-200" />
                  <p className="text-slate-400 text-sm font-medium">Sin usuarios</p>
                </div>
              ) : (
                <ul>
                  {usuariosFiltrados.map((u) => {
                    const unread = unreadCounts[u.id] ?? 0
                    const color  = ROL_COLOR[u.rol] ?? '#94a3b8'
                    return (
                      <li key={u.id}>
                        <button
                          onClick={() => abrirConversacion(u.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors border-b"
                        >
                          <UserAvatar nombre={u.nombre} size="sm" />
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-semibold text-slate-700 truncate">{u.nombre}</p>
                            <p className="text-[10px] font-medium" style={{ color }}>
                              {ROL_LABEL[u.rol] ?? u.rol}
                            </p>
                          </div>
                          {unread > 0 && (
                            <span
                              className="flex items-center justify-center font-bold leading-none rounded-full flex-shrink-0"
                              style={{
                                minWidth: 18, height: 18,
                                fontSize: 10, paddingInline: 4,
                                backgroundColor: '#ef4444',
                                color: 'white',
                              }}
                            >
                              {unread > 99 ? '99+' : unread}
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </>
        )}

        {/* ── Conversation (messages + input) ── */}
        {activoId && (
          <>
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 cetox-scroll">
              {cargando ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-300 text-sm">Cargando…</p>
                </div>
              ) : agrupados.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                  <MessageSquare className="h-10 w-10 text-slate-200" />
                  <p className="text-slate-400 text-sm font-medium">Sin mensajes aún</p>
                  <p className="text-slate-300 text-xs">¡Envía el primer mensaje!</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {agrupados.map((m) => {
                    const esPropio = m.autorId === userId
                    const color    = ROL_COLOR[m.autor.rol] ?? '#94a3b8'

                    return (
                      <div
                        key={m.id}
                        className={`flex gap-2 ${esPropio ? 'flex-row-reverse' : 'flex-row'} ${m.showHeader ? 'mt-4' : 'mt-0.5'}`}
                      >
                        {m.showHeader ? (
                          <UserAvatar
                            nombre={m.autor.nombre}
                            size="sm"
                            title={`${m.autor.nombre} · ${ROL_LABEL[m.autor.rol] ?? m.autor.rol}`}
                            style={{ marginTop: 2 }}
                          />
                        ) : (
                          <div className="w-7 flex-shrink-0" />
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

                          {m.contenido && (
                            <div
                              className="group relative inline-block px-3 py-2 rounded-2xl text-sm leading-relaxed break-words"
                              style={{
                                maxWidth: 260,
                                backgroundColor: esPropio ? '#4AC3B2' : '#F1F5F9',
                                color: esPropio ? 'white' : '#334155',
                                borderTopRightRadius: esPropio && m.showHeader ? 4 : 16,
                                borderTopLeftRadius:  !esPropio && m.showHeader ? 4 : 16,
                              }}
                            >
                              {m.contenido}
                              {!m.showHeader && (
                                <span className="absolute bottom-full left-0 mb-1 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                  {formatHora(m.createdAt)}
                                </span>
                              )}
                            </div>
                          )}

                          <AttachmentBubble msg={m} esPropio={esPropio} />
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* File preview */}
            {pendingFile && (
              <div
                className="flex-shrink-0 mx-3 mb-2 rounded-xl overflow-hidden border"
                style={{ borderColor: pendingFile.error ? '#fecaca' : '#e2e8f0', backgroundColor: pendingFile.error ? '#fef2f2' : '#f8fafc' }}
              >
                <div className="flex items-center gap-2 px-3 py-2">
                  {pendingFile.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pendingFile.preview} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#dbeafe' }}>
                      <FileIconComponent tipo={pendingFile.file.type} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{pendingFile.file.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {formatBytes(pendingFile.file.size)}
                      {pendingFile.error && (
                        <span className="text-red-500 ml-1">· {pendingFile.error}</span>
                      )}
                    </p>
                  </div>

                  {pendingFile.uploading ? (
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin flex-shrink-0" />
                  ) : pendingFile.url ? (
                    <span className="text-[10px] text-green-600 font-semibold flex-shrink-0">✓ Listo</span>
                  ) : null}

                  <button
                    onClick={cancelFile}
                    className="flex items-center justify-center w-6 h-6 rounded-full transition-colors flex-shrink-0"
                    style={{ color: '#94a3b8' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f1f5f9'; (e.currentTarget as HTMLElement).style.color = '#374151' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#94a3b8' }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="flex-shrink-0 px-3 py-3 border-t bg-white">
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2 border transition-colors focus-within:border-slate-300"
                style={{ backgroundColor: '#F8FAFC' }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!!pendingFile}
                  title="Adjuntar archivo"
                  className="flex items-center justify-center w-7 h-7 rounded-lg transition-all flex-shrink-0 disabled:opacity-30"
                  style={{ color: '#94a3b8' }}
                  onMouseEnter={e => { if (!pendingFile) { (e.currentTarget as HTMLElement).style.backgroundColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.color = '#475569' } }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#94a3b8' }}
                >
                  <Paperclip className="w-4 h-4" />
                </button>

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
                  placeholder={pendingFile ? 'Añade un mensaje (opcional)…' : `Mensaje a ${usuarioActivo?.nombre.split(' ')[0] ?? ''}…`}
                  maxLength={2000}
                  className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
                />

                <button
                  type="submit"
                  disabled={!canSend}
                  className="flex items-center justify-center w-8 h-8 rounded-lg transition-all disabled:opacity-30 flex-shrink-0"
                  style={{ backgroundColor: canSend ? '#13602C' : '#E2E8F0' }}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#94a3b8' }} />
                  ) : (
                    <Send className="h-4 w-4" style={{ color: canSend ? 'white' : '#94a3b8' }} />
                  )}
                </button>
              </div>

              <p className="text-[10px] text-slate-300 mt-1.5 px-1">
                {pendingFile?.uploading
                  ? 'Subiendo archivo…'
                  : pendingFile?.url
                    ? 'Archivo listo · Enter para enviar'
                    : `Clip para adjuntar · Enter para enviar · ${2000 - texto.length} caracteres`
                }
              </p>
            </form>
          </>
        )}
      </div>
    </>
  )
}
