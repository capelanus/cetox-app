import { requireRol, hasRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { formatNumCotizacionProveedor, formatNumRequerimiento, formatFecha } from '@/lib/format'
import { ESTADO_COT_PROVEEDOR_LABELS, ESTADO_REQUERIMIENTO_LABELS } from '@/lib/constants'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, ClipboardCheck, AlertCircle } from 'lucide-react'
import AprobacionControls from './aprobacion-client'

export default async function CotizacionesProveedorPage() {
  const session = await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA', 'DIRECTOR_CALIDAD', 'COORDINADOR_CALIDAD'])
  const rol = session.user.rol
  const esCalidad = hasRol(rol, 'DIRECTOR_CALIDAD')

  // ── Vista Calidad: muestra requerimientos, no cotizaciones individuales ──
  if (esCalidad) {
    const [reqsPendientes, reqsHistorial] = await Promise.all([
      prisma.requerimiento.findMany({
        where: { estado: 'ENVIADO_CALIDAD' },
        include: {
          cotizacionesProveedor: { include: { proveedor: { select: { razonSocial: true } } } },
          creadoPor: { select: { nombre: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.requerimiento.findMany({
        where: {
          estado: { in: ['COTIZACION_APROBADA', 'OC_EMITIDA', 'EN_TRANSITO', 'RECEPCIONADO', 'CERRADO'] },
          cotizacionesProveedor: { some: { estado: { in: ['APROBADA', 'RECHAZADA'] } } },
        },
        include: {
          cotizacionesProveedor: { include: { proveedor: { select: { razonSocial: true } } } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 30,
      }),
    ])

    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Cotizaciones de Proveedor
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {reqsPendientes.length} requerimiento{reqsPendientes.length !== 1 ? 's' : ''} pendiente{reqsPendientes.length !== 1 ? 's' : ''} de revisión
          </p>
        </div>

        {/* Pendientes de aprobación */}
        {reqsPendientes.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-3">
            <ClipboardCheck className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">Sin requerimientos pendientes</p>
              <p className="text-sm text-green-600 mt-0.5">Todos los requerimientos han sido revisados. ✓</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-amber-700">
                Pendientes de aprobación ({reqsPendientes.length})
              </h2>
            </div>

            {reqsPendientes.map(req => (
              <div key={req.id} className="bg-white border-2 border-amber-200 rounded-xl overflow-hidden">
                {/* Header del requerimiento */}
                <div className="px-5 py-4 flex items-start justify-between gap-4 border-b border-amber-100">
                  <div>
                    <Link
                      href={`/operaciones/requerimientos/${req.id}`}
                      className="font-mono text-sm font-bold text-[#13602C] hover:underline"
                    >
                      {formatNumRequerimiento(req.numero, req.anio)}
                    </Link>
                    <p className="font-semibold text-gray-800 mt-0.5">{req.descripcion}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Solicitado por {req.creadoPor.nombre} · {formatFecha(req.createdAt)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium whitespace-nowrap">
                      {req.cotizacionesProveedor.length} cotización{req.cotizacionesProveedor.length !== 1 ? 'es' : ''}
                    </span>
                    <Link href={`/operaciones/requerimientos/${req.id}`}>
                      <Button size="sm" className="bg-[#13602C] hover:bg-[#0e4a21] text-white whitespace-nowrap">
                        Revisar cotizaciones →
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Cotizaciones en tabla compacta */}
                <div className="divide-y divide-gray-50">
                  {req.cotizacionesProveedor.map(cot => (
                    <div key={cot.id} className="px-5 py-3 flex items-center justify-between gap-4 bg-gray-50/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-gray-400 flex-shrink-0">
                          {formatNumCotizacionProveedor(cot.numero, cot.anio)}
                        </span>
                        <span className="font-medium text-gray-700 truncate">{cot.proveedor.razonSocial}</span>
                        {cot.plazoEntregaDias && (
                          <span className="text-xs text-gray-400 flex-shrink-0">{cot.plazoEntregaDias}d</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-mono text-sm font-medium text-[#13602C]">
                          {cot.moneda} {cot.total.toFixed(2)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          cot.estado === 'APROBADA'        ? 'bg-green-100 text-green-700' :
                          cot.estado === 'RECHAZADA'       ? 'bg-red-100 text-red-700' :
                          cot.estado === 'ENVIADA_CALIDAD' ? 'bg-amber-100 text-amber-700' :
                                                             'bg-gray-100 text-gray-600'
                        }`}>
                          {ESTADO_COT_PROVEEDOR_LABELS[cot.estado] ?? cot.estado}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Historial */}
        {reqsHistorial.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-600 mb-3">Historial revisado</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Requerimiento</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Cotizaciones</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reqsHistorial.map(req => {
                    const aprobadas = req.cotizacionesProveedor.filter(c => c.estado === 'APROBADA').length
                    const rechazadas = req.cotizacionesProveedor.filter(c => c.estado === 'RECHAZADA').length
                    return (
                      <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/operaciones/requerimientos/${req.id}`}
                            className="font-mono text-xs font-semibold text-[#13602C] hover:underline">
                            {formatNumRequerimiento(req.numero, req.anio)}
                          </Link>
                          <p className="text-gray-600 text-xs mt-0.5 line-clamp-1">{req.descripcion}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {aprobadas > 0 && <span className="text-green-600">{aprobadas} aprobada{aprobadas !== 1 ? 's' : ''}</span>}
                          {aprobadas > 0 && rechazadas > 0 && ' · '}
                          {rechazadas > 0 && <span className="text-red-500">{rechazadas} rechazada{rechazadas !== 1 ? 's' : ''}</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            req.estado === 'COTIZACION_APROBADA' ? 'bg-green-100 text-green-700' :
                                                                   'bg-blue-100 text-blue-700'
                          }`}>
                            {ESTADO_REQUERIMIENTO_LABELS[req.estado] ?? req.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/operaciones/requerimientos/${req.id}`}
                            className="text-[#13602C] hover:text-[#0e4a21] font-medium text-xs">
                            Ver →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Vista Operaciones: tabla de cotizaciones individuales ──
  const cotizaciones = await prisma.cotizacionProveedor.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      proveedor:     { select: { razonSocial: true } },
      requerimiento: { select: { numero: true, anio: true, descripcion: true } },
      creadoPor:     { select: { nombre: true } },
    },
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Cotizaciones de Proveedor
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {cotizaciones.length} cotización{cotizaciones.length !== 1 ? 'es' : ''} registradas
          </p>
        </div>
      </div>

      {cotizaciones.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center py-16 gap-3">
          <ClipboardCheck className="w-10 h-10 text-gray-300" />
          <p className="text-gray-500 font-medium">No hay cotizaciones registradas</p>
          <p className="text-gray-400 text-sm">Agrega cotizaciones desde el detalle de un requerimiento</p>
        </div>
      ) : (
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
              {cotizaciones.map(cot => (
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
                      cot.estado === 'APROBADA'        ? 'bg-green-100 text-green-700' :
                      cot.estado === 'RECHAZADA'       ? 'bg-red-100 text-red-700' :
                      cot.estado === 'ENVIADA_CALIDAD' ? 'bg-amber-100 text-amber-700' :
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
    </div>
  )
}
