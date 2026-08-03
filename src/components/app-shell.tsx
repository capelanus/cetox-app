'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { NotificationBell, type NotificacionData } from './notification-bell'
import { ChatPanel } from './chat/chat-panel'
import { GlobalSearch } from './global-search'

interface AppShellProps {
  children:       React.ReactNode
  userName:       string
  userEmail:      string
  userRol:        string
  userArea:       string | null
  userId:         string
  isVacApprover:  boolean
  esJefeLab?:     boolean
  notificaciones: NotificacionData[]
}

export function AppShell({
  children,
  userName,
  userEmail,
  userRol,
  userArea,
  userId,
  isVacApprover,
  esJefeLab,
  notificaciones,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#EAF4F4' }}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        userName={userName}
        userEmail={userEmail}
        userRol={userRol}
        userArea={userArea}
        isVacApprover={isVacApprover}
        esJefeLab={esJefeLab}
      />

      {/* ── Main area ───────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col min-h-screen cetox-scroll overflow-y-auto"
        style={{
          marginLeft: collapsed ? '64px' : '256px',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* ── Sticky top bar ─────────────────────────────────── */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-8 py-3"
          style={{
            backgroundColor: 'rgba(234,244,244,0.85)',
            backdropFilter:  'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom:    '1px solid rgba(74,195,178,0.15)',
            boxShadow:       '0 1px 8px oklch(0 0 0 / 0.04)',
          }}
        >
          {/* Left: breadcrumb-style role/area indicator */}
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: 'rgba(74,195,178,0.7)' }}
            >
              {userArea ?? ''}
            </span>
          </div>

          {/* Right: search + notifications */}
          <div className="flex items-center gap-2">
            <GlobalSearch userRol={userRol} />
            <NotificationBell notificaciones={notificaciones} />
          </div>
        </header>

        {/* ── Page content ───────────────────────────────────── */}
        <main className="flex-1 px-8 py-6">
          {/* Floating chat FAB */}
          <ChatPanel userId={userId} userRol={userRol} userName={userName} />
          {children}
        </main>
      </div>
    </div>
  )
}
