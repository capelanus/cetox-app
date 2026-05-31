import { requireRol, hasRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { formatNumCotizacionProveedor, formatFecha } from '@/lib/format'
import { ESTADO_COT_PROVEEDOR_LABELS } from '@/lib/constants'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, ClipboardCheck, AlertCircle } from 'lucide-react'
import AprobacionControls from './aprobacion-client'

export default async function CotizacionesProveedorPage() {
  const session = await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA', 'DIRECTOR_CALIDAD', 'COORDINADOR_CALIDAD'])
  const rol = session.user.rol
  const esCalidad = hasRol(rol, 'DIRECTOR_CALIDAD')

  const cotizaciones = await prisma.cotizacionProveedor.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      proveedor:     { select: { razonSocial: true } },
      requerimiento: { select: { numero: true, anio: true, descripcion: true, areaSolicitante: true } },
      creadoPor:     { select: { nombre: true } },
    },
  })

  const pendientes = cotizaciones.filter(c => c.estado === 'ENVIADA_CALIDAD')
  const historial  = cotizaciones.filter(c => c.estado !== 'ENVIADA_CALIDAD')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Cotizaciones de Proveedor
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {esCalidad
              ? `${pendientes.length} pendiente${pendientes.length !== 1 ? 's' : ''} de tu aprobación`
              : `${cotizaciones.length} cotización${cotizaciones.length !== 1 ? 'es' : ''} registradas`}
          </p>
        </div>
        {hasRol(rol, 'JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA') && (
          <Link href="/operaciones/cotizaciones-proveedor/nueva">
            <Button className="bg-[#13602C] hover:bg-[#0e4a21] text-white">
              <Plus className="w-4 h-4 mr-2" />Nueva cotización
            </Button>
          </Link>
        )}
      </div>

      {/* ── SECCIÓN EXCLUSIVA DIRECTOR CALIDAD ── */}
      {esCalidad && (
        <>
          {pendientes.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-3">
              <ClipboardCheck className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">Sin cotizaciones pendientes</p>
                <p className="text-sm text-green-600 mt-0.5">Todas las cotizaciones han sido revisadas. ✓</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <h2 className="font-semibold text-amber-700">
                  Pendientes de aprobación ({pendientes.length})
                </h2>
              </div>

              {pendientes.map(cot => (
                <div key={cot.id} className="bg-white border-2 border-amber-200 rounded-xl p-5 space-y-4">
                  {/* Header de la card */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/operaciones/cotizaciones-proveedor/${cot.id}`}
                          className="font-mono text-sm font-bold text-[#13602C] hover:underline"
                        >
                          {formatNumCotizacionProveedor(cot.numero, cot.anio)}
                        </Link>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                          Esperando aprobación
                        </span>
                      </div>
                      <p className="font-semibold text-gray-800 mt-1">{cot.proveedor.razonSocial}</p>
                      <p className="text-sm text-gray-500 truncate">{cot.requerimiento.descripcion}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold text-[#13602C]">
                        {cot.moneda} {cot.total.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatFecha(cot.createdAt)}</p>
                    </div>
                  </div>

                  {/* Datos clave */}
                  <div className="grid grid-cols-3 gap-3 text-sm bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="text-xs text-gray-500">Área solicitante</p>
                      <p className="font-medium text-gray-700">{cot.requerimiento.areaSolicitante}</p>
                    </div>
                    {cot.plazoEntregaDias && (
                      <div>
                        <p className="text-xs text-gray-500">Plazo de entrega</p>
                        <p className="font-medium text-gray-700">{cot.plazoEntregaDias} días</p>
                      </div>
                    )}
                    {cot.condicionesPago && (
                      <div>
                        <p className="text-xs text-gray-500">Condiciones de pago</p>
                        <p className="font-medium text-gray-700">{cot.condicionesPago}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500">Registrado por</p>
                      <p className="font-medium text-gray-700">{cot.creadoPor.nombre}</p>
                    </div>
                  </div>

                  {/* Acciones inline */}
                  <div className="flex items-center justify-between gap-4">
                    <AprobacionControls cotId={cot.id} />
                    <Link
                      href={`/operaciones/cotizaciones-proveedor/${cot.id}`}
                      className="text-sm text-[#13602C] hover:underline whitespace-nowrap flex-shrink-0"
                    >
                      Ver detalle completo →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Separador antes del historial */}
          {historial.length > 0 && (
            <div className="pt-2">
              <h2 className="font-semibold text-gray-600 mb-3">Historial de cotizaciones</h2>
            </div>
          )}
        </>
      )}

      {/* ── TABLA COMPLETA (operaciones) o HISTORIAL (calidad) ── */}
      {(esCalidad ? historial : cotizaciones).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Número</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Proveedor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Requerimiento</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(esCalidad ? historial : cotizaciones).map(cot => (
                <tr key={cot.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/operaciones/cotizaciones-proveedor/${cot.id}`}
                      className="font-mono text-xs font-semibold text-[#13602C] hover:underline">
                      {formatNumCotizacionProveedor(cot.numero, cot.anio)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-[160px]">
                    <span className="line-clamp-1">{cot.proveedor.razonSocial}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[180px]">
                    <span className="line-clamp-1">{cot.requerimiento.descripcion}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-medium">
                    {cot.moneda} {cot.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      cot.estado === 'APROBADA'       ? 'bg-green-100 text-green-700' :
                      cot.estado === 'RECHAZADA'      ? 'bg-red-100 text-red-700' :
                      cot.estado === 'ENVIADA_CALIDAD'? 'bg-amber-100 text-amber-700' :
                                                        'bg-gray-100 text-gray-600'
                    }`}>
                      {ESTADO_COT_PROVEEDOR_LABELS[cot.estado] ?? cot.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatFecha(cot.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/operaciones/cotizaciones-proveedor/${cot.id}`}
                      className="text-[#13602C] hover:text-[#0e4a21] font-medium text-xs">
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {cotizaciones.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center py-16 gap-3">
          <ClipboardCheck className="w-10 h-10 text-gray-300" />
          <p className="text-gray-500 font-medium">No hay cotizaciones registradas</p>
        </div>
      )}
    </div>
  )
}
