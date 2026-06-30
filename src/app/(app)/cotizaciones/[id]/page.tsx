import { requireNotAnalista, hasRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle2, Circle, Clock, XCircle, Download } from 'lucide-react'
import { formatFecha, formatMoneda, formatNumCotizacion } from '@/lib/format'
import { cambiarEstadoCotizacion } from '@/app/actions/cotizaciones'
import { CotizacionActionsMenu } from '@/components/cotizacion-actions-menu'
import { redirect } from 'next/navigation'

const ESTADO_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador',
  EN_REVISION: 'En revisión',
  ENVIADA: 'Enviada',
  REVISADO: 'Revisado',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  VENCIDA: 'Vencida',
}

const FORMA_CONTACTO_LABELS: Record<string, string> = {
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  TELEFONICA: 'Telefónica',
  PERSONAL: 'Personal',
  OTROS: 'Otros',
}

export default async function CotizacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireNotAnalista()
  const cot = await prisma.cotizacion.findUnique({
    where: { id },
    include: {
      cliente: true,
      creadoPor: true,
      items: { include: { ensayo: true } },
      muestras: {
        include: {
          items: { include: { ensayo: true } },
          sets: { select: { id: true } },
        },
        orderBy: { orden: 'asc' },
      },
      sets:           { select: { id: true, numero: true, anio: true } },
      facturasCliente: { where: { estado: { not: 'ANULADA' } }, select: { id: true, serie: true, numero: true, anio: true, estado: true } },
    },
  })
  if (!cot) notFound()

  const rol = session?.user.rol ?? ''
  const canEdit = hasRol(rol, 'ADMINISTRACION', 'DIRECTOR_CALIDAD')

  async function enviar() {
    'use server'
    await cambiarEstadoCotizacion(id, 'EN_REVISION')
    redirect(`/cotizaciones/${id}`)
  }
  async function aceptar() {
    'use server'
    await cambiarEstadoCotizacion(id, 'REVISADO')
    redirect(`/cotizaciones/${id}`)
  }
  async function rechazar() {
    'use server'
    await cambiarEstadoCotizacion(id, 'RECHAZADA')
    redirect(`/cotizaciones/${id}`)
  }
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/cotizaciones">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Cotizaciones</Button>
        </Link>
        <h1 className="text-xl font-bold text-slate-900">
          {formatNumCotizacion(cot.numero, cot.anio, cot.sufijo)}
        </h1>
        <Badge
          className={
            cot.estado === 'REVISADO'
              ? 'bg-green-100 text-green-700'
              : cot.estado === 'APROBADA'
                ? 'bg-emerald-100 text-emerald-800'
                : cot.estado === 'RECHAZADA'
                  ? 'bg-red-100 text-red-700'
                  : ''
          }
        >
          {ESTADO_LABELS[cot.estado] ?? cot.estado}
        </Badge>
        {cot.tipo === 'ABIERTA' && (
          <Badge className="bg-amber-100 text-amber-700">Abierta</Badge>
        )}
        {canEdit && (
          <div className="ml-auto">
            <CotizacionActionsMenu
              id={id}
              hasSets={cot.sets.length > 0}
              numCotizacion={formatNumCotizacion(cot.numero, cot.anio, cot.sufijo)}
            />
          </div>
        )}
      </div>

      {/* Flujo de aprobación */}
      {cot.estado !== 'RECHAZADA' && cot.estado !== 'VENCIDA' ? (
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-semibold text-slate-700 text-sm mb-4">Flujo de aprobación</h2>
          {(() => {
            const pasos = [
              { label: 'Borrador', depto: 'Administración', dot: 'bg-slate-500', color: 'text-slate-600', done: true },
              { label: 'Revisión', depto: 'Director de Calidad', dot: 'bg-amber-500', color: 'text-amber-700', done: ['EN_REVISION', 'REVISADO', 'APROBADA'].includes(cot.estado), activo: cot.estado === 'EN_REVISION' },
              { label: 'Revisado', depto: 'Director de Calidad', dot: 'bg-green-500', color: 'text-green-700', done: ['REVISADO', 'APROBADA'].includes(cot.estado), activo: cot.estado === 'REVISADO' },
              { label: 'Aprobada', depto: 'Administración', dot: 'bg-emerald-600', color: 'text-emerald-700', done: cot.estado === 'APROBADA', activo: cot.estado === 'APROBADA' },
            ]
            return (
              <div className="flex items-start">
                {pasos.map((paso, i) => (
                  <div key={i} className="flex-1 flex items-start">
                    <div className="flex flex-col items-center flex-1">
                      <div className="flex items-center w-full">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${paso.activo ? paso.dot : paso.done ? 'bg-slate-400' : 'bg-slate-100'}`}>
                          {paso.done
                            ? <CheckCircle2 className="w-4 h-4 text-white" />
                            : paso.activo
                            ? <Clock className="w-3.5 h-3.5 text-white" />
                            : <Circle className="w-3.5 h-3.5 text-slate-300" />}
                        </div>
                        {i < pasos.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-1 ${paso.done ? 'bg-slate-300' : 'bg-slate-200'}`} />
                        )}
                      </div>
                      <div className="mt-2 pr-2 w-full">
                        <p className={`text-xs font-semibold ${paso.activo ? paso.color : paso.done ? 'text-slate-500' : 'text-slate-300'}`}>{paso.label}</p>
                        <p className={`text-xs mt-0.5 ${paso.activo ? paso.color : paso.done ? 'text-slate-400' : 'text-slate-300'}`}>{paso.depto}</p>
                        {paso.activo && !paso.done && <p className="text-xs mt-0.5 font-medium" style={{ color: 'inherit' }}>Pendiente</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      ) : (
        <div className={`rounded-xl border p-4 flex items-center gap-3 ${cot.estado === 'RECHAZADA' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
          <XCircle className={`h-5 w-5 shrink-0 ${cot.estado === 'RECHAZADA' ? 'text-red-500' : 'text-slate-400'}`} />
          <div>
            <p className={`text-sm font-semibold ${cot.estado === 'RECHAZADA' ? 'text-red-700' : 'text-slate-500'}`}>
              {cot.estado === 'RECHAZADA' ? 'Cotización rechazada' : 'Cotización vencida'}
            </p>
            <p className="text-xs text-slate-400">Director de Calidad</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6 mt-4">
        {/* Info principal */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Cliente</p>
            <p className="font-medium">{cot.cliente.razonSocial}</p>
            <p className="text-slate-500">{cot.cliente.ruc}</p>
          </div>
          <div>
            <p className="text-slate-500">Creado por</p>
            <p className="font-medium">{cot.creadoPor.nombre}</p>
          </div>
          <div>
            <p className="text-slate-500">Fecha emisión</p>
            <p className="font-medium">{formatFecha(cot.fechaEmision)}</p>
          </div>
          <div>
            <p className="text-slate-500">Vigencia hasta</p>
            <p className="font-medium">{formatFecha(cot.vigenciaHasta)}</p>
          </div>
          {cot.paisOrigen && (
            <div>
              <p className="text-slate-500">País</p>
              <p className="font-medium">{cot.paisOrigen}</p>
            </div>
          )}
          {cot.observaciones && (
            <div className="col-span-2">
              <p className="text-slate-500">Observaciones</p>
              <p className="whitespace-pre-wrap">{cot.observaciones}</p>
            </div>
          )}
        </div>

        {/* Datos de contacto */}
        {(cot.contactoNombre || cot.contactoEmail || cot.contactoTelefono || cot.formaContacto) && (
          <div className="border-t pt-4">
            <h3 className="font-semibold text-slate-700 mb-3 text-sm">Datos de contacto</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {cot.contactoNombre && (
                <div>
                  <p className="text-slate-500">Nombre</p>
                  <p className="font-medium">{cot.contactoNombre}</p>
                </div>
              )}
              {cot.contactoEmail && (
                <div>
                  <p className="text-slate-500">Email</p>
                  <p className="font-medium">{cot.contactoEmail}</p>
                </div>
              )}
              {cot.paisOrigen && (
                <div>
                  <p className="text-slate-500">País</p>
                  <p className="font-medium">{cot.paisOrigen}</p>
                </div>
              )}
              {cot.contactoRuc && (
                <div>
                  <p className="text-slate-500">RUC / Documento</p>
                  <p className="font-medium font-mono">{cot.contactoRuc}</p>
                </div>
              )}
              {cot.contactoTelefono && (
                <div>
                  <p className="text-slate-500">Teléfono</p>
                  <p className="font-medium">{cot.contactoTelefono}</p>
                </div>
              )}
              {cot.formaContacto && (
                <div>
                  <p className="text-slate-500">Forma de contacto</p>
                  <p className="font-medium">{FORMA_CONTACTO_LABELS[cot.formaContacto] ?? cot.formaContacto}</p>
                </div>
              )}
              {(cot.fechaContacto || cot.horaContacto) && (
                <div>
                  <p className="text-slate-500">Fecha y hora</p>
                  <p className="font-medium">{cot.fechaContacto ?? ''} {cot.horaContacto ?? ''}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Items grouped by muestra (or flat for legacy cotizaciones) */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-slate-700 mb-3">Ensayos cotizados</h3>
          {cot.muestras.length > 0 ? (
            <div className="space-y-4">
              {cot.muestras.map((muestra, idx) => (
                <div key={muestra.id}>
                  <div className="flex gap-1.5 text-sm font-medium text-slate-600 mb-1">
                    <span className="shrink-0">Muestra {idx + 1}{muestra.nombre ? ':' : ''}</span>
                    {muestra.nombre && (
                      <span className="whitespace-pre-wrap">{muestra.nombre}</span>
                    )}
                  </div>
                  <table className="w-full text-sm border rounded-lg overflow-hidden">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium">Ensayo</th>
                        <th className="text-left px-4 py-2 font-medium">Código</th>
                        <th className="text-left px-4 py-2 font-medium">Plazo</th>
                        <th className="text-right px-4 py-2 font-medium">Costo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {muestra.items.map((it) => (
                        <tr key={it.id}>
                          <td className="px-4 py-2">{it.ensayo.nombre}</td>
                          <td className="px-4 py-2 font-mono text-xs">{it.ensayo.codigo}</td>
                          <td className="px-4 py-2">{it.tiempoEntregaDias} días</td>
                          <td className="px-4 py-2 text-right">{formatMoneda(it.costo, cot.moneda as 'USD' | 'PEN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Indicaciones por laboratorio */}
                  {(muestra.indicacionQ || muestra.indicacionB || muestra.indicacionM) && (() => {
                    const AREA_STYLES: Record<string, { badge: string; label: string }> = {
                      Q: { badge: 'bg-blue-100 text-blue-700', label: 'Química' },
                      B: { badge: 'bg-green-100 text-green-700', label: 'Biología' },
                      M: { badge: 'bg-purple-100 text-purple-700', label: 'Microbiología' },
                    }
                    const indicaciones = [
                      { area: 'Q', value: muestra.indicacionQ },
                      { area: 'B', value: muestra.indicacionB },
                      { area: 'M', value: muestra.indicacionM },
                    ].filter((i) => i.value)
                    return (
                      <div className={`mt-2 grid gap-3 ${indicaciones.length === 3 ? 'grid-cols-3' : indicaciones.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {indicaciones.map(({ area, value }) => (
                          <div key={area} className="rounded-lg border bg-slate-50 p-3 space-y-1">
                            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${AREA_STYLES[area].badge}`}>
                              {AREA_STYLES[area].label}
                            </span>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{value}</p>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Ensayo</th>
                  <th className="text-left px-4 py-2 font-medium">Código</th>
                  <th className="text-left px-4 py-2 font-medium">Plazo</th>
                  <th className="text-right px-4 py-2 font-medium">Costo</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cot.items.map((it) => (
                  <tr key={it.id}>
                    <td className="px-4 py-2">{it.ensayo.nombre}</td>
                    <td className="px-4 py-2 font-mono text-xs">{it.ensayo.codigo}</td>
                    <td className="px-4 py-2">{it.tiempoEntregaDias} días</td>
                    <td className="px-4 py-2 text-right">{formatMoneda(it.costo, cot.moneda as 'USD' | 'PEN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Totals */}
        <div className="border-t pt-4 space-y-1 text-sm text-right">
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span>{formatMoneda(cot.subtotal, cot.moneda as 'USD' | 'PEN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">IGV (18%)</span>
            <span>{formatMoneda(cot.igv, cot.moneda as 'USD' | 'PEN')}</span>
          </div>
          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span>{formatMoneda(cot.total, cot.moneda as 'USD' | 'PEN')}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t pt-4 flex gap-3 flex-wrap">
          {cot.estado === 'BORRADOR' && hasRol(rol, 'ADMINISTRACION', 'DIRECTOR_CALIDAD') && (
            <form action={enviar}>
              <Button type="submit" variant="outline">Enviar a revisión</Button>
            </form>
          )}
          {cot.estado === 'EN_REVISION' && hasRol(rol, 'DIRECTOR_CALIDAD') && (
            <>
              <form action={aceptar}>
                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">Aceptar</Button>
              </form>
              <form action={rechazar}>
                <Button type="submit" variant="destructive">Rechazar</Button>
              </form>
            </>
          )}
          {['REVISADO', 'APROBADA'].includes(cot.estado) && (
            <a href={`/api/cotizaciones/${id}/generar-pdf`} download>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Descargar cotización PDF
              </Button>
            </a>
          )}
          {['REVISADO', 'APROBADA'].includes(cot.estado) && hasRol(rol, 'ADMINISTRACION') && cot.tipo !== 'ABIERTA' && (() => {
            const muestrasPendientes = cot.muestras.filter((m) => m.sets.length === 0).length
            const sinMuestras = cot.muestras.length === 0
            const puedeGenerar = sinMuestras ? cot.sets.length === 0 : muestrasPendientes > 0
            if (!puedeGenerar) return null
            return (
              <Link href={`/set/nuevo?cotizacionId=${cot.id}`}>
                <Button style={{ backgroundColor: '#13602C' }}>
                  {sinMuestras
                    ? 'Generar SET'
                    : muestrasPendientes < cot.muestras.length
                      ? `Generar SET (${muestrasPendientes} pendiente${muestrasPendientes !== 1 ? 's' : ''})`
                      : `Generar ${muestrasPendientes} SET${muestrasPendientes !== 1 ? 's' : ''}`}
                </Button>
              </Link>
            )
          })()}
          {/* ── Facturación ── */}
          {['REVISADO', 'APROBADA'].includes(cot.estado) && hasRol(rol, 'ADMINISTRACION', 'DIRECTOR_CALIDAD', 'GERENTE_TECNICO', 'COORDINADOR_CALIDAD') && (
            cot.facturasCliente.length > 0 ? (
              <Link href={`/facturacion/${cot.facturasCliente[0].id}`}>
                <Button variant="outline" style={{ borderColor: '#4AC3B2', color: '#13602C' }}>
                  <Download className="h-4 w-4 mr-2" />
                  Ver factura {cot.facturasCliente[0].serie}-{String(cot.facturasCliente[0].numero).padStart(5,'0')}
                  {cot.facturasCliente[0].estado === 'PAGADA' && (
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">Pagada</span>
                  )}
                </Button>
              </Link>
            ) : (
              <Link href={`/cotizaciones/${id}/facturar`}>
                <Button
                  style={{ backgroundColor: '#4AC3B2', color: 'white' }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generar Factura
                </Button>
              </Link>
            )
          )}
          {cot.sets.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center text-sm text-slate-600">
              <span>{cot.sets.length === 1 ? 'SET generado:' : 'SETs generados:'}</span>
              {cot.sets.map((s) => (
                <Link key={s.id} href={`/set/${s.id}`} className="text-blue-600 hover:underline font-mono text-xs">
                  SET-{String(s.numero).padStart(4, '0')}-{s.anio}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
