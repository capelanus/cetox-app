import { requireNotAnalista } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { formatFecha, formatNumSET, formatNumODA, formatMoneda } from '@/lib/format'
import { generarODAs, toggleRevisadoODA } from '@/app/actions/set'
import { revalidatePath } from 'next/cache'

const ESTADO_ODA_LABELS: Record<string, string> = {
  EMITIDA: 'Emitida',
  RECIBIDA: 'Recibida',
  EN_EJECUCION: 'En ejecución',
  CON_RESULTADO: 'Con resultado',
  INFORME_EMITIDO: 'Informe emitido',
}

const AREA_LABELS: Record<string, string> = { Q: 'Química', B: 'Biología', M: 'Microbiología' }

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-slate-500 text-xs">{label}</p>
      <p className="font-medium text-sm">{value}</p>
    </div>
  )
}

export default async function SETDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireNotAnalista()
  const set = await prisma.sET.findUnique({
    where: { id },
    include: {
      cliente: true,
      cotizacion: {
        include: {
          items: { include: { ensayo: true } },
          muestras: { include: { items: { include: { ensayo: true } } }, orderBy: { orden: 'asc' } },
        },
      },
      creadoPor: true,
      odas: {
        include: { items: { include: { ensayo: true } }, informe: true },
        orderBy: { numero: 'asc' },
      },
      cargoEntrega: true,
    },
  })
  if (!set) notFound()

  const rol = session?.user.rol ?? ''
  const puedoGenerarODAs = rol === 'ADMINISTRACION' && set.estado === 'EMITIDA' && set.odas.length === 0
  const generateAction = generarODAs.bind(null, id)

  const cot = set.cotizacion
  const moneda = cot.moneda as 'USD' | 'PEN'

  // Build display rows for ensayos: match ODA (if exists) by position with cotizacion items
  const cotItems = cot.items
  const precioNeto = cot.subtotal
  const igv = cot.igv
  const total = cot.total

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/set">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />SET</Button>
        </Link>
        <h1 className="text-xl font-bold text-slate-900">{formatNumSET(set.numero, set.anio)}</h1>
        <Badge className={set.estado === 'EN_EJECUCION' ? 'bg-blue-100 text-blue-700' : ''}>
          {set.estado.replace(/_/g, ' ')}
        </Badge>
        <span className="ml-auto font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{set.codigoMuestra}</span>
      </div>

      {/* 1. Datos del cliente y contacto */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="font-semibold text-slate-700 mb-3 text-sm">Datos del cliente</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <InfoRow label="Cliente" value={set.cliente.razonSocial} />
          <InfoRow label="RUC" value={set.cliente.ruc} />
          <InfoRow label="Dirección" value={set.cliente.direccion} />
          <InfoRow label="Nombre del contacto" value={cot.contactoNombre} />
          <InfoRow label="Email" value={cot.contactoEmail} />
          <InfoRow label="Teléfono" value={cot.contactoTelefono} />
        </div>
      </div>

      {/* 2. Nombre del paciente */}
      {set.nombrePaciente && (
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-semibold text-slate-700 mb-2 text-sm">Nombre del paciente</h2>
          <p className="text-sm">{set.nombrePaciente}</p>
        </div>
      )}

      {/* 3. Datos de la muestra */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="font-semibold text-slate-700 mb-3 text-sm">Datos de la muestra</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <InfoRow label="Nombre comercial" value={set.nombreComercial} />
          <InfoRow label="Tipo de muestra" value={set.tipoMuestra} />
          <InfoRow label="Ingrediente activo" value={set.ingredienteActivo} />
          <InfoRow label="Formulación" value={set.formulacion} />
          <InfoRow label="Número de lote" value={set.numeroLote} />
          <InfoRow label="Peso / Volumen" value={set.pesoVolumen} />
          <InfoRow label="Fecha de fabricación" value={set.fechaFabricacion ? formatFecha(set.fechaFabricacion) : null} />
          <InfoRow label="Fecha de vencimiento" value={set.fechaVencimiento ? formatFecha(set.fechaVencimiento) : null} />
          <InfoRow label="Fecha de ingreso" value={formatFecha(set.fechaIngreso)} />
          <InfoRow label="Ingreso de muestra" value={set.ingresoMuestra === 'Otro' ? `Otro: ${set.ingresoMuestraOtro ?? ''}` : set.ingresoMuestra} />
          <InfoRow label="Número de muestras" value={set.numeroMuestras ? String(set.numeroMuestras) : null} />
          <InfoRow label="Devolución de muestra sobrante" value={set.devolucionMuestra} />
          <InfoRow label="Condiciones ambientales" value={set.condicionesAmbientales} />
          <InfoRow label="Procedencia / Descripción" value={set.procedenciaDescripcion} />
          <InfoRow label="Otra indicación" value={set.otraIndicacion} />
          {set.observaciones && (
            <div className="col-span-2">
              <p className="text-slate-500 text-xs">Observaciones</p>
              <p className="text-sm whitespace-pre-wrap">{set.observaciones}</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Descripción del envase */}
      {(set.tipoEnvase || set.materialEnvase || set.etiquetaEnvase || set.seguridadEnvase) && (
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-semibold text-slate-700 mb-3 text-sm">Descripción del envase</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <InfoRow label="Tipo de envase" value={set.tipoEnvase} />
            <InfoRow label="Material" value={set.materialEnvase} />
            <InfoRow label="Etiqueta" value={set.etiquetaEnvase} />
            <InfoRow label="Seguridad" value={set.seguridadEnvase} />
          </div>
        </div>
      )}

      {/* 5. Ensayos con ODAs, costos y revisión */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-700 text-sm">Ensayos</h2>
          {puedoGenerarODAs && (
            <form action={generateAction}>
              <Button type="submit" size="sm" style={{ backgroundColor: '#1F4E79' }}>
                Generar ODAs
              </Button>
            </form>
          )}
        </div>

        {set.odas.length > 0 ? (
          <>
            <div className="space-y-3">
              {set.odas.map((oda) => {
                const toggleAction = toggleRevisadoODA.bind(null, oda.id, id)
                const odaCosto = oda.items.reduce((s, i) => s + i.costo, 0)
                return (
                  <div key={oda.id} className={`border rounded-lg overflow-hidden ${oda.revisado ? 'border-green-300' : ''}`}>
                    {/* ODA header */}
                    <div className={`flex items-center gap-3 px-3 py-2 text-sm ${oda.revisado ? 'bg-green-50' : 'bg-slate-50'}`}>
                      <Link href={`/oda/${oda.id}`} className="font-mono text-xs font-semibold text-blue-600 hover:underline">
                        {formatNumODA(oda.numero, oda.anio)}
                      </Link>
                      <Badge variant="outline" className="text-xs">{AREA_LABELS[oda.area] ?? oda.area}</Badge>
                      <Badge variant="outline" className="text-xs">{ESTADO_ODA_LABELS[oda.estado] ?? oda.estado}</Badge>
                      <span className="text-slate-500 text-xs">Entrega: {formatFecha(oda.fechaEntregaCompromiso)}</span>
                      <div className="ml-auto flex items-center gap-2">
                        <form action={toggleAction}>
                          <button
                            type="submit"
                            className={`w-5 h-5 rounded border-2 inline-flex items-center justify-center transition-colors ${
                              oda.revisado ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-slate-500'
                            }`}
                            title={oda.revisado ? 'Quitar revisión' : 'Marcar revisado'}
                          >
                            {oda.revisado && (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        </form>
                      </div>
                    </div>
                    {/* ODA items */}
                    <table className="w-full text-sm">
                      <tbody className="divide-y">
                        {oda.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2">{item.ensayo.nombre}</td>
                            <td className="px-3 py-2 font-mono text-xs text-slate-400">{item.ensayo.codigo}</td>
                            <td className="px-3 py-2 text-slate-500">{item.tiempoEntregaDias} días</td>
                            <td className="px-3 py-2 text-slate-500">{formatFecha(item.fechaEntregaCompromiso)}</td>
                            <td className="px-3 py-2 text-right">{formatMoneda(item.costo, moneda)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {oda.items.length > 1 && (
                      <div className="px-3 py-1 text-right text-xs text-slate-500 border-t bg-slate-50">
                        Subtotal área: {formatMoneda(odaCosto, moneda)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Totales */}
            <div className="mt-4 border-t pt-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Precio neto</span>
                <span>{formatMoneda(precioNeto, moneda)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IGV (18%)</span>
                <span>{formatMoneda(igv, moneda)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-2 mt-1">
                <span>TOTAL</span>
                <span>{formatMoneda(total, moneda)}</span>
              </div>
            </div>
          </>
        ) : (
          // Sin ODAs: mostrar items de la cotización con costos
          <>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">Ensayo</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">Área</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">Plazo</th>
                    <th className="text-right px-3 py-2 font-medium text-slate-600">Costo</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cotItems.map((it) => (
                    <tr key={it.id}>
                      <td className="px-3 py-2">{it.ensayo.nombre}</td>
                      <td className="px-3 py-2 text-slate-500">{AREA_LABELS[it.ensayo.area] ?? it.ensayo.area}</td>
                      <td className="px-3 py-2">{it.tiempoEntregaDias} días</td>
                      <td className="px-3 py-2 text-right">{formatMoneda(it.costo, moneda)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 border-t pt-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Precio neto</span>
                <span>{formatMoneda(precioNeto, moneda)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IGV (18%)</span>
                <span>{formatMoneda(igv, moneda)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-2 mt-1">
                <span>TOTAL</span>
                <span>{formatMoneda(total, moneda)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Cargo de entrega */}
      {(set.estado === 'FINALIZADA' || set.estado === 'ENTREGADA') && (
        <div>
          <Link href={`/cargos/${set.id}`}>
            <Button variant="outline">
              {set.cargoEntrega ? 'Ver cargo de entrega' : 'Generar cargo de entrega'}
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
