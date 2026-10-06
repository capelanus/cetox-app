import { requireRol, type Rol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ClipboardList, FlaskConical } from 'lucide-react'
import { formatNumSET, formatNumODA, formatFechaHora } from '@/lib/format'
import { PrintButton } from '@/components/print-button'
import { labPorSlug, ROLES_ABREN_COUNTER } from '@/lib/counters'

export const dynamic = 'force-dynamic'

const ESTADO: Record<string, { label: string; cls: string }> = {
  EMITIDA:       { label: 'Pendiente de entrega', cls: 'bg-slate-100 text-slate-600' },
  ENTREGADA_LAB: { label: 'En el counter',        cls: 'bg-amber-100 text-amber-800' },
  RECIBIDA:      { label: 'Recibida',             cls: 'bg-green-100 text-green-700' },
}

// Registro 1 — Entrega de muestras. Se deriva de las ODAs del laboratorio:
// cada fila es una muestra con quién la dejó en el counter y quién la
// recepcionó. Reemplaza al cuaderno de firmas; se imprime por año.
export default async function EntregasLabPage({
  params,
  searchParams,
}: {
  params: Promise<{ lab: string }>
  searchParams: Promise<{ anio?: string }>
}) {
  const { lab: slug } = await params
  const lab = labPorSlug(slug)
  if (!lab) notFound()

  const session = await requireRol([...ROLES_ABREN_COUNTER, 'SUPER_ADMIN'] as Rol[])
  if (session.user.rol === 'ANALISTA' && session.user.area && session.user.area !== lab.area) {
    return <p className="text-sm text-slate-500">Este registro es del laboratorio de {lab.nombre}.</p>
  }

  const sp = await searchParams
  const hoy = new Date().getFullYear()
  const anio = parseInt(sp.anio ?? '') || hoy

  const odas = await prisma.oDA.findMany({
    where: { area: lab.area, anio, set: { estado: { not: 'ANULADO' } }, estado: { not: 'ANULADO' } },
    orderBy: [{ fechaEntregaLab: 'desc' }, { numero: 'desc' }],
    include: {
      set: { select: { numero: true, anio: true, nombreComercial: true, numeroMuestras: true, cliente: { select: { razonSocial: true } } } },
    },
  })

  const ids = [...new Set(odas.flatMap(o => [o.entregadaPorId, o.recibidaPorId]).filter((x): x is string => Boolean(x)))]
  const usuarios = ids.length ? await prisma.usuario.findMany({ where: { id: { in: ids } }, select: { id: true, nombre: true } }) : []
  const nombre = new Map(usuarios.map(u => [u.id, u.nombre]))

  const anios = await prisma.oDA.findMany({ where: { area: lab.area }, distinct: ['anio'], select: { anio: true }, orderBy: { anio: 'desc' } })
  const opciones = [...new Set([hoy, ...anios.map(a => a.anio)])].sort((a, b) => b - a)

  const resumen = {
    pendientes: odas.filter(o => o.estado === 'EMITIDA').length,
    enCounter: odas.filter(o => o.estado === 'ENTREGADA_LAB').length,
    recibidas: odas.filter(o => !!o.fechaRecepcion).length,
  }

  return (
    <div className="max-w-[1200px]">
      <style>{`@media print { .no-print { display: none !important; } body { background: white; } }`}</style>

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-1">
            <FlaskConical className="w-4 h-4" /> {lab.nombre}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Entrega de muestras — {anio}</h1>
          <p className="text-sm text-slate-500">
            Registro 1 · quién dejó cada muestra en el counter y quién la recepcionó en el laboratorio.
          </p>
        </div>
        <div className="no-print flex items-center gap-2">
          <form className="flex items-center gap-2 text-sm">
            <label className="text-slate-600">Año</label>
            <select name="anio" defaultValue={anio} className="border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white">
              {opciones.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <button type="submit" className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50">Ver</button>
          </form>
          <Link href={`/counter/${lab.slug}`} target="_blank" className="px-3 py-1.5 rounded-md text-sm font-medium border" style={{ borderColor: '#13602C', color: '#13602C' }}>
            Abrir counter
          </Link>
          <PrintButton />
        </div>
      </div>

      <div className="no-print grid grid-cols-3 gap-3 mb-5 max-w-xl">
        {[
          ['Pendientes de entrega', resumen.pendientes, '#64748b'],
          ['En el counter', resumen.enCounter, '#b45309'],
          ['Recibidas', resumen.recibidas, '#15803d'],
        ].map(([l, v, c]) => (
          <div key={l as string} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">{l}</p>
            <p className="text-2xl font-bold" style={{ color: c as string }}>{v}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Código de muestra</th>
              <th className="text-left px-4 py-3 font-semibold">Muestra</th>
              <th className="text-left px-4 py-3 font-semibold">Entrega a lab</th>
              <th className="text-left px-4 py-3 font-semibold">Entregó</th>
              <th className="text-left px-4 py-3 font-semibold">Recepción</th>
              <th className="text-left px-4 py-3 font-semibold">Recibió</th>
              <th className="text-left px-4 py-3 font-semibold no-print">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {odas.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Sin muestras de {lab.nombre} en {anio}.</td></tr>
            )}
            {odas.map(o => {
              const ent = formatFechaHora(o.fechaEntregaLab)
              const rec = formatFechaHora(o.fechaRecepcion)
              const est = ESTADO[o.estado] ?? { label: o.estado, cls: 'bg-slate-100 text-slate-600' }
              return (
                <tr key={o.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2.5">
                    <Link href={`/oda/${o.id}`} className="font-mono font-semibold text-[#13602C] hover:underline">
                      {formatNumSET(o.set.numero, o.set.anio)}
                    </Link>
                    <p className="text-[11px] text-slate-400">{formatNumODA(o.numero, o.anio)}{o.set.numeroMuestras ? ` · ${o.set.numeroMuestras} muestras` : ''}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-slate-800">{o.set.nombreComercial ?? '—'}</p>
                    <p className="text-xs text-slate-500">{o.set.cliente.razonSocial}</p>
                  </td>
                  <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap">{ent.fecha}{ent.hora ? <span className="text-slate-400"> {ent.hora}</span> : ''}</td>
                  <td className="px-4 py-2.5 text-slate-700">{o.entregadaPorId ? nombre.get(o.entregadaPorId) ?? '—' : '—'}</td>
                  <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap">{rec.fecha}{rec.hora ? <span className="text-slate-400"> {rec.hora}</span> : ''}</td>
                  <td className="px-4 py-2.5 text-slate-700">{o.recibidaPorId ? nombre.get(o.recibidaPorId) ?? '—' : '—'}</td>
                  <td className="px-4 py-2.5 no-print">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${est.cls}`}>{est.label}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1">
        <ClipboardList className="w-3.5 h-3.5" />
        Las firmas corresponden al PIN con el que cada persona confirmó en la tablet del counter o a su sesión si recibió desde la ODA.
      </p>
    </div>
  )
}
