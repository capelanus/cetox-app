import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { setPortalSession } from '@/lib/portal-auth'

export async function POST(req: NextRequest) {
  const { ruc, password } = await req.json().catch(() => ({ ruc: '', password: '' }))
  if (!ruc || !password) {
    return NextResponse.json({ error: 'RUC y contraseña son requeridos' }, { status: 400 })
  }

  const cliente = await prisma.cliente.findUnique({ where: { ruc: String(ruc).trim() } })
  if (!cliente || !cliente.activo || !cliente.portalActivo || !cliente.portalPasswordHash) {
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
  }

  const valid = await compare(String(password), cliente.portalPasswordHash)
  if (!valid) return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })

  await setPortalSession({ clienteId: cliente.id, razonSocial: cliente.razonSocial })
  return NextResponse.json({ ok: true })
}
