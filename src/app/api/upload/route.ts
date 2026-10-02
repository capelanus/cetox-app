import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  // Sin sesión no se sube nada: el almacén es de pago y este endpoint lo
  // usan todos los formularios con adjuntos.
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  // addRandomSuffix evita el 500 de "blob already exists": dos proveedores
  // mandando "cotizacion.pdf" son el caso normal, no un error del usuario.
  const blob = await put(file.name, file, { access: 'public', addRandomSuffix: true })
  return NextResponse.json({ url: blob.url })
}
