import Link from 'next/link'
import { getPortalSession } from '@/lib/portal-auth'
import { getMuestrasCliente, ETAPA_LABEL, ETAPA_PROGRESO } from '@/lib/portal-data'
import { formatFecha } from '@/lib/format'
import { ChevronRight, FlaskConical } from 'lucide-react'

export default async function PortalDashboardPage() {
  const session = await getPortalSession()
  const muestras = await getMuestrasCliente(session!.clienteId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Tus muestras</h1>
        <p className="text-sm text-slate-500">Seguimiento en tiempo real de cada muestra, desde su recepción hasta el informe final.</p>
      </div>

      {muestras.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center text-slate-500">
          <FlaskConical className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          Aún no tienes muestras registradas.
        </div>
      ) : (
        <div className="space-y-3">
          {muestras.map((m) => {
            const proximaEntrega = m.odas
              .map((o) => o.fechaEntregaCompromiso)
              .filter((d): d is Date => !!d)
              .sort((a, b) => a.getTime() - b.getTime())[0]

            return (
              <Link
                key={m.id}
                href={`/portal/muestras/${m.id}`}
                className="block bg-white rounded-xl border p-5 hover:border-[#13602C]/40 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{m.nombreComercial || m.codigoMuestra}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {m.codigoMuestra} · Recibida el {formatFecha(m.fechaIngreso)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className="inline-block text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: '#e8f3ec', color: '#13602C' }}
                    >
                      {ETAPA_LABEL[m.etapa]}
                    </span>
                    {proximaEntrega && m.etapa !== 'INFORME_DISPONIBLE' && (
                      <p className="text-[11px] text-slate-400 mt-1">Est. entrega: {formatFecha(proximaEntrega)}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${ETAPA_PROGRESO[m.etapa]}%`, backgroundColor: '#13602C' }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-500 shrink-0">{ETAPA_PROGRESO[m.etapa]}%</span>
                  <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
