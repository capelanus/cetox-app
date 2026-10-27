import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// Autoría científica de los artículos del blog de cetoxlab.com. Datos públicos
// por diseño (se muestran en la web), de solo lectura, sin sesión. La web
// los pide por fetch desde el navegador, de ahí el CORS explícito.
export const dynamic = 'force-dynamic'

const ORIGENES = new Set([
  'https://cetoxlab.com', 'https://www.cetoxlab.com', 'https://revision.cetoxlab.tech',
  'http://127.0.0.1:8080', 'http://localhost:8080',
])

function cors(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  return {
    'Access-Control-Allow-Origin': ORIGENES.has(origin) ? origin : 'https://cetoxlab.com',
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=300',
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: cors(req) })
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')?.trim()
  const filas = await prisma.blogArticulo.findMany({
    where: slug ? { slug } : undefined,
    select: {
      slug: true, estado: true, revisorNombre: true, revisorCargo: true, revisorColegiatura: true, fechaRevision: true,
    },
  })
  const articulos = filas.map(f => ({
    slug: f.slug,
    estado: f.estado,
    revisor: f.estado === 'REVISADO'
      ? { nombre: f.revisorNombre, cargo: f.revisorCargo, colegiatura: f.revisorColegiatura }
      : null,
    fechaRevision: f.estado === 'REVISADO' && f.fechaRevision ? f.fechaRevision.toISOString().slice(0, 10) : null,
  }))

  if (slug) {
    return NextResponse.json(articulos[0] ?? { slug, estado: 'DESCONOCIDO', revisor: null, fechaRevision: null }, { headers: cors(req) })
  }
  return NextResponse.json({ articulos }, { headers: cors(req) })
}
