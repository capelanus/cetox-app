'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { NotificationBell, type NotificacionData } from './notification-bell'
import { ChatPanel } from './chat/chat-panel'
import { ThemeToggle } from './theme-toggle'
import { GlobalSearch } from './global-search'

interface AppShellProps {
  children:       React.ReactNode
  userName:       string
  userEmail:      string
  userRol:        string
  userArea:       string | null
  userId:         string
  notificaciones: NotificacionData[]
}

export function AppShell({
  children,
  userName,
  userEmail,
  userRol,
  userArea,
  userId,
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
      />
      <main
        className="flex-1 p-8 cetox-scroll overflow-y-auto"
        style={{
          marginLeft: collapsed ? '64px' : '256px',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Top-right bar: search + theme toggle + notifications */}
        <div className="flex items-center justify-end gap-2 mb-4">
          <GlobalSearch userRol={userRol} />
          <ThemeToggle />
          <NotificationBell notificaciones={notificaciones} />
        </div>

        {/* Floating chat FAB — fixed bottom-right, rendered outside content flow */}
        <ChatPanel userId={userId} userRol={userRol} userName={userName} />
        {children}
      </main>
    </div>
  )
}
