import { NextRequest, NextResponse } from 'next/server'
import { requireRol } from '@/lib/roles'
import { generarCertificadoPdf, type TipoReconocimiento } from '@/lib/certificado'

const TIPOS: TipoReconocimiento[] = ['participación', 'desempeño', 'logro']

export async function POST(req: NextRequest) {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_ADMINISTRACION'])

  const body = await req.json() as {
    nombre?:             string
    tipoReconocimiento?: string
    motivo?:             string
    lugar?:              string
    dias?:               unknown
    horas?:              unknown
    expositor?:          string
  }

  const nombre = (body.nombre ?? '').trim()
  const motivo = (body.motivo ?? '').trim()
  const lugar  = (body.lugar  ?? '').trim()
  const tipo   = body.tipoReconocimiento as TipoReconocimiento
  const dias   = Array.isArray(body.dias)
    ? (body.dias as unknown[]).filter((d): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))
    : []
  const expositor = (body.expositor ?? '').trim()
  const horasRaw  = typeof body.horas === 'number' ? body.horas
                   : typeof body.horas === 'string' ? Number(body.horas)
                   : undefined
  const horas = Number.isFinite(horasRaw) && (horasRaw as number) > 0
    ? Math.round(horasRaw as number)
    : undefined

  if (!nombre)              return NextResponse.json({ error: 'Nombre requerido' },     { status: 400 })
  if (!motivo)              return NextResponse.json({ error: 'Motivo requerido' },     { status: 400 })
  if (!lugar)               return NextResponse.json({ error: 'Lugar requerido' },      { status: 400 })
  if (dias.length === 0)    return NextResponse.json({ error: 'Selecciona al menos un día' }, { status: 400 })
  if (!TIPOS.includes(tipo)) return NextResponse.json({ error: 'Tipo inválido' },       { status: 400 })

  const pdfBytes = await generarCertificadoPdf({
    nombre, tipoReconocimiento: tipo, motivo, lugar, dias,
    horas,
    expositor: expositor || undefined,
  })

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
