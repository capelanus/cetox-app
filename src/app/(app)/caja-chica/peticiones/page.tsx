import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Plus, Banknote, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AprobacionButtons } from './aprobacion-buttons'

function fmt(monto: number, moneda: string) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency', currency: moneda, minimumFractionDigits: 2,
  }).format(monto)
}

function EstadoBadge({ estado }: { estado: string }) {
  if (estado === 'PENDIENTE') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
        <Clock className="h-3 w-3" /> Pendiente
      </span>
    )
  }
  if (estado === 'APROBADA') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="h-3 w-3" /> Aprobada
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
      <XCircle className="h-3 w-3" /> Rechazada
    </span>
  )
}

export default async function PeticionesPage() {
  const session = await requireRol(['DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION'])
  const rol = session.user.rol
  const esAdmin = rol === 'DIRECTOR_ADMINISTRACION' || rol === 'SUPER_ADMIN'

  const peticiones = await prisma.peticionEfectivo.findMany({
    where: esAdmin ? undefined : { solicitanteId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      solicitante: { select: { nombre: true } },
      aprobadaPor: { select: { nombre: true } },
    },
  })

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/caja-chica"
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Caja Chica
          </Link>
          <span className="text-slate-300">/</span>
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-oswald)', color: '#13602C', letterSpacing: '0.04em' }}
            >
              Peticiones de Efectivo
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {esAdmin
                ? 'Revisión y aprobación de solicitudes'
                : 'Mis solicitudes de efectivo'}
            </p>
          </div>
        </div>

        {!esAdmin && (
          <Link
            href="/caja-chica/peticiones/nueva"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: '#13602C' }}
          >
            <Plus className="h-4 w-4" />
            Nueva Petición
          </Link>
        )}
      </div>

      {/* Content */}
      {peticiones.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm px-6 py-16 text-center">
          <Banknote className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">
            {esAdmin ? 'No hay peticiones registradas' : 'Aún no has creado ninguna petición'}
          </p>
          {!esAdmin && (
            <Link href="/caja-chica/peticiones/nueva" className="text-sm mt-2 inline-block font-medium" style={{ color: '#13602C' }}>
              Crear la primera petición
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b bg-slate-50 text-xs text-slate-500 flex items-center gap-3">
            <span>{peticiones.length} petición{peticiones.length !== 1 ? 'es' : ''}</span>
            <span className="text-amber-600 font-medium">
              {peticiones.filter(p => p.estado === 'PENDIENTE').length} pendiente(s)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Fecha</th>
                  {esAdmin && <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Solicitante</th>}
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Concepto</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs">Monto Solicitado</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Estado</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs">Monto Aprobado</th>
                  {esAdmin && <th className="px-4 py-3 font-semibold text-slate-600 text-xs">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {peticiones.map((p) => (
                  <tr
                    key={p.id}
                    className={`transition-colors ${p.estado === 'PENDIENTE' ? 'hover:bg-amber-50/40' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono whitespace-nowrap">
                      #{String(p.numero).padStart(3, '0')}-{p.anio}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {format(new Date(p.createdAt), 'dd/MM/yyyy', { locale: es })}
                    </td>
                    {esAdmin && (
                      <td className="px-4 py-3 text-xs text-slate-700 font-medium">
                        {p.solicitante.nombre}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{p.concepto}</p>
                      {p.justificacion && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{p.justificacion}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700 whitespace-nowrap">
                      {fmt(p.montoSolicitado, p.moneda)}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={p.estado} />
                      {p.estado === 'RECHAZADA' && p.motivoRechazo && (
                        <p className="text-xs text-red-500 mt-1 max-w-[180px] line-clamp-2">{p.motivoRechazo}</p>
                      )}
                      {p.estado !== 'PENDIENTE' && p.aprobadaPor && (
                        <p className="text-xs text-slate-400 mt-0.5">{p.aprobadaPor.nombre}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {p.montoAprobado != null ? (
                        <span className="font-semibold text-emerald-700">{fmt(p.montoAprobado, p.moneda)}</span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    {esAdmin && (
                      <td className="px-4 py-3">
                        {p.estado === 'PENDIENTE' ? (
                          <AprobacionButtons
                            peticionId={p.id}
                            montoSolicitado={p.montoSolicitado}
                            moneda={p.moneda}
                          />
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
