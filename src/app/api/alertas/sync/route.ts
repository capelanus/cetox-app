/**
 * Endpoint manual / para cron job: sincroniza notificaciones de alertas
 * de vencimiento. Idempotente por día (no crea duplicados).
 */
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sincronizarNotificacionesAlertas, sincronizarNotificacionesAseguramiento } from '@/lib/alertas'

export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const [alertas, aseguramiento] = await Promise.all([
    sincronizarNotificacionesAlertas(),
    sincronizarNotificacionesAseguramiento(),
  ])
  return NextResponse.json({ ok: true, creadas: alertas.creadas + aseguramiento.creadas })
}
