'use client'

import { useEffect, useCallback } from 'react'

interface SseNotificacion {
  id:        string
  tipo:      string
  titulo:    string
  mensaje:   string
  enlace:    string | null
  leida:     boolean
  createdAt: string
}

interface UseSseOptions {
  onNotification: (n: SseNotificacion) => void
}

export function useSseNotifications({ onNotification }: UseSseOptions) {
  const connect = useCallback(() => {
    if (typeof window === 'undefined') return () => {}

    let es: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    function open() {
      es = new EventSource('/api/sse')

      es.addEventListener('notifications', (e: MessageEvent) => {
        try {
          const items: SseNotificacion[] = JSON.parse(e.data)
          items.forEach(onNotification)
        } catch { /* ignore */ }
      })

      es.addEventListener('error', () => {
        es?.close()
        // Reconnect after 5 seconds
        reconnectTimer = setTimeout(open, 5000)
      })
    }

    open()

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      es?.close()
    }
  }, [onNotification])

  useEffect(() => {
    const cleanup = connect()
    return cleanup
  }, [connect])
}
