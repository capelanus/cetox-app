import Link from 'next/link'
import { auth } from '@/lib/auth'
import { ArrowLeft, Trophy, Medal } from 'lucide-react'
import { ACTIVIDADES, ORDEN_ACTIVIDADES } from '@/lib/capacitacion'
import { obtenerRanking } from '@/lib/capacitacion-ranking'
import { formatFecha } from '@/lib/format'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Ranking de la capacitación · CETOX' }

// Ranking público de la evaluación final de la capacitación en Claude: el
// mismo que ve cada persona al final de la clase (lib/capacitacion-ranking).

function colorNota(n: number) {
  if (n >= 14) return { color: '#13602C', bg: '#ecfdf5' }
  if (n >= 11) return { color: '#a16207', bg: '#fefce8' }
  return { color: '#b91c1c', bg: '#fef2f2' }
}
const fmt = (n: number) => n.toLocaleString('es-PE', { maximumFractionDigits: 1 })

function Nota({ n, grande = false }: { n: number | null | undefined; grande?: boolean }) {
  if (n === null || n === undefined) return <span className="text-xs text-slate-400">—</span>
  const c = colorNota(n)
  return (
    <span className={`inline-block rounded-md font-bold tabular-nums ${grande ? 'px-2.5 py-1 text-base' : 'px-2 py-0.5 text-sm'}`}
      style={{ color: c.color, backgroundColor: c.bg }}>
      {fmt(n)}
    </span>
  )
}

const MEDALLAS = [
  { puesto: 2, color: '#9aa5ad', alto: 'pt-5' },
  { puesto: 1, color: '#c9a227', alto: 'pt-9' },
  { puesto: 3, color: '#b07240', alto: 'pt-3' },
]

export default async function NotasCapacitacionPage() {
  const session = await auth()
  const { ranking, resumen } = await obtenerRanking()
  const yo = ranking.find(f => f.usuarioId === session?.user.id)

  return (
    <div className="max-w-5xl">
      <Link href="/ayuda/capacitacion-claude" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3">
        <ArrowLeft className="w-4 h-4" /> Volver a la capacitación
      </Link>
      <div className="mb-5">
        <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-1">
          <Trophy className="w-4 h-4" /> Capacitación: Claude en CETOX
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Ranking de la evaluación final</h1>
        <p className="text-sm text-slate-500 max-w-3xl">
          Tres pruebas con nota del 0 al 20: {ORDEN_ACTIVIDADES.map(a => ACTIVIDADES[a].nombre).join(', ')}.
          La nota final es el promedio. Cuenta el primer intento de cada prueba y, a igual nota, queda arriba quien terminó primero.
        </p>
      </div>

      {yo && (
        <div className="mb-5 rounded-xl px-5 py-4 text-white font-semibold" style={{ backgroundColor: '#13602C' }}>
          {yo.final !== null
            ? <>Tu nota final es {fmt(yo.final)}/20: puesto {yo.puesto} de {resumen.conFinal}.</>
            : <>{(f => `Te ${f === 1 ? 'falta 1 prueba' : `faltan ${f} pruebas`} de ${ORDEN_ACTIVIDADES.length} para entrar al ranking.`)(ORDEN_ACTIVIDADES.length - Object.keys(yo.notas).length)}</>}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-6 max-w-xl">
        {[
          ['Participan', String(resumen.participantes)],
          ['Terminaron', String(resumen.conFinal)],
          ['Promedio final', resumen.promedio === null ? '—' : fmt(resumen.promedio)],
        ].map(([l, v]) => (
          <div key={l} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{l}</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      {/* Podio */}
      <div className="grid grid-cols-3 gap-3 items-end max-w-2xl mb-6">
        {MEDALLAS.map(m => {
          const f = ranking.find(x => x.puesto === m.puesto)
          return (
            <div key={m.puesto} className={`bg-white rounded-xl border border-slate-200 px-3 pb-4 ${m.alto} text-center ${f ? '' : 'opacity-50'}`}
              style={{ borderTop: `6px solid ${m.color}` }}>
              <Medal className="w-5 h-5 mx-auto mb-1" style={{ color: m.color }} />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{m.puesto}.º puesto</p>
              <p className="font-bold text-slate-900 truncate">{f ? f.nombre : 'Libre'}</p>
              {f && <p className="text-xs text-slate-500 truncate">{f.area}</p>}
              {f && <p className="text-2xl font-extrabold tabular-nums mt-1" style={{ color: '#13602C' }}>{fmt(f.final!)}</p>}
            </div>
          )
        })}
      </div>

      {ranking.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          Todavía nadie ha rendido la evaluación final. Las notas aparecen aquí apenas alguien termina una prueba.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3">Persona</th>
                <th className="px-4 py-3">Área</th>
                {ORDEN_ACTIVIDADES.map(a => <th key={a} className="px-4 py-3 text-center">{ACTIVIDADES[a].corto}</th>)}
                <th className="px-4 py-3 text-center">Nota final</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map(f => {
                const esYo = f.usuarioId === session?.user.id
                return (
                  <tr key={f.usuarioId} className={`border-b border-slate-100 last:border-0 ${esYo ? 'bg-emerald-50/60' : ''}`}>
                    <td className="px-4 py-3 text-slate-400 tabular-nums">{f.puesto ?? '—'}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{f.nombre}{esYo && <span className="ml-2 text-[11px] font-semibold text-emerald-700">Tú</span>}</td>
                    <td className="px-4 py-3 text-slate-500">{f.area}</td>
                    {ORDEN_ACTIVIDADES.map(a => <td key={a} className="px-4 py-3 text-center"><Nota n={f.notas[a]} /></td>)}
                    <td className="px-4 py-3 text-center">
                      {f.final !== null ? <Nota n={f.final} grande /> : <span className="text-xs text-slate-400">En curso</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 tabular-nums">{formatFecha(f.terminadoEn ?? f.ultimaActividad)}</td>
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
