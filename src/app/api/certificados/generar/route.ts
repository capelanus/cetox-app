import { NextRequest, NextResponse } from 'next/server'
import { requireRol } from '@/lib/roles'
import { generarCertificadoPdf, type TipoReconocimiento } from '@/lib/certificado'

const TIPOS: TipoReconocimiento[] = ['participación', 'desempeño', 'logro']

export async function POST(req: NextRequest) {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_ADMINISTRACION'])

  const body = await req.json() as {
    nombre?: string
    tipoReconocimiento?: string
    motivo?: string
    lugar?: string
    fecha?: string
  }

  const nombre = (body.nombre ?? '').trim()
  const motivo = (body.motivo ?? '').trim()
  const lugar  = (body.lugar ?? '').trim()
  const fecha  = (body.fecha ?? '').trim()
  const tipo   = body.tipoReconocimiento as TipoReconocimiento

  if (!nombre) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
  if (!motivo) return NextResponse.json({ error: 'Motivo requerido' }, { status: 400 })
  if (!lugar)  return NextResponse.json({ error: 'Lugar requerido' },  { status: 400 })
  if (!fecha)  return NextResponse.json({ error: 'Fecha requerida' },  { status: 400 })
  if (!TIPOS.includes(tipo)) return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })

  const pdfBytes = await generarCertificadoPdf({ nombre, tipoReconocimiento: tipo, motivo, lugar, fecha })

  const slug = nombre
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
  const filename = `certificado-${slug}.pdf`

  return new NextResponse(pdfBytes as unknown as BodyInit, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-store',
    },
  })
}
