import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle2, Circle, Clock } from 'lucide-react'
import { formatFecha, formatNumODA, formatNumInforme } from '@/lib/format'
import { recibirODA, iniciarEjecucionODA } from '@/app/actions/oda'
import { ResultadoForm } from '@/components/forms/resultado-form'

const AREA_LABELS: Record<string, string> = { Q: 'Química', B: 'Biología', M: 'Microbiología' }
const ESTADO_LABELS: Record<string, string> = {
  EMITIDA: 'Emitida',
  RECIBIDA: 'Recibida',
  EN_EJECUCION: 'En ejecución',
  CON_RESULTADO: 'Con resultado',
  INFORME_EMITIDO: 'Informe emitido',
}

export default async function ODADetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const oda = await prisma.oDA.findUnique({
    where: { id },
    include: {
      items: { include: { ensayo: true }, orderBy: { fechaEntregaCompromiso: 'asc' } },
      set: { include: { cliente: true, cotizacion: true } },
      informe: true,
    },
  })
  if (!oda) notFound()

  const rol = session?.user.rol ?? ''
  const esAnalista = rol === 'ANALISTA' || rol === 'SUPER_ADMIN'
  const miArea = session?.user.area
  const puedoCargar = esAnalista && (miArea === oda.area || rol === 'SUPER_ADMIN') && oda.estado === 'EN_EJECUCION'
  const set = oda.set

  const recibirAction = recibirODA.bind(null, id)
  const iniciarAction = iniciarEjecucionODA.bind(null, id)

  const muestra = [
    { label: 'Tipo de muestra', value: set.tipoMuestra },
    { label: 'Ingrediente activo', value: set.ingredienteActivo },
    { label: 'Formulación', value: set.formulacion },
    // Edad solo aplica para muestras de paciente (área Química); Biología recibe productos
    ...(oda.area === 'Q' ? [{ label: 'Edad del paciente', value: set.edadPaciente }] : []),
    { label: 'Condiciones ambientales', value: set.condicionesAmbientales },
    { label: 'N° de muestras', value: set.numeroMuestras?.toString() },
    { label: 'Peso / Volumen', value: set.pesoVolumen },
    { label: 'Código de muestra', value: set.codigoMuestra },
    { label: 'Otra indicación', value: set.otraIndicacion },
  ]

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/oda">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />ODA</Button>
        </Link>
        <h1 className="text-xl font-bold text-slate-900">{formatNumODA(oda.numero, oda.anio)}</h1>
        <Badge variant="outline">{AREA_LABELS[oda.area] ?? oda.area}</Badge>
        <Badge className={oda.estado === 'EN_EJECUCION' ? 'bg-blue-100 text-blue-700' : ''}>
          {ESTADO_LABELS[oda.estado] ?? oda.estado}
        </Badge>
      </div>

      <div className="space-y-5">
        {/* Flujo de aprobación ODA */}
        {(() => {
          const estados = ['EMITIDA', 'RECIBIDA', 'EN_EJECUCION', 'CON_RESULTADO', 'INFORME_EMITIDO']
          const idxActual = estados.indexOf(oda.estado)
          const informeFirmado = ['FIRMADO', 'ENTREGADO'].includes(oda.informe?.estado ?? '')
          const todosPasos = [
            { label: 'Emitida', depto: 'Administración', dot: 'bg-slate-500' },
            { label: 'Recibida', depto: 'Analista', dot: 'bg-purple-500', color: 'text-purple-700', fecha: oda.fechaRecepcion ?? null },
            { label: 'En ejecución', depto: 'Analista', dot: 'bg-blue-500', color: 'text-blue-700' },
            { label: 'Informe enviado', depto: 'Analista', dot: 'bg-amber-500', color: 'text-amber-700' },
            { label: 'Informe emitido', depto: 'Gerente Técnico', dot: 'bg-green-500', color: 'text-green-700' },
            { label: 'Informe firmado', depto: 'Administración', dot: 'bg-emerald-500', color: 'text-emerald-700' },
          ]
          const pasos = esAnalista ? todosPasos.slice(0, 4) : todosPasos
          return (
            <div className="bg-white rounded-xl border shadow-sm p-5">
              <h2 className="font-semibold text-slate-700 text-sm mb-4">Flujo de ejecución</h2>
              <div className="flex items-start">
                {pasos.map((paso, i) => {
                  const esUltimoPaso = i === todosPasos.length - 1
                  const done = esUltimoPaso ? false : (i < idxActual || (i === idxActual && idxActual === estados.length - 1 && informeFirmado))
                  const activo = esUltimoPaso ? (idxActual === estados.length - 1 && informeFirmado) : (i === idxActual && !informeFirmado)
                  return (
                    <div key={i} className="flex-1 flex items-start">
                      <div className="flex flex-col items-center flex-1">
                        <div className="flex items-center w-full">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                            activo ? paso.dot : done ? 'bg-slate-400' : 'bg-slate-100'
                          }`}>
                            {done
                              ? <CheckCircle2 className="w-4 h-4 text-white" />
                              : activo
                              ? <Clock className="w-3.5 h-3.5 text-white" />
                              : <Circle className="w-3.5 h-3.5 text-slate-300" />}
                          </div>
                          {i < pasos.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1 ${done ? 'bg-slate-300' : 'bg-slate-200'}`} />
                          )}
                        </div>
                        <div className="mt-2 pr-1 w-full">
                          <p className={`text-xs font-semibold ${activo ? (paso.color ?? 'text-slate-600') : done ? 'text-slate-500' : 'text-slate-300'}`}>
                            {paso.label}
                          </p>
                          <p className={`text-xs mt-0.5 ${activo ? (paso.color ?? 'text-slate-500') : done ? 'text-slate-400' : 'text-slate-300'}`}>
                            {paso.depto}
                          </p>
                          {paso.fecha && done && (
                            <p className="text-xs text-slate-400 mt-0.5">{formatFecha(paso.fecha)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Información general */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-semibold text-slate-700 mb-4 text-sm">Información</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {!esAnalista && (
              <div>
                <p className="text-slate-500">Cliente</p>
                <p className="font-medium">{set.cliente.razonSocial}</p>
              </div>
            )}
            {!esAnalista && (
              <div>
                <p className="text-slate-500">Muestra (SET)</p>
                <Link href={`/set/${oda.setId}`} className="text-blue-600 hover:underline text-sm">
                  {set.nombreComercial}
                </Link>
              </div>
            )}
            <div>
              <p className="text-slate-500">Fecha recepción</p>
              <p>{oda.fechaRecepcion ? formatFecha(oda.fechaRecepcion) : '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">Área de laboratorio</p>
              <p className="font-medium">{AREA_LABELS[oda.area] ?? oda.area}</p>
            </div>
          </div>

          {/* Marcar como recibida */}
          {esAnalista && oda.estado === 'EMITIDA' && (
            <form action={recibirAction} className="mt-5 border-t pt-4">
              <Button type="submit" variant="outline">Marcar como recibida</Button>
            </form>
          )}

          {esAnalista && oda.estado === 'RECIBIDA' && (
            <div className="mt-4">
              <form action={iniciarAction}>
                <Button type="submit" variant="outline">Iniciar ejecución</Button>
              </form>
            </div>
          )}
        </div>

        {/* Datos de la muestra — visible only after reception */}
        {oda.estado !== 'EMITIDA' && (
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h2 className="font-semibold text-slate-700 mb-4 text-sm">Datos de la muestra</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {muestra.map(({ label, value }) => value ? (
                <div key={label}>
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ) : null)}
            </dl>
            {muestra.every((m) => !m.value) && (
              <p className="text-slate-400 text-sm">Sin datos de muestra registrados</p>
            )}
          </div>
        )}

        {/* Ensayos de esta ODA */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-semibold text-slate-700 mb-3 text-sm">
            Ensayos — Área {AREA_LABELS[oda.area] ?? oda.area}
          </h2>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-slate-600 rounded-tl-md">Tipo de ensayo</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600">Fecha de entrega al cliente</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600 rounded-tr-md">ODA N°</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {oda.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2">{item.ensayo.nombre}</td>
                  <td className="px-3 py-2">{formatFecha(item.fechaEntregaCompromiso)}</td>
                  <td className="px-3 py-2 font-mono text-xs font-semibold">{String(oda.numero).padStart(5, '0')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cargar resultado */}
        {puedoCargar && (
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h2 className="font-semibold text-slate-700 mb-4 text-sm">Cargar resultado</h2>
            <ResultadoForm
              odaId={id}
              initialTexto={oda.informe?.resultadoTexto ?? ''}
              initialImagenes={JSON.parse(oda.informe?.resultadoImagenes ?? '[]')}
            />
          </div>
        )}

        {/* Informe link */}
        {oda.informe && (
          <div className="bg-slate-50 border rounded-xl p-4 text-sm">
            <p className="font-medium">Informe generado:</p>
            <Link href={`/informes/${oda.informe.id}`} className="text-blue-600 hover:underline">
              {formatNumInforme(oda.informe.prefijo, oda.informe.numero, oda.informe.anio)}
            </Link>
            <span className="ml-2 text-slate-500">— {oda.informe.estado.replace(/_/g, ' ')}</span>
          </div>
        )}
      </div>
    </div>
  )
}
