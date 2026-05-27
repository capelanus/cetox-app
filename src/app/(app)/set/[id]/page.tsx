import { requireNotAnalista, hasRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle2, Pencil } from 'lucide-react'
import { SetPdfButton } from '@/components/set-pdf-button'
import { formatFecha, formatNumSET, formatNumODA, formatMoneda } from '@/lib/format'
import { generarODAs } from '@/app/actions/set'
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
      <p className="font-medium text-sm whitespace-pre-wrap">{value}</p>
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
  const puedoGenerarODAs = hasRol(rol, 'ADMINISTRACION') && set.estado === 'EMITIDA' && set.odas.length === 0 && !!set.cotizacion
  const puedoEditar = hasRol(rol, 'ADMINISTRACION')
  const generateAction = generarODAs.bind(null, id)

  const cot = set.cotizacion
  const esCero = !cot // SET sin cotización (gratuito)
  const moneda = (cot?.moneda ?? 'USD') as 'USD' | 'PEN'

  // Build display rows for ensayos: match ODA (if exists) by position with cotizacion items
  const cotItems = cot?.items ?? []
  const precioNeto = cot?.subtotal ?? 0
  const igv = cot?.igv ?? 0
  const total = cot?.total ?? 0

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/set">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />SET</Button>
        </Link>
        <h1 className="text-xl font-bold text-slate-900">{formatNumSET(set.numero, set.anio)}</h1>
        <Badge className={set.estado === 'EN_EJECUCION' ? 'bg-blue-100 text-blue-700' : ''}>
          {set.estado.replace(/_/g, ' ')}
        </Badge>
        {esCero && set.motivoCero && (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: '#DCF0E4', color: '#13602C' }}
          >
            $0 · {set.motivoCero === 'REENSAYO' ? 'Reensayo' : set.motivoCero === 'INGRESOS_INTERNOS' ? 'Interno' : 'Modificación sin costo'}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {puedoEditar && (
            <Link href={`/set/${id}/editar`}>
              <Button variant="outline" size="sm">
                <Pencil className="h-3.5 w-3.5 mr-1.5" />Editar
              </Button>
            </Link>
          )}
          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{set.codigoMuestra}</span>
        </div>
      </div>

      {/* 1. Datos del cliente y contacto */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="font-semibold text-slate-700 mb-3 text-sm">Datos del cliente</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <InfoRow label="Cliente" value={set.cliente.razonSocial} />
          <InfoRow label="RUC" value={set.cliente.ruc} />
          <InfoRow label="Dirección" value={set.cliente.direccion} />
          {cot && <InfoRow label="Nombre del contacto" value={cot.contactoNombre} />}
          {cot && <InfoRow label="Email" value={cot.contactoEmail} />}
          {cot && <InfoRow label="Teléfono" value={cot.contactoTelefono} />}
        </div>
      </div>

      {/* 2. Datos del paciente */}
      {(set.nombrePaciente || set.edadPaciente) && (
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-semibold text-slate-700 mb-3 text-sm">Datos del paciente</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <InfoRow label="Nombre" value={set.nombrePaciente} />
            <InfoRow label="Edad" value={set.edadPaciente} />
          </div>
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
          <div className="flex items-center gap-2">
            {set.odas.length > 0 && (
              <SetPdfButton href={`/api/set/${id}/generar-pdf`} />
            )}
            {puedoGenerarODAs && (
              <form action={generateAction}>
                <Button type="submit" size="sm" style={{ backgroundColor: '#1F4E79' }}>
                  Generar ODAs
                </Button>
              </form>
            )}
            {set.odas.length > 0 && !puedoGenerarODAs && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                ODAs generadas
              </span>
            )}
          </div>
        </div>

        {set.odas.length > 0 ? (
          <>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Ensayo</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Fecha de entrega</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Tiempo</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-600">ODA</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-600">Costo</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {set.odas.map((oda) => {
                    const hoy = new Date()
                    const entrega = new Date(oda.fechaEntregaCompromiso)
                    const diasRestantes = Math.ceil((entrega.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
                    const ensayoNombre = oda.items.map((i) => i.ensayo.nombre).join(', ')
                    const costo = oda.items.reduce((s, i) => s + i.costo, 0)
                    return (
                      <tr key={oda.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5">
                          <Link href={`/oda/${oda.id}`} className="font-medium text-blue-600 hover:underline">
                            {ensayoNombre}
                          </Link>
                          <div className="text-xs text-slate-400 mt-0.5">
                            <Badge variant="outline" className="text-xs mr-1">{AREA_LABELS[oda.area] ?? oda.area}</Badge>
                            <Badge variant="outline" className="text-xs">{ESTADO_ODA_LABELS[oda.estado] ?? oda.estado}</Badge>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                          {formatFecha(oda.fechaEntregaCompromiso)}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            diasRestantes < 0 ? 'text-red-600' :
                            diasRestantes <= 3 ? 'text-amber-600' : 'text-slate-600'
                          }`}>
                            {diasRestantes < 0
                              ? `${Math.abs(diasRestantes)}d vencida`
                              : diasRestantes === 0
                              ? 'Hoy'
                              : `${diasRestantes}d`}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-mono font-bold text-slate-800">
                            {String(oda.numero).padStart(5, '0')}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-700 whitespace-nowrap">
                          {formatMoneda(costo, moneda)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="border-t bg-slate-50">
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-right text-slate-500 text-sm">Precio neto</td>
                    <td className="px-4 py-2 text-right text-slate-700 text-sm whitespace-nowrap">{formatMoneda(precioNeto, moneda)}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-right text-slate-500 text-sm">IGV (18%)</td>
                    <td className="px-4 py-2 text-right text-slate-700 text-sm whitespace-nowrap">{formatMoneda(igv, moneda)}</td>
                  </tr>
                  <tr className="border-t">
                    <td colSpan={4} className="px-4 py-2.5 text-right font-bold text-slate-800">TOTAL</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-800 whitespace-nowrap">{formatMoneda(total, moneda)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        ) : (
          // Sin ODAs: mostrar items de la cotización con costos (solo si hay cotización)
          cotItems.length > 0 ? (
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
          ) : (
            <p className="text-sm text-slate-400 py-2">No hay ensayos registrados aún.</p>
          )
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
