import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { formatNumRequerimiento, formatFecha } from '@/lib/format'
import { AREA_SOLICITANTE_LABELS, ESTADO_REQUERIMIENTO_LABELS, URGENCIA_LABELS } from '@/lib/constants'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, CheckCircle2, Clock, AlertCircle, Circle, Trash2 } from 'lucide-react'
import { eliminarRequerimiento } from '@/app/actions/requerimientos'

const TODOS_LOS_ROLES = ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION', 'ANALISTA'] as const

const estadoConfig: Record<string, { icon: typeof Circle; color: string; bg: string }> = {
  ENVIADO:             { icon: Clock,         color: 'text-amber-700',  bg: 'bg-amber-50'  },
  EN_COTIZACION:       { icon: AlertCircle,   color: 'text-blue-700',   bg: 'bg-blue-50'   },
  COTIZACION_APROBADA: { icon: CheckCircle2,  color: 'text-teal-700',   bg: 'bg-teal-50'   },
  OC_EMITIDA:          { icon: CheckCircle2,  color: 'text-indigo-700', bg: 'bg-indigo-50' },
  EN_TRANSITO:         { icon: Clock,         color: 'text-purple-700', bg: 'bg-purple-50' },
  RECEPCIONADO:        { icon: CheckCircle2,  color: 'text-green-700',  bg: 'bg-green-50'  },
  CERRADO:             { icon: CheckCircle2,  color: 'text-gray-700',   bg: 'bg-gray-100'  },
  CANCELADO:           { icon: AlertCircle,   color: 'text-red-700',    bg: 'bg-red-50'    },
}

export default async function MisSolicitudesPage() {
  const session = await requireRol([...TODOS_LOS_ROLES])
  const userId = session.user.id

  const reqs = await prisma.requerimiento.findMany({
    where: { creadoPorId: userId },
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  })

  const pendientes = reqs.filter(r => ['ENVIADO', 'EN_COTIZACION'].includes(r.estado)).length
  const enCurso   = reqs.filter(r => ['COTIZACION_APROBADA', 'OC_EMITIDA', 'EN_TRANSITO'].includes(r.estado)).length
  const cerrados  = reqs.filter(r => r.estado === 'CERRADO').length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Mis Solicitudes
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Solicitudes de compra enviadas a Operaciones
          </p>
        </div>
        <Link href="/solicitudes/nuevo">
          <Button className="bg-[#13602C] hover:bg-[#0e4a21] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nueva solicitud
          </Button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Pendientes</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{pendientes}</p>
          <p className="text-xs text-gray-400 mt-1">esperando cotización</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">En proceso</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{enCurso}</p>
          <p className="text-xs text-gray-400 mt-1">en compra o tránsito</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Completadas</p>
          <p className="text-3xl font-bold text-[#13602C] mt-1">{cerrados}</p>
          <p className="text-xs text-gray-400 mt-1">recibidas y cerradas</p>
        </div>
      </div>

      {/* Lista */}
      {reqs.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center py-16 gap-3">
          <ShoppingBagIcon className="w-10 h-10 text-gray-300" />
          <p className="text-gray-500 font-medium">Aún no tienes solicitudes</p>
          <p className="text-gray-400 text-sm">Crea tu primera solicitud de compra para el área de Operaciones</p>
          <Link href="/solicitudes/nuevo">
            <Button className="mt-2 bg-[#13602C] hover:bg-[#0e4a21] text-white">
              <Plus className="w-4 h-4 mr-2" />Nueva solicitud
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reqs.map(req => {
            const cfg = estadoConfig[req.estado]
            const Icon = cfg?.icon ?? Circle
            const puedeEliminar = ['ENVIADO', 'BORRADOR'].includes(req.estado) && req.items.length >= 0
            const eliminar = eliminarRequerimiento.bind(null, req.id)
            return (
              <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4 hover:shadow-sm hover:border-gray-300 transition-all">
                <div className={`p-2 rounded-lg flex-shrink-0 ${cfg?.bg ?? 'bg-gray-100'}`}>
                  <Icon className={`w-5 h-5 ${cfg?.color ?? 'text-gray-500'}`} />
                </div>
                <Link href={`/solicitudes/${req.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-[#13602C]">
                      {formatNumRequerimiento(req.numero, req.anio)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg?.bg ?? 'bg-gray-100'} ${cfg?.color ?? 'text-gray-600'}`}>
                      {ESTADO_REQUERIMIENTO_LABELS[req.estado] ?? req.estado}
                    </span>
                    {req.urgencia !== 'NORMAL' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${req.urgencia === 'MUY_URGENTE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {URGENCIA_LABELS[req.urgencia]}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-800 text-sm font-medium mt-1 truncate">{req.descripcion}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{AREA_SOLICITANTE_LABELS[req.areaSolicitante] ?? req.areaSolicitante}</span>
                    <span>·</span>
                    <span>{req.items.length} ítem{req.items.length !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>{formatFecha(req.createdAt)}</span>
                  </div>
                </Link>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {puedeEliminar && (
                    <form action={eliminar}>
                      <button
                        type="submit"
                        onClick={e => {
                          if (!confirm('¿Eliminar esta solicitud?')) e.preventDefault()
                        }}
                        title="Eliminar solicitud"
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                  <span className="text-gray-400 text-xs">Ver →</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Inline icon para el estado vacío
function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  )
}
