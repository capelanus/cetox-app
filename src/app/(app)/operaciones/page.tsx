import { requireOperaciones } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { formatNumRequerimiento, formatNumOrdenCompra } from '@/lib/format'
import { formatFecha } from '@/lib/format'
import Link from 'next/link'

export default async function OperacionesDashboard() {
  const session = await requireOperaciones()
  const rol = session.user.rol

  const [
    totalReq,
    reqPendientes,
    totalOC,
    ocEnTransito,
    totalFacturas,
    facturasPendientes,
    recentRequerimientos,
    recentOC,
  ] = await Promise.all([
    prisma.requerimiento.count(),
    prisma.requerimiento.count({ where: { estado: { in: ['BORRADOR', 'ENVIADO', 'EN_COTIZACION'] } } }),
    prisma.ordenCompra.count(),
    prisma.ordenCompra.count({ where: { estado: 'EN_TRANSITO' } }),
    prisma.factura.count(),
    prisma.factura.count({ where: { estado: 'REGISTRADA' } }),
    prisma.requerimiento.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { creadoPor: true } }),
    prisma.ordenCompra.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { proveedor: true } }),
  ])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
          Panel de Operaciones
        </h1>
        <p className="text-gray-500 text-sm mt-1">Gestión de abastecimiento y compras</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Requerimientos</p>
          <p className="text-3xl font-bold text-[#13602C] mt-1">{totalReq}</p>
          <p className="text-xs text-amber-600 mt-1">{reqPendientes} pendientes</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Órdenes de Compra</p>
          <p className="text-3xl font-bold text-[#13602C] mt-1">{totalOC}</p>
          <p className="text-xs text-blue-600 mt-1">{ocEnTransito} en tránsito</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Facturas</p>
          <p className="text-3xl font-bold text-[#13602C] mt-1">{totalFacturas}</p>
          <p className="text-xs text-amber-600 mt-1">{facturasPendientes} sin provisión</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Área</p>
          <p className="text-lg font-bold text-[#13602C] mt-1">Operaciones</p>
          <p className="text-xs text-gray-500 mt-1">
            {rol === 'DIRECTOR_CALIDAD'
              ? 'Director de Calidad'
              : rol === 'JEFE_OPERACIONES'
              ? 'Jefe de Operaciones'
              : 'Asistente de Logística'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Requerimientos */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700">Últimos Requerimientos</h2>
            <Link href="/operaciones/requerimientos" className="text-xs text-[#4AC3B2] hover:underline">Ver todos →</Link>
          </div>
          <div className="space-y-2">
            {recentRequerimientos.map(req => (
              <Link
                key={req.id}
                href={`/operaciones/requerimientos/${req.id}`}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{formatNumRequerimiento(req.numero, req.anio)}</p>
                  <p className="text-xs text-gray-500 truncate max-w-[180px]">{req.descripcion}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    req.estado === 'CERRADO'
                      ? 'bg-green-100 text-green-700'
                      : req.estado === 'EN_COTIZACION'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {req.estado.replace(/_/g, ' ')}
                </span>
              </Link>
            ))}
            {recentRequerimientos.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Sin requerimientos</p>
            )}
          </div>
        </div>

        {/* Recent OC */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700">Últimas Órdenes de Compra</h2>
            <Link href="/operaciones/ordenes-compra" className="text-xs text-[#4AC3B2] hover:underline">Ver todas →</Link>
          </div>
          <div className="space-y-2">
            {recentOC.map(oc => (
              <Link
                key={oc.id}
                href={`/operaciones/ordenes-compra/${oc.id}`}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{formatNumOrdenCompra(oc.numero, oc.anio)}</p>
                  <p className="text-xs text-gray-500">{oc.proveedor.razonSocial}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    oc.estado === 'CERRADA'
                      ? 'bg-green-100 text-green-700'
                      : oc.estado === 'EN_TRANSITO'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {oc.estado.replace(/_/g, ' ')}
                </span>
              </Link>
            ))}
            {recentOC.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Sin órdenes de compra</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
