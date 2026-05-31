import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, Circle, Clock } from 'lucide-react'
import { formatNumRequerimiento, formatFecha } from '@/lib/format'
import { AREA_SOLICITANTE_LABELS, ESTADO_REQUERIMIENTO_LABELS } from '@/lib/constants'
import DeleteRequerimientoButton from '../delete-button'

const TODOS_LOS_ROLES = ['GERENTE_GENERAL', 'GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION', 'ADMINISTRACION', 'COORDINADOR_CALIDAD', 'ANALISTA'] as const

// Pasos del flujo en orden
const PASOS = [
  { estado: 'ENVIADO',             label: 'Solicitud enviada',         desc: 'Operaciones ha recibido tu solicitud' },
  { estado: 'EN_COTIZACION',       label: 'Buscando proveedores',      desc: 'Operaciones está cotizando con proveedores' },
  { estado: 'COTIZACION_APROBADA', label: 'Cotización aprobada',       desc: 'Calidad aprobó la mejor cotización' },
  { estado: 'OC_EMITIDA',          label: 'Orden de compra emitida',   desc: 'Se generó la orden de compra al proveedor' },
  { estado: 'EN_TRANSITO',         label: 'En tránsito',               desc: 'El proveedor está preparando/enviando el pedido' },
  { estado: 'RECEPCIONADO',        label: 'Recepcionado',              desc: 'El producto ingresó al almacén de Operaciones' },
  { estado: 'CERRADO',             label: 'Entregado y cerrado',       desc: 'El pedido fue entregado a tu área' },
]

const ORDEN_ESTADO: Record<string, number> = Object.fromEntries(PASOS.map((p, i) => [p.estado, i]))

export default async function SolicitudDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRol([...TODOS_LOS_ROLES])
  const { id } = await params

  const req = await prisma.requerimiento.findUnique({
    where: { id, creadoPorId: session.user.id }, // solo puede ver sus propias solicitudes
    include: {
      items: { orderBy: { orden: 'asc' } },
      cotizacionesProveedor: {
        where: { estado: 'APROBADA' },
        include: { proveedor: true },
        take: 1,
      },
      ordenesCompra: {
        include: { proveedor: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!req) notFound()

  const estadoActualIdx = ORDEN_ESTADO[req.estado] ?? 0
  const cancelado = req.estado === 'CANCELADO'
  const puedeEliminar = ['ENVIADO', 'BORRADOR'].includes(req.estado) && req.ordenesCompra.length === 0

  const oc = req.ordenesCompra[0]
  const cotAprobada = req.cotizacionesProveedor[0]

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/solicitudes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />Volver
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
              {formatNumRequerimiento(req.numero, req.anio)}
            </h1>
            {cancelado && (
              <span className="text-sm px-3 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Cancelado</span>
            )}
          </div>
          <p className="text-gray-600 text-sm mt-1">{req.descripcion}</p>
        </div>

        {/* Botón eliminar — solo si el proceso no ha avanzado */}
        {puedeEliminar && <DeleteRequerimientoButton id={id} variant="full" />}
      </div>

      {/* Tracker de progreso */}
      {!cancelado && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-700 mb-5">Estado de tu solicitud</h2>
          <div className="relative">
            {/* Línea de progreso */}
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-200" />
            {estadoActualIdx > 0 && (
              <div
                className="absolute left-5 top-5 w-0.5 bg-[#4AC3B2] transition-all"
                style={{ height: `${Math.min((estadoActualIdx / (PASOS.length - 1)) * 100, 100)}%` }}
              />
            )}

            <div className="space-y-6 relative">
              {PASOS.map((paso, i) => {
                const done    = i < estadoActualIdx
                const current = i === estadoActualIdx
                const pending = i > estadoActualIdx

                return (
                  <div key={paso.estado} className="flex items-start gap-4 pl-0">
                    {/* Icono */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 transition-all ${
                      done    ? 'bg-[#4AC3B2] border-[#4AC3B2]' :
                      current ? 'bg-[#13602C] border-[#13602C]' :
                                'bg-white border-gray-300'
                    }`}>
                      {done ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : current ? (
                        <Clock className="w-5 h-5 text-white" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300" />
                      )}
                    </div>

                    {/* Texto */}
                    <div className={`pt-1.5 ${pending ? 'opacity-40' : ''}`}>
                      <p className={`text-sm font-semibold ${current ? 'text-[#13602C]' : done ? 'text-gray-700' : 'text-gray-400'}`}>
                        {paso.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{paso.desc}</p>
                      {/* Detalles adicionales según paso */}
                      {current && paso.estado === 'COTIZACION_APROBADA' && cotAprobada && (
                        <p className="text-xs text-[#13602C] font-medium mt-1">
                          Proveedor seleccionado: {cotAprobada.proveedor.razonSocial} — {cotAprobada.moneda} {cotAprobada.total.toFixed(2)}
                        </p>
                      )}
                      {(done || current) && paso.estado === 'OC_EMITIDA' && oc && (
                        <p className="text-xs text-[#13602C] font-medium mt-1">
                          OC-{String(oc.numero).padStart(4, '0')}-{oc.anio} · {oc.proveedor.razonSocial}
                          {oc.fechaEntregaEstimada && ` · Entrega est. ${formatFecha(oc.fechaEntregaEstimada)}`}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Datos de la solicitud */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Datos de la solicitud</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <span className="text-gray-500">Área solicitante</span>
            <p className="font-medium text-gray-800">{AREA_SOLICITANTE_LABELS[req.areaSolicitante] ?? req.areaSolicitante}</p>
          </div>
          <div>
            <span className="text-gray-500">Urgencia</span>
            <p className={`font-medium ${req.urgencia === 'MUY_URGENTE' ? 'text-red-600' : req.urgencia === 'URGENTE' ? 'text-amber-600' : 'text-gray-800'}`}>
              {req.urgencia === 'MUY_URGENTE' ? '🔴 Muy urgente' : req.urgencia === 'URGENTE' ? '🟡 Urgente' : 'Normal'}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Fecha de solicitud</span>
            <p className="font-medium text-gray-800">{formatFecha(req.createdAt)}</p>
          </div>
          {req.fechaRequerida && (
            <div>
              <span className="text-gray-500">Fecha requerida</span>
              <p className="font-medium text-gray-800">{formatFecha(req.fechaRequerida)}</p>
            </div>
          )}
          {req.justificacion && (
            <div className="col-span-2">
              <span className="text-gray-500">Justificación</span>
              <p className="font-medium text-gray-800">{req.justificacion}</p>
            </div>
          )}
        </div>
      </div>

      {/* Ítems */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-700">
          Productos / Servicios solicitados
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-6">#</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Descripción</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Cant.</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Unidad</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Especificaciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {req.items.map((item, i) => (
              <tr key={item.id}>
                <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                <td className="px-4 py-2.5 font-medium text-gray-800">{item.descripcion}</td>
                <td className="px-4 py-2.5 text-gray-700">{item.cantidad}</td>
                <td className="px-4 py-2.5 text-gray-600">{item.unidad}</td>
                <td className="px-4 py-2.5 text-gray-500">{item.especificaciones || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
