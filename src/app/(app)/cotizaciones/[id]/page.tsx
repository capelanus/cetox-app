import { requireNotAnalista } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Copy, Pencil, GitBranch } from 'lucide-react'
import { formatFecha, formatMoneda, formatNumCotizacion } from '@/lib/format'
import { cambiarEstadoCotizacion, duplicarCotizacion, modificarCotizacionAceptada } from '@/app/actions/cotizaciones'
import { redirect } from 'next/navigation'

const ESTADO_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador',
  EN_REVISION: 'En revisión',
  ENVIADA: 'Enviada',
  ACEPTADA: 'Aceptada',
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
        include: { items: { include: { ensayo: true } } },
        orderBy: { orden: 'asc' },
      },
      sets: { select: { id: true, numero: true, anio: true } },
    },
  })
  if (!cot) notFound()

  const rol = session?.user.rol ?? ''
  const canEdit = rol === 'ADMINISTRACION' || rol === 'DIRECTOR_CALIDAD'

  async function enviar() {
    'use server'
    await cambiarEstadoCotizacion(id, 'EN_REVISION')
    redirect(`/cotizaciones/${id}`)
  }
  async function aceptar() {
    'use server'
    await cambiarEstadoCotizacion(id, 'ACEPTADA')
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
            cot.estado === 'ACEPTADA'
              ? 'bg-green-100 text-green-700'
              : cot.estado === 'RECHAZADA'
                ? 'bg-red-100 text-red-700'
                : ''
          }
        >
          {ESTADO_LABELS[cot.estado] ?? cot.estado}
        </Badge>
        {canEdit && (
          <div className="ml-auto flex gap-2">
            <Link href={`/cotizaciones/${id}/editar`}>
              <Button variant="outline" size="sm">
                <Pencil className="h-3 w-3 mr-1" />Editar
              </Button>
            </Link>
            <form action={duplicarCotizacion.bind(null, id)}>
              <Button variant="outline" size="sm" type="submit">
                <Copy className="h-3 w-3 mr-1" />Duplicar
              </Button>
            </form>
            {cot.estado === 'ACEPTADA' && (
              <form action={modificarCotizacionAceptada.bind(null, id)}>
                <Button variant="outline" size="sm" type="submit">
                  <GitBranch className="h-3 w-3 mr-1" />Modificar
                </Button>
              </form>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
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
              <p>{cot.observaciones}</p>
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
                  <p className="text-sm font-medium text-slate-600 mb-1">
                    Muestra {idx + 1}{muestra.nombre ? `: ${muestra.nombre}` : ''}
                  </p>
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
          {cot.estado === 'BORRADOR' && (rol === 'ADMINISTRACION' || rol === 'DIRECTOR_CALIDAD') && (
            <form action={enviar}>
              <Button type="submit" variant="outline">Enviar a revisión</Button>
            </form>
          )}
          {cot.estado === 'EN_REVISION' && rol === 'DIRECTOR_CALIDAD' && (
            <>
              <form action={aceptar}>
                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">Aceptar</Button>
              </form>
              <form action={rechazar}>
                <Button type="submit" variant="destructive">Rechazar</Button>
              </form>
            </>
          )}
          {cot.estado === 'ACEPTADA' && rol === 'ADMINISTRACION' && cot.sets.length === 0 && (
            <Link href={`/set/nuevo?cotizacionId=${cot.id}`}>
              <Button style={{ backgroundColor: '#1F4E79' }}>Generar SET</Button>
            </Link>
          )}
          {cot.sets.length > 0 && (
            <div className="flex gap-2 items-center text-sm text-slate-600">
              <span>SET generado:</span>
              {cot.sets.map((s) => (
                <Link key={s.id} href={`/set/${s.id}`} className="text-blue-600 hover:underline">
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
