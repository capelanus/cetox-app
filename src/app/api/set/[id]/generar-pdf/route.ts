import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { formatNumSET } from '@/lib/format'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import { SetDocumento } from '@/lib/pdf-react/set-documento'

// El PDF se maqueta con @react-pdf/renderer (JSX + flexbox) en vez de dibujar
// a mano con pdf-lib: el contenido fluye y pagina solo según lo que de verdad
// ocupa, sin tener que calcular alturas ni reservar espacio a pulso. Ver
// src/lib/pdf-react/set-documento.tsx.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const set = await prisma.sET.findUnique({
    where: { id },
    include: {
      cliente: true,
      cotizacion: { include: { facturasCliente: { where: { estado: { not: 'ANULADA' } }, orderBy: { fechaEmision: 'asc' } } } },
      creadoPor: true,
      odas: { include: { items: { include: { ensayo: true } } }, orderBy: { numero: 'asc' } },
    },
  })
  if (!set) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const numSET = formatNumSET(set.numero, set.anio)
  const buffer = await renderToBuffer(createElement(SetDocumento, { set, numSET }) as ReactElement<DocumentProps>)

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="SET-${numSET}.pdf"`,
    },
  })
}
