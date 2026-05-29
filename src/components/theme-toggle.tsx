'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-8 h-8" />

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200"
      style={{
        backgroundColor: isDark ? 'rgba(74,195,178,0.15)' : 'rgba(0,0,0,0.05)',
        color:           isDark ? '#4AC3B2' : '#64748b',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLElement).style.backgroundColor = isDark
          ? 'rgba(74,195,178,0.25)'
          : 'rgba(0,0,0,0.10)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLElement).style.backgroundColor = isDark
          ? 'rgba(74,195,178,0.15)'
          : 'rgba(0,0,0,0.05)'
      }}
    >
      {isDark ? (
        <Sun  className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  )
}
