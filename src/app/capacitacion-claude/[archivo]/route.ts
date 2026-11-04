import { auth } from '@/lib/auth'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextRequest, NextResponse } from 'next/server'

// Material de la capacitación en Claude (Ayuda → Capacitación). No va en
// /public porque Next sirve esos archivos sin pasar por el login; aquí se
// exige sesión. Solo se sirven los archivos de la lista, nunca rutas libres.
const ARCHIVOS: Record<string, string> = {
  'index.html': 'index.html',   // clase interactiva (13 módulos)
  'guia.html': 'guia.html',     // documento resumen
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ archivo: string }> }) {
  const session = await auth()
  // Redirección relativa: detrás del proxy del VPS req.url trae localhost:3000.
  if (!session) return new NextResponse(null, { status: 307, headers: { Location: '/login' } })

  const { archivo } = await params
  const nombre = ARCHIVOS[archivo]
  if (!nombre) return new NextResponse('No encontrado', { status: 404 })

  const html = await readFile(path.join(process.cwd(), 'contenido', 'capacitacion-claude', nombre), 'utf8')
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store' },
  })
}
