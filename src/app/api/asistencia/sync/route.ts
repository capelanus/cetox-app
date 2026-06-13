import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

interface ZkRecord {
  user_id: string
  nombre: string
  timestamp: string // ISO 8601
  tipo: number      // 0=entrada 1=salida 4=extra-entrada 5=extra-salida
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey || apiKey !== process.env.ZK_SYNC_API_KEY) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let records: ZkRecord[]
  try {
    records = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (!Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ insertados: 0, vinculados: 0 })
  }

  // Cargar empleados para hacer match por nombre
  const empleados = await prisma.empleado.findMany({
    where: { activo: true },
    select: { id: true, nombre: true },
  })

  function matchEmpleado(zkNombre: string): string | null {
    const zk = normalizar(zkNombre)
    // Exact match primero
    let match = empleados.find(e => normalizar(e.nombre) === zk)
    if (match) return match.id
    // Partial: el nombre del huellero está contenido en el nombre del ERP o viceversa
    match = empleados.find(e => {
      const erp = normalizar(e.nombre)
      return erp.includes(zk) || zk.includes(erp)
    })
    return match?.id ?? null
  }

  let insertados = 0
  let vinculados = 0

  for (const r of records) {
    const empleadoId = matchEmpleado(r.nombre)
    if (empleadoId) vinculados++

    try {
      await prisma.asistencia.upsert({
        where: { zkUserId_timestamp: { zkUserId: r.user_id, timestamp: new Date(r.timestamp) } },
        create: {
          zkUserId:   r.user_id,
          zkNombre:   r.nombre,
          timestamp:  new Date(r.timestamp),
          tipo:       r.tipo,
          empleadoId: empleadoId ?? undefined,
        },
        update: {
          empleadoId: empleadoId ?? undefined,
        },
      })
      insertados++
    } catch {
      // registro duplicado — ignorar
    }
  }

  return NextResponse.json({ insertados, vinculados, total: records.length })
}

function normalizar(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}
