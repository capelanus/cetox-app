import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { Shield, UserCheck, UserX, AlertTriangle } from 'lucide-react'
import { UserAvatar } from '@/components/ui/user-avatar'
import { ToggleAcceso } from './toggle-acceso'

const ROL_LABEL: Record<string, string> = {
  DIRECTOR_ADMINISTRACION: 'Dir. Adm. y Finanzas',
  ADMINISTRACION:          'Administración',
  JEFE_OPERACIONES:        'Jefe de Operaciones',
  ASISTENTE_LOGISTICA:     'Asistente de Logística',
  ANALISTA:                'Analista',
}

const ROL_COLOR: Record<string, { color: string; bg: string }> = {
  DIRECTOR_ADMINISTRACION: { color: '#7c3aed', bg: '#ede9fe' },
  ADMINISTRACION:          { color: '#1d4ed8', bg: '#dbeafe' },
  JEFE_OPERACIONES:        { color: '#16a34a', bg: '#dcfce7' },
  ASISTENTE_LOGISTICA:     { color: '#0891b2', bg: '#cffafe' },
  ANALISTA:                { color: '#d97706', bg: '#fef3c7' },
}

// Roles que esta página puede controlar
const ROLES_CONTROLABLES = ['DIRECTOR_ADMINISTRACION', 'ADMINISTRACION', 'JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA', 'ANALISTA']

export default async function GerenciaAccesosPage() {
  const session = await requireRol(['DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION', 'GERENTE_TECNICO'])

  const usuarios = await prisma.usuario.findMany({
    where:   { rol: { in: ROLES_CONTROLABLES } },
    select:  { id: true, nombre: true, email: true, rol: true, activo: true, area: true, createdAt: true },
    orderBy: [{ rol: 'asc' }, { nombre: 'asc' }],
  })

  const activos    = usuarios.filter(u => u.activo).length
  const inactivos  = usuarios.filter(u => !u.activo).length

  // Group by rol
  const grupos: Record<string, typeof usuarios> = {}
  for (const u of usuarios) {
    if (!grupos[u.rol]) grupos[u.rol] = []
    grupos[u.rol].push(u)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5" style={{ color: '#4AC3B2' }} />
            <h1
              className="text-2xl font-bold uppercase tracking-wide"
              style={{ color: '#13602C', fontFamily: 'var(--font-oswald)' }}
            >
              Control de Accesos
            </h1>
          </div>
          <p className="text-sm" style={{ color: '#808080' }}>
            Activa o desactiva el acceso al ERP por usuario
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg" style={{ backgroundColor: '#dcfce7' }}>
            <UserCheck className="h-4 w-4 text-green-600" />
            <span className="text-sm font-bold text-green-700">{activos} activos</span>
          </div>
          {inactivos > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg" style={{ backgroundColor: '#fee2e2' }}>
              <UserX className="h-4 w-4 text-red-600" />
              <span className="text-sm font-bold text-red-700">{inactivos} desactivados</span>
            </div>
          )}
        </div>
      </div>

      {/* Warning banner */}
      <div
        className="flex items-start gap-3 px-4 py-3 rounded-xl mb-6"
        style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}
      >
        <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <span className="font-semibold text-amber-700">Importante: </span>
          <span className="text-amber-600">
            Al desactivar un usuario, su sesión activa continuará hasta que cierre sesión manualmente o expire.
            Solo afecta nuevos intentos de inicio de sesión.
          </span>
        </div>
      </div>

      {/* Users grouped by rol */}
      <div className="space-y-5">
        {ROLES_CONTROLABLES.filter(rol => grupos[rol]?.length > 0).map(rol => {
          const usersDelRol = grupos[rol]
          const cfg = ROL_COLOR[rol] ?? { color: '#64748b', bg: '#f1f5f9' }

          return (
            <div key={rol} className="cetox-card overflow-hidden">
              {/* Group header */}
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ backgroundColor: cfg.bg, color: cfg.color }}
                  >
                    {ROL_LABEL[rol] ?? rol}
                  </span>
                  <span className="text-xs text-slate-400">{usersDelRol.length} usuario{usersDelRol.length !== 1 ? 's' : ''}</span>
                </div>
                <span className="text-xs text-slate-400">
                  {usersDelRol.filter(u => u.activo).length} activos
                </span>
              </div>

              {/* User rows */}
              <div className="divide-y divide-slate-50">
                {usersDelRol.map(u => (
                  <div
                    key={u.id}
                    className="flex items-center gap-4 px-5 py-4 transition-colors"
                    style={{
                      backgroundColor: !u.activo ? 'rgba(239,68,68,0.03)' : 'transparent',
                    }}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <UserAvatar
                        nombre={u.nombre}
                        size="md"
                        style={!u.activo ? { filter: 'grayscale(0.8)', opacity: 0.6 } : {}}
                      />
                      {!u.activo && (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full"
                          style={{ backgroundColor: '#ef4444', border: '2px solid white' }}
                        >
                          <UserX className="h-2.5 w-2.5 text-white" />
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-semibold text-sm truncate"
                        style={{ color: u.activo ? '#1e293b' : '#94a3b8' }}
                      >
                        {u.nombre}
                        {u.id === session?.user?.id && (
                          <span className="ml-2 text-[10px] font-normal text-slate-400">(tú)</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      {u.area && (
                        <p className="text-[10px] text-slate-300 mt-0.5">{u.area}</p>
                      )}
                    </div>

                    {/* Último acceso / fecha creación */}
                    <div className="hidden sm:block text-right flex-shrink-0">
                      <p className="text-[10px] text-slate-400">Creado</p>
                      <p className="text-xs text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Toggle — no se puede controlar el propio usuario */}
                    <div className="flex-shrink-0">
                      {u.id === session?.user?.id ? (
                        <span className="text-xs text-slate-300 italic">tu cuenta</span>
                      ) : (
                        <ToggleAcceso
                          usuarioId={u.id}
                          nombre={u.nombre}
                          activo={u.activo}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {usuarios.length === 0 && (
          <div className="cetox-card py-16 flex flex-col items-center gap-3">
            <Shield className="h-12 w-12 text-slate-200" />
            <p className="text-slate-400 font-medium">No hay usuarios para administrar</p>
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-300 mt-4 text-center">
        Solo se muestran usuarios de Administración, Operaciones y Analistas ·
        Los gerentes no pueden ser desactivados desde esta pantalla
      </p>
    </div>
  )
}
