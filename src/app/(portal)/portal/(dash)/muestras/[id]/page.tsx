import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPortalSession } from '@/lib/portal-auth'
import { getMuestraCliente, ETAPAS, ETAPA_LABEL } from '@/lib/portal-data'
import { formatFecha } from '@/lib/format'
import { ArrowLeft, CheckCircle2, Circle, Download, FileText } from 'lucide-react'

const AREA_LABELS: Record<string, string> = { Q: 'Química', B: 'Biología', M: 'Microbiología' }
const AREA_COLOR: Record<string, string> = { Q: '#1c59bf', B: '#13602C', M: '#9e5c0f' }

export default async function PortalMuestraPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getPortalSession()
  const { id } = await params
  const muestra = await getMuestraCliente(session!.clienteId, id)
  if (!muestra) notFound()

  const etapaIdx = ETAPAS.indexOf(muestra.etapa)

  return (
    <div className="space-y-6">
      <Link href="/portal" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Tus muestras
      </Link>

      <div>
        <h1 className="text-xl font-bold text-slate-900">{muestra.nombreComercial || muestra.codigoMuestra}</h1>
        <p className="text-sm text-slate-500">
          {muestra.codigoMuestra} · Recibida el {formatFecha(muestra.fechaIngreso)}
        </p>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border p-5">
        <div className="space-y-4">
          {ETAPAS.map((etapa, i) => {
            const current = i === etapaIdx && muestra.etapa !== 'INFORME_DISPONIBLE'
            const isDone = i < etapaIdx || (i === etapaIdx && muestra.etapa === 'INFORME_DISPONIBLE')
            return (
              <div key={etapa} className="flex items-start gap-3">
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: '#13602C' }} />
                ) : current ? (
                  <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                    <span className="absolute inline-flex h-3 w-3 rounded-full opacity-60 animate-ping" style={{ backgroundColor: '#13602C' }} />
                    <span className="relative inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: '#13602C' }} />
                  </span>
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-slate-300" />
                )}
                <div>
                  <p className={`text-sm font-medium ${isDone || current ? 'text-slate-900' : 'text-slate-400'}`}>
                    {ETAPA_LABEL[etapa]}
                  </p>
                  {current && <p className="text-xs text-slate-500">En curso</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Ensayos por área */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Ensayos solicitados</h2>
        {muestra.odas.map((oda) => {
          const informeDisponible = oda.estado === 'INFORME_EMITIDO' && oda.informe?.certificadoQR
          return (
            <div key={oda.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-center justify-between mb-3">
                <span
                  className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                  style={{ backgroundColor: AREA_COLOR[oda.area] ?? '#13602C' }}
                >
                  {AREA_LABELS[oda.area] ?? oda.area}
                </span>
                {informeDisponible && oda.informe ? (
                  <Link
                    href={`/api/portal/informes/${oda.informe.id}/pdf`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg text-white"
                    style={{ backgroundColor: '#13602C' }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Descargar informe
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                    <FileText className="h-3.5 w-3.5" />
                    Informe pendiente
                  </span>
                )}
              </div>
              <ul className="space-y-1.5">
                {oda.items.map((it) => (
                  <li key={it.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{it.ensayo.nombre}</span>
                    <span className="text-xs text-slate-400">{formatFecha(it.fechaEntregaCompromiso)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
