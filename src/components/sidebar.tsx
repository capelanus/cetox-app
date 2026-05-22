'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  FlaskConical,
  FileText,
  ClipboardList,
  TestTube,
  FileCheck,
  Package,
  LogOut,
  ChevronRight,
  TrendingUp,
  TableProperties,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROL_LABELS, AREA_LABELS } from '@/lib/constants'

interface SidebarProps {
  userName: string
  userEmail: string
  userRol: string
  userArea: string | null
}

const allNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
  { href: '/clientes', label: 'Clientes', icon: Users, roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
  { href: '/ensayos', label: 'Ensayos', icon: FlaskConical, roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
  { href: '/cotizaciones', label: 'Cotizaciones', icon: FileText, roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
  { href: '/set', label: 'SET', icon: ClipboardList, roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
  { href: '/oda', label: 'ODA', icon: TestTube, roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION', 'ANALISTA'] },
  { href: '/informes', label: 'Informes', icon: FileCheck, roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
  { href: '/cargos', label: 'Cargos de Entrega', icon: Package, roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
  { href: '/ingresos', label: 'Ingresos', icon: TrendingUp, roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
  { href: '/resumen', label: 'Resumen', icon: TableProperties, roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
]

export function Sidebar({ userName, userEmail, userRol, userArea }: SidebarProps) {
  const pathname = usePathname()
  const navItems = allNavItems.filter((item) => item.roles.includes(userRol))

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 w-64 flex flex-col shadow-lg"
      style={{ backgroundColor: '#1F4E79' }}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/20">
        <div className="text-white font-bold text-xl">CETOX LAB</div>
        <div className="text-blue-200 text-xs mt-0.5">Sistema de Gestión LE-044</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-white/20 text-white'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.label}</span>
              {active && <ChevronRight className="ml-auto h-3 w-3" />}
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t border-white/20">
        <div className="mb-3">
          <p className="text-white text-sm font-medium truncate">{userName}</p>
          <p className="text-blue-200 text-xs truncate">{userEmail}</p>
          <p className="text-blue-300 text-xs mt-0.5">
            {ROL_LABELS[userRol] ?? userRol}
            {userArea ? ` — Área ${AREA_LABELS[userArea] ?? userArea}` : ''}
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 text-blue-200 hover:text-white text-sm transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
