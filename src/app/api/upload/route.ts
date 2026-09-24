import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  // addRandomSuffix evita el 500 de "blob already exists": dos proveedores
  // mandando "cotizacion.pdf" son el caso normal, no un error del usuario.
  const blob = await put(file.name, file, { access: 'public', addRandomSuffix: true })
  return NextResponse.json({ url: blob.url })
}
