import { requireOperaciones } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2, Phone, Mail, CreditCard, MapPin, ShoppingCart, FileText } from 'lucide-react'
import { formatFecha } from '@/lib/format'
import { ESTADO_OC_LABELS, ESTADO_COT_PROVEEDOR_LABELS } from '@/lib/constants'
import ProveedorEditForm from './edit-form'
import ToggleActivoButton from './toggle-activo'

export default async function ProveedorDetallePage({ params }: { params: Promise<{ id: string }> }) {
  await requireOperaciones()
  const { id } = await params

  const proveedor = await prisma.proveedor.findUnique({
    where: { id },
    include: {
      cotizacionesProveedor: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { requerimiento: { select: { numero: true, anio: true, descripcion: true } } },
      },
      ordenesCompra: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { facturas: { select: { total: true, moneda: true } } },
      },
      _count: { select: { ordenesCompra: true, cotizacionesProveedor: true } },
    },
  })

  if (!proveedor) notFound()

  // Total comprado
  const totalCompradoPEN = proveedor.ordenesCompra
    .filter(oc => oc.moneda === 'PEN')
    .reduce((sum, oc) => sum + oc.total, 0)
  const totalCompradoUSD = proveedor.ordenesCompra
    .filter(oc => oc.moneda === 'USD')
    .reduce((sum, oc) => sum + oc.total, 0)

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/operaciones/proveedores">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Volver</Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Building2 className="w-5 h-5 text-[#13602C] flex-shrink-0" />
            <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
              {proveedor.razonSocial}
            </h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${proveedor.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {proveedor.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          {proveedor.ruc && (
            <p className="text-gray-500 text-sm mt-0.5 font-mono">RUC: {proveedor.ruc}</p>
          )}
          {proveedor.especialidad && (
            <p className="text-gray-500 text-xs mt-0.5">{proveedor.especialidad}</p>
          )}
        </div>
        <ToggleActivoButton id={proveedor.id} activo={proveedor.activo} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Órdenes de Compra</p>
          <p className="text-2xl font-bold text-[#13602C] mt-1">{proveedor._count.ordenesCompra}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Cotizaciones</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{proveedor._count.cotizacionesProveedor}</p>
        </div>
        {totalCompradoPEN > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total comprado (S/)</p>
            <p className="text-2xl font-bold text-gray-700 mt-1">S/ {totalCompradoPEN.toFixed(0)}</p>
          </div>
        )}
        {totalCompradoUSD > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total comprado ($)</p>
            <p className="text-2xl font-bold text-gray-700 mt-1">$ {totalCompradoUSD.toFixed(0)}</p>
          </div>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Contacto */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400" />Teléfonos
          </h2>
          {[proveedor.telefono, proveedor.telefono2, proveedor.telefono3].filter(Boolean).length > 0 ? (
            <div className="space-y-1 text-sm text-gray-700">
              {[proveedor.telefono, proveedor.telefono2, proveedor.telefono3].filter(Boolean).map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Sin teléfonos registrados</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />Emails
          </h2>
          {[proveedor.email, proveedor.email2, proveedor.email3].filter(Boolean).length > 0 ? (
            <div className="space-y-1 text-sm">
              {[proveedor.email, proveedor.email2, proveedor.email3].filter(Boolean).map((e, i) => (
                <a key={i} href={`mailto:${e}`} className="block text-blue-600 hover:underline">{e}</a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Sin emails registrados</p>
          )}
        </div>

        {proveedor.direccion && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />Dirección
            </h2>
            <p className="text-sm text-gray-700">{proveedor.direccion}</p>
          </div>
        )}

        {proveedor.cuentaBancaria && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-400" />Cuenta Bancaria
            </h2>
            <p className="text-sm text-gray-700 font-mono leading-relaxed">{proveedor.cuentaBancaria}</p>
          </div>
        )}
      </div>

      {/* Edit form (collapsible) */}
      <ProveedorEditForm proveedor={{
        id: proveedor.id,
        razonSocial:    proveedor.razonSocial,
        ruc:            proveedor.ruc ?? '',
        especialidad:   proveedor.especialidad ?? '',
        direccion:      proveedor.direccion ?? '',
        contacto:       proveedor.contacto ?? '',
        telefono:       proveedor.telefono ?? '',
        telefono2:      proveedor.telefono2 ?? '',
        telefono3:      proveedor.telefono3 ?? '',
        email:          proveedor.email ?? '',
        email2:         proveedor.email2 ?? '',
        email3:         proveedor.email3 ?? '',
        cuentaBancaria: proveedor.cuentaBancaria ?? '',
      }} />

      {/* Últimas OC */}
      {proveedor.ordenesCompra.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 font-semibold text-gray-700">
            <ShoppingCart className="w-4 h-4 text-gray-400" />
            Órdenes de compra recientes
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">N°</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Fecha</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-600">Total</th>
                <th className="text-center px-4 py-2.5 font-medium text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {proveedor.ordenesCompra.map(oc => (
                <tr key={oc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <Link href={`/operaciones/ordenes-compra/${oc.id}`}
                      className="font-mono text-xs font-medium text-[#13602C] hover:underline">
                      OC-{String(oc.numero).padStart(4, '0')}-{oc.anio}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{formatFecha(oc.createdAt)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm">
                    {oc.moneda} {oc.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      oc.estado === 'COMPLETADA' ? 'bg-green-100 text-green-700' :
                      oc.estado === 'CANCELADA'  ? 'bg-red-100 text-red-700' :
                                                   'bg-amber-100 text-amber-700'
                    }`}>
                      {ESTADO_OC_LABELS[oc.estado] ?? oc.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {proveedor._count.ordenesCompra > 10 && (
            <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
              Mostrando las últimas 10 de {proveedor._count.ordenesCompra} órdenes
            </div>
          )}
        </div>
      )}

      {/* Últimas cotizaciones */}
      {proveedor.cotizacionesProveedor.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 font-semibold text-gray-700">
            <FileText className="w-4 h-4 text-gray-400" />
            Cotizaciones recientes
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Requerimiento</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Fecha</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-600">Total</th>
                <th className="text-center px-4 py-2.5 font-medium text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {proveedor.cotizacionesProveedor.map(cot => (
                <tr key={cot.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <Link href={`/operaciones/cotizaciones-proveedor/${cot.id}`}
                      className="text-[#13602C] hover:underline text-xs">
                      REQ-{String(cot.requerimiento.numero).padStart(4, '0')}-{cot.requerimiento.anio}
                    </Link>
                    <p className="text-gray-400 text-xs truncate max-w-[200px]">{cot.requerimiento.descripcion}</p>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{formatFecha(cot.createdAt)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm">
                    {cot.moneda} {cot.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      cot.estado === 'APROBADA'  ? 'bg-green-100 text-green-700' :
                      cot.estado === 'RECHAZADA' ? 'bg-red-100 text-red-700' :
                                                   'bg-amber-100 text-amber-700'
                    }`}>
                      {ESTADO_COT_PROVEEDOR_LABELS[cot.estado] ?? cot.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
