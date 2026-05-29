import { prisma } from './prisma'
import { auth } from './auth'
import { headers } from 'next/headers'

type AuditAccion = 'CREATE' | 'UPDATE' | 'DELETE'

interface AuditOptions {
  accion:    AuditAccion
  entidad:   string
  entidadId: string
  detalle?:  Record<string, unknown>
  userId?:   string   // override session userId
}

/**
 * Registers an audit log entry.
 * Call this from server actions or API routes after any important mutation.
 *
 * Example:
 *   await audit({ accion: 'UPDATE', entidad: 'Cotizacion', entidadId: id,
 *                 detalle: { estado: { antes: 'BORRADOR', despues: 'ENVIADA' } } })
 */
export async function audit({
  accion,
  entidad,
  entidadId,
  detalle,
  userId: overrideUserId,
}: AuditOptions) {
  try {
    let usuarioId = overrideUserId
    if (!usuarioId) {
      const session = await auth().catch(() => null)
      usuarioId = session?.user?.id ?? undefined
    }

    let ip: string | undefined
    try {
      const h = await headers()
      ip = h.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? h.get('x-real-ip')
        ?? undefined
    } catch { /* headers not available */ }

    await prisma.auditLog.create({
      data: {
        usuarioId:  usuarioId ?? null,
        accion,
        entidad,
        entidadId,
        detalle:    detalle ? JSON.stringify(detalle) : null,
        ip:         ip ?? null,
      },
    })
  } catch {
    // Audit failures must NEVER crash the main operation
    // Log silently in production
    if (process.env.NODE_ENV === 'development') {
      console.warn('[audit] Failed to write audit log')
    }
  }
}
