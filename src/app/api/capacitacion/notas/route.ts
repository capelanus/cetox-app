import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { ACTIVIDADES, notaSobre20, type Actividad } from '@/lib/capacitacion'
import { obtenerRanking } from '@/lib/capacitacion-ranking'

// La clase (contenido/capacitacion-claude/index.html) envía aquí las
// respuestas al terminar una prueba de la evaluación final. El primer intento completo
// queda como nota oficial; los siguientes solo cuentan como práctica.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Inicia sesión en el ERP para registrar tu nota.' }, { status: 401 })

  let body: { actividad?: string; respuestas?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 }) }

  const actividad = body.actividad as Actividad
  const def = ACTIVIDADES[actividad]
  if (!def) return NextResponse.json({ error: 'Actividad desconocida.' }, { status: 400 })
  const respuestas = Array.isArray(body.respuestas) ? body.respuestas.map(r => String(r).slice(0, 2)) : []
  if (respuestas.length !== def.clave.length) {
    return NextResponse.json({ error: 'Faltan respuestas para calcular la nota.' }, { status: 400 })
  }

  const aciertos = respuestas.filter((r, i) => r === def.clave[i]).length
  const total = def.clave.length
  const nota = notaSobre20(aciertos, total)
  const usuarioId = session.user.id

  const previa = await prisma.capacitacionNota.findUnique({ where: { usuarioId_actividad: { usuarioId, actividad } } })
  if (previa) {
    await prisma.capacitacionNota.update({ where: { id: previa.id }, data: { intentos: { increment: 1 } } })
    return NextResponse.json({ ok: true, oficial: false, nota, notaOficial: previa.nota, aciertos, total })
  }
  await prisma.capacitacionNota.create({ data: { usuarioId, actividad, aciertos, total, nota, respuestas } })
  return NextResponse.json({ ok: true, oficial: true, nota, notaOficial: nota, aciertos, total })
}

// Marcador de la clase: el ranking de todo el personal (público dentro del
// ERP, igual que /ayuda/capacitacion-claude/notas) y las notas de quien pide.
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Inicia sesión en el ERP.' }, { status: 401 })
  const { ranking, resumen } = await obtenerRanking()
  const yo = ranking.find(f => f.usuarioId === session.user.id) ?? null
  return NextResponse.json(
    { ranking: ranking.map(f => ({ ...f, esYo: f.usuarioId === session.user.id })), resumen, yo },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
