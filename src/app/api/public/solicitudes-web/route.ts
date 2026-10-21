import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// Recibe los formularios de cetoxlab.com (Solicitar análisis / Contacto /
// Libro de Reclamaciones / chat) y deja constancia en el ERP aunque el correo
// a servicios@cetox.com.pe falle o se demore. No usa sesión: quien llama es
// la función serverless del sitio web, autenticada con una clave compartida
// (mismo patrón que /api/asistencia/sync con el huellero).
const FORMULARIOS = ['solicitud', 'contacto', 'reclamo', 'chat']

// Campos de texto libre esperados del formulario web; cualquier otra clave
// del payload se ignora.
const CAMPOS = [
  'nombre', 'empresa', 'correo', 'telefono', 'ubicacion', 'sector',
  'matriz', 'analisis', 'objetivo', 'norma', 'cantidad', 'acreditado',
  'fechaRequerida', 'detalle', 'mensaje',
] as const

function limpiar(v: unknown): string | undefined {
  if (v == null) return undefined
  const s = String(v).replace(/\s+/g, ' ').trim().slice(0, 2000)
  return s || undefined
}

const TITULOS: Record<string, string> = {
  solicitud: 'Solicitud de análisis',
  contacto: 'Mensaje de contacto',
  reclamo: 'Libro de Reclamaciones',
  chat: 'Lead desde el asistente',
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey || apiKey !== process.env.WEB_LEAD_API_KEY) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const formulario = FORMULARIOS.includes(String(body.form)) ? String(body.form) : 'solicitud'
  const fields = (body.fields && typeof body.fields === 'object' ? body.fields : {}) as Record<string, unknown>

  const nombre = limpiar(fields.nombre)
  const correo = limpiar(fields.correo)
  const emailOk = correo && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
  if (!nombre || !emailOk) {
    return NextResponse.json({ error: 'Faltan nombre o correo válidos' }, { status: 422 })
  }

  const resto: Record<string, string | undefined> = {}
  for (const campo of CAMPOS) {
    if (campo === 'nombre' || campo === 'correo') continue
    resto[campo] = limpiar(fields[campo])
  }
  const pagina = limpiar(body.page)

  const solicitud = await prisma.solicitudWeb.create({
    data: { formulario, nombre, correo, pagina, ...resto },
  })

  // Avisar a Administración: mismos roles que ya administran counters/RRHH.
  const destinatarios = await prisma.usuario.findMany({
    where: { rol: { in: ['ADMINISTRACION', 'DIRECTOR_ADMINISTRACION'] }, activo: true },
    select: { id: true },
  })
  if (destinatarios.length > 0) {
    await prisma.notificacion.createMany({
      data: destinatarios.map((u) => ({
        usuarioId: u.id,
        tipo: 'SOLICITUD_WEB',
        titulo: `Nueva solicitud web — ${TITULOS[formulario]}`,
        mensaje: `${nombre}${resto.empresa ? ` (${resto.empresa})` : ''} escribió desde ${pagina || 'cetoxlab.com'}.`,
        enlace: '/administracion/solicitudes-web',
      })),
    })
  }

  return NextResponse.json({ ok: true, id: solicitud.id })
}
