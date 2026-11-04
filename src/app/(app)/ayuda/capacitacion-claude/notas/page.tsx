import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ArrowLeft, Trophy } from 'lucide-react'
import { ACTIVIDADES, type Actividad } from '@/lib/capacitacion'
import { AREA_LABELS, ROL_LABELS } from '@/lib/constants'
import { formatFecha } from '@/lib/format'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Notas de la capacitación · CETOX' }

// Notas publicadas para todo el personal: una fila por persona que hizo al
// menos una actividad puntuada. Nota final = promedio de las dos
// actividades; solo existe cuando ambas están hechas.
const ORDEN: Actividad[] = ['duelo', 'semaforo']

function colorNota(n: number) {
  if (n >= 14) return { color: '#13602C', bg: '#ecfdf5' }
  if (n >= 11) return { color: '#a16207', bg: '#fefce8' }
  return { color: '#b91c1c', bg: '#fef2f2' }
}
const fmt = (n: number) => n.toLocaleString('es-PE', { maximumFractionDigits: 1 })

function Nota({ n, grande = false }: { n: number | null; grande?: boolean }) {
  if (n === null) return <span className="text-xs text-slate-400">Pendiente</span>
  const c = colorNota(n)
  return (
    <span className={`inline-block rounded-md font-bold tabular-nums ${grande ? 'px-2.5 py-1 text-base' : 'px-2 py-0.5 text-sm'}`}
      style={{ color: c.color, backgroundColor: c.bg }}>
      {fmt(n)}
    </span>
  )
}

export default async function NotasCapacitacionPage() {
  const session = await auth()
  const notas = await prisma.capacitacionNota.findMany({
    include: { usuario: { select: { id: true, nombre: true, rol: true, area: true } } },
  })

  const porPersona = new Map<string, {
    id: string; nombre: string; area: string; notas: Partial<Record<Actividad, number>>; ultima: Date
  }>()
  for (const n of notas) {
    const u = n.usuario
    const p = porPersona.get(u.id) ?? {
      id: u.id, nombre: u.nombre,
      area: (u.area && AREA_LABELS[u.area]) || ROL_LABELS[u.rol] || u.rol,
      notas: {}, ultima: n.createdAt,
    }
    p.notas[n.actividad as Actividad] = n.nota
    if (n.createdAt > p.ultima) p.ultima = n.createdAt
    porPersona.set(u.id, p)
  }
  const filas = [...porPersona.values()].map(p => {
    const hechas = ORDEN.filter(a => p.notas[a] !== undefined)
    const final = hechas.length === ORDEN.length
      ? Math.round((ORDEN.reduce((s, a) => s + (p.notas[a] ?? 0), 0) / ORDEN.length) * 10) / 10
      : null
    return { ...p, final }
  }).sort((a, b) =>
    (b.final ?? -1) - (a.final ?? -1) || a.nombre.localeCompare(b.nombre, 'es'))

  const completas = filas.filter(f => f.final !== null)
  const promedio = completas.length ? completas.reduce((s, f) => s + (f.final ?? 0), 0) / completas.length : null

  return (
    <div className="max-w-5xl">
      <Link href="/ayuda/capacitacion-claude" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3">
        <ArrowLeft className="w-4 h-4" /> Volver a la capacitación
      </Link>
      <div className="mb-5">
        <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-1">
          <Trophy className="w-4 h-4" /> Capacitación: Claude en CETOX
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Notas de la capacitación</h1>
        <p className="text-sm text-slate-500 max-w-3xl">
          Notas del 0 al 20 de las actividades puntuadas: {ORDEN.map(a => `${ACTIVIDADES[a].nombre} (${ACTIVIDADES[a].modulo})`).join(' y ')}.
          Cuenta el primer intento completo de cada persona; los siguientes son de práctica. La nota final es el promedio de las dos.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5 max-w-xl">
        {[
          ['Participantes', String(filas.length)],
          ['Con nota final', String(completas.length)],
          ['Promedio final', promedio === null ? '—' : fmt(Math.round(promedio * 10) / 10)],
        ].map(([l, v]) => (
          <div key={l} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{l}</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      {filas.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          Todavía nadie ha completado una actividad puntuada. Las notas aparecen aquí apenas alguien termina el Duelo de pedidos o el Semáforo de datos.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3">Persona</th>
                <th className="px-4 py-3">Área</th>
                {ORDEN.map(a => <th key={a} className="px-4 py-3 text-center">{ACTIVIDADES[a].nombre}</th>)}
                <th className="px-4 py-3 text-center">Nota final</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => {
                const yo = f.id === session?.user.id
                return (
                  <tr key={f.id} className={`border-b border-slate-100 last:border-0 ${yo ? 'bg-emerald-50/60' : ''}`}>
                    <td className="px-4 py-3 text-slate-400 tabular-nums">{f.final !== null ? i + 1 : '—'}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{f.nombre}{yo && <span className="ml-2 text-[11px] font-semibold text-emerald-700">Tú</span>}</td>
                    <td className="px-4 py-3 text-slate-500">{f.area}</td>
                    {ORDEN.map(a => <td key={a} className="px-4 py-3 text-center"><Nota n={f.notas[a] ?? null} /></td>)}
                    <td className="px-4 py-3 text-center"><Nota n={f.final} grande /></td>
                    <td className="px-4 py-3 text-slate-500 tabular-nums">{formatFecha(f.ultima)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-slate-400 mt-3">Colores: verde desde 14, ámbar de 11 a 13,9 y rojo por debajo de 11.</p>
    </div>
  )
}
