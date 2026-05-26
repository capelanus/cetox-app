'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'

interface AppShellProps {
  children:  React.ReactNode
  userName:  string
  userEmail: string
  userRol:   string
  userArea:  string | null
}

export function AppShell({ children, userName, userEmail, userRol, userArea }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#EAF4F4' }}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        userName={userName}
        userEmail={userEmail}
        userRol={userRol}
        userArea={userArea}
      />
      <main
        className="flex-1 p-8 cetox-scroll overflow-y-auto"
        style={{
          marginLeft:  collapsed ? '64px' : '256px',
          transition:  'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {children}
      </main>
    </div>
  )
}
