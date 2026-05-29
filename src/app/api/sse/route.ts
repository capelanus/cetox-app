import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime  = 'nodejs'
export const dynamic  = 'force-dynamic'

// ── Server-Sent Events endpoint ───────────────────────────────────────────────
// Streams new notifications to the browser. The client reconnects automatically
// when the connection drops (standard SSE behavior).

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = session.user.id

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      function send(event: string, data: unknown) {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        try {
          controller.enqueue(encoder.encode(payload))
        } catch { /* client disconnected */ }
      }

      // Initial connection ping
      send('connected', { userId })

      // Poll for new notifications every 8 seconds
      let lastCheck = new Date()

      const interval = setInterval(async () => {
        try {
          const nuevas = await prisma.notificacion.findMany({
            where: {
              usuarioId: userId,
              createdAt: { gt: lastCheck },
            },
            orderBy: { createdAt: 'asc' },
            select: {
              id:        true,
              tipo:      true,
              titulo:    true,
              mensaje:   true,
              enlace:    true,
              leida:     true,
              createdAt: true,
            },
          })

          lastCheck = new Date()

          if (nuevas.length > 0) {
            send('notifications', nuevas.map(n => ({
              ...n,
              createdAt: n.createdAt.toISOString(),
            })))
          }

          // Also send a heartbeat to keep connection alive
          send('heartbeat', { ts: Date.now() })
        } catch {
          clearInterval(interval)
          try { controller.close() } catch { /* ignore */ }
        }
      }, 8000)

      // Clean up when client disconnects
      return () => clearInterval(interval)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
