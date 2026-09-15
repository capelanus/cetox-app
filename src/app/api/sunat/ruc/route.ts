import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// Consulta datos de una empresa por RUC en SUNAT vía Decolecta (sucesor de apis.net.pe).
// Requiere DECOLECTA_API_TOKEN (cuenta gratuita en https://decolecta.com).
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const ruc = req.nextUrl.searchParams.get('ruc')?.trim() ?? ''
  if (!/^\d{11}$/.test(ruc)) {
    return NextResponse.json({ error: 'El RUC debe tener 11 dígitos' }, { status: 400 })
  }

  const token = process.env.DECOLECTA_API_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Búsqueda de RUC no configurada (falta DECOLECTA_API_TOKEN)' }, { status: 503 })
  }

  const res = await fetch(`https://api.decolecta.com/v1/sunat/ruc?numero=${ruc}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
  })

  if (res.status === 422) {
    return NextResponse.json({ error: 'RUC no válido o no encontrado en SUNAT' }, { status: 404 })
  }
  if (!res.ok) {
    return NextResponse.json({ error: 'No se pudo consultar SUNAT en este momento' }, { status: 502 })
  }

  const data = await res.json()

  const direccionPartes = [
    data.via_tipo, data.via_nombre, data.numero, data.zona_tipo, data.zona_codigo,
  ].filter(Boolean).join(' ')
  const direccion = direccionPartes || data.direccion || null
  const ubicacion = [data.distrito, data.provincia, data.departamento].filter(Boolean).join(', ')

  return NextResponse.json({
    razonSocial: data.razon_social ?? null,
    direccion: [direccion, ubicacion].filter(Boolean).join(' - ') || null,
    estado: data.estado ?? null,
    condicion: data.condicion ?? null,
  })
}
