import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// Recibe los formularios de cetoxlab.com (Solicitar análisis / Contacto /
// Libro de Reclamaciones / chat) y deja constancia en el ERP aunque el correo
// a servicios@cetox.com.pe falle o se demore. No usa sesión: quien llama es
// la función serverless del sitio web, autenticada con una clave compartida
// (mismo patrón que /api/asistencia/sync con el huellero).
const FORMULARIOS = ['solicitud', 'contacto', 'reclamo', 'chat']

// Campos con columna propia (los de "Solicitar análisis"). El nombre de la
// clave en el payload no siempre coincide con el de la columna: el formulario
// web manda "fecha", la columna se llama "fechaRequerida" para no chocar con
// createdAt.
const CAMPOS: { clave: string; columna: string }[] = [
  'empresa', 'telefono', 'ubicacion', 'sector', 'matriz', 'analisis', 'objetivo',
  'norma', 'cantidad', 'acreditado', 'detalle', 'mensaje',
].map(c => ({ clave: c, columna: c }))
CAMPOS.push({ clave: 'fecha', columna: 'fechaRequerida' })

// El resto de campos (de Contacto y Libro de Reclamaciones, que no tienen
// columna propia) se guardan como texto legible en "otrosDatos" para no
// perder nada aunque esos formularios cambien de campos más adelante.
const EXTRA_LABELS: Record<string, string> = {
  documento: 'Documento de identidad',
  domicilio: 'Domicilio',
  tipo: 'Tipo',
  servicio: 'Servicio contratado',
  pedido: 'Pedido',
  motivo: 'Motivo de contacto',
  adjunto: 'Adjunto (nombre de archivo)',
}

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
  for (const { clave, columna } of CAMPOS) {
    resto[columna] = limpiar(fields[clave])
  }
  const otrosDatos = Object.entries(EXTRA_LABELS)
    .map(([clave, label]) => { const v = limpiar(fields[clave]); return v ? `${label}: ${v}` : null })
    .filter(Boolean)
    .join('\n') || undefined
  const pagina = limpiar(body.page)

  const solicitud = await prisma.solicitudWeb.create({
    data: { formulario, nombre, correo, pagina, otrosDatos, ...resto },
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
