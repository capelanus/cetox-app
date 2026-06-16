import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatNumOrdenCompra, formatNumRecepcion } from '@/lib/format'

type EventoTipo = 'OC_CREADA' | 'OC_EDITADA' | 'RECEPCION' | 'INV_ENTRADA' | 'INV_SALIDA' | 'INV_AJUSTE'

interface Evento {
  id: string
  tipo: EventoTipo
  fecha: Date
  descripcion: string
  referencia?: { label: string; href: string }
  usuario: string
}

const TIPO_LABELS: Record<EventoTipo, string> = {
  OC_CREADA:   'OC creada',
  OC_EDITADA:  'OC editada',
  RECEPCION:   'Recepción',
  INV_ENTRADA: 'Inv. entrada',
  INV_SALIDA:  'Inv. salida',
  INV_AJUSTE:  'Inv. ajuste',
}

const TIPO_COLORS: Record<EventoTipo, string> = {
  OC_CREADA:   'bg-green-100 text-green-700',
  OC_EDITADA:  'bg-amber-100 text-amber-700',
  RECEPCION:   'bg-blue-100 text-blue-700',
  INV_ENTRADA: 'bg-teal-100 text-teal-700',
  INV_SALIDA:  'bg-red-100 text-red-700',
  INV_AJUSTE:  'bg-purple-100 text-purple-700',
}

export default async function HistorialLogisticaPage() {
  await requireRol(['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'])

  const [ocsCreadas, ocsEditadas, recepciones, movimientos] = await Promise.all([
    prisma.ordenCompra.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true, numero: true, anio: true, createdAt: true,
        proveedor: { select: { razonSocial: true } },
        emitidoPor: { select: { nombre: true } },
      },
    }),
    prisma.ordenCompraHistorial.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        usuario: { select: { nombre: true } },
        ordenCompra: { select: { id: true, numero: true, anio: true, proveedor: { select: { razonSocial: true } } } },
      },
    }),
    prisma.recepcion.findMany({
      orderBy: { fechaRecepcion: 'desc' },
      take: 100,
      include: {
        recibidoPor: { select: { nombre: true } },
        ordenCompra: { select: { id: true, proveedor: { select: { razonSocial: true } } } },
      },
    }),
    prisma.inventarioMovimiento.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        usuario: { select: { nombre: true } },
        inventarioItem: { select: { id: true, descripcion: true, unidad: true } },
      },
    }),
  ])

  const eventos: Evento[] = [
    ...ocsCreadas.map(oc => ({
      id:   `oc-${oc.id}`,
      tipo: 'OC_CREADA' as EventoTipo,
      fecha: oc.createdAt,
      descripcion: `OC emitida a ${oc.proveedor.razonSocial}`,
      referencia: { label: formatNumOrdenCompra(oc.numero, oc.anio), href: `/operaciones/ordenes-compra/${oc.id}` },
      usuario: oc.emitidoPor.nombre,
    })),
    ...ocsEditadas.map(h => ({
      id:   `hist-${h.id}`,
      tipo: 'OC_EDITADA' as EventoTipo,
      fecha: h.createdAt,
      descripcion: h.descripcion,
      referencia: { label: formatNumOrdenCompra(h.ordenCompra.numero, h.ordenCompra.anio), href: `/operaciones/ordenes-compra/${h.ordenCompra.id}` },
      usuario: h.usuario.nombre,
    })),
    ...recepciones.map(rec => ({
      id:   `rec-${rec.id}`,
      tipo: 'RECEPCION' as EventoTipo,
      fecha: rec.fechaRecepcion,
      descripcion: `Recepción de ${rec.ordenCompra.proveedor.razonSocial}${rec.areaDestino ? ` → ${rec.areaDestino}` : ''}`,
      referencia: { label: formatNumRecepcion(rec.numero, rec.anio), href: `/operaciones/recepciones/${rec.id}` },
      usuario: rec.recibidoPor.nombre,
    })),
    ...movimientos.map(mov => ({
      id:   `mov-${mov.id}`,
      tipo: (mov.tipo === 'ENTRADA' ? 'INV_ENTRADA' : mov.tipo === 'SALIDA' ? 'INV_SALIDA' : 'INV_AJUSTE') as EventoTipo,
      fecha: mov.createdAt,
      descripcion: `${mov.tipo === 'ENTRADA' ? '+' : mov.tipo === 'SALIDA' ? '-' : ''}${mov.cantidad} ${mov.inventarioItem.unidad ?? ''} · ${mov.inventarioItem.descripcion}${mov.areaDestino ? ` → ${mov.areaDestino}` : ''}${mov.descripcion ? ` (${mov.descripcion})` : ''}`,
      referencia: { label: mov.inventarioItem.descripcion.substring(0, 20), href: `/operaciones/inventario/${mov.inventarioItem.id}` },
      usuario: mov.usuario.nombre,
    })),
  ].sort((a, b) => b.fecha.getTime() - a.fecha.getTime())

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
          Historial de Logística
        </h1>
        <p className="text-gray-500 text-sm">{eventos.length} evento(s) · OC creadas, editadas, recepciones y movimientos de inventario</p>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TIPO_LABELS) as EventoTipo[]).map(tipo => (
          <span key={tipo} className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_COLORS[tipo]}`}>
            {TIPO_LABELS[tipo]}
          </span>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {eventos.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Sin actividad registrada aún</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Referencia</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Descripción</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {eventos.map(ev => (
                <tr key={ev.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                    {ev.fecha.toLocaleDateString('es-PE', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                    })}{' '}
                    {ev.fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${TIPO_COLORS[ev.tipo]}`}>
                      {TIPO_LABELS[ev.tipo]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {ev.referencia ? (
                      <Link href={ev.referencia.href} className="font-mono text-[#13602C] text-xs hover:underline">
                        {ev.referencia.label}
                      </Link>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{ev.descripcion}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{ev.usuario}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
