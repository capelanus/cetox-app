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
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TableProperties,
  Microscope,
  Trash2,
  ShoppingCart,
  PackageCheck,
  RotateCcw,
  Receipt,
  CreditCard,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROL_LABELS, AREA_LABELS } from '@/lib/constants'

interface SidebarProps {
  userName:  string
  userEmail: string
  userRol:   string
  userArea:  string | null
  collapsed: boolean
  onToggle:  () => void
}

const allNavItems = [
  { href: '/dashboard',                 label: 'Dashboard',         icon: LayoutDashboard, roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
  { href: '/clientes',                  label: 'Clientes',          icon: Users,           roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
  { href: '/ensayos',                   label: 'Ensayos',           icon: FlaskConical,    roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
  { href: '/cotizaciones',              label: 'Cotizaciones',      icon: FileText,        roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
  { href: '/cotizaciones/papelera',     label: 'Papelera',          icon: Trash2,          roles: ['ADMINISTRACION', 'DIRECTOR_CALIDAD'], muted: true },
  { href: '/set',                       label: 'SET',               icon: ClipboardList,   roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
  { href: '/oda',                       label: 'ODA',               icon: TestTube,        roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION', 'ANALISTA'] },
  { href: '/informes',                  label: 'Informes',          icon: FileCheck,       roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION', 'ANALISTA'] },
  { href: '/cargos',                    label: 'Cargos de Entrega', icon: Package,         roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
  { href: '/ingresos',                  label: 'Ingresos',          icon: TrendingUp,      roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
  { href: '/resumen',                   label: 'Resumen',           icon: TableProperties, roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
]

const operacionesNavItems = [
  { href: '/operaciones',                           label: 'Panel Operaciones',  icon: LayoutDashboard, roles: ['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA', 'DIRECTOR_CALIDAD'] },
  { href: '/operaciones/requerimientos',            label: 'Requerimientos',     icon: ClipboardList,   roles: ['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'] },
  { href: '/operaciones/proveedores',               label: 'Proveedores',        icon: Building2,       roles: ['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'] },
  { href: '/operaciones/cotizaciones-proveedor',    label: 'Cotiz. Proveedor',   icon: FileText,        roles: ['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA', 'DIRECTOR_CALIDAD'] },
  { href: '/operaciones/ordenes-compra',            label: 'Órdenes de Compra',  icon: ShoppingCart,    roles: ['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'] },
  { href: '/operaciones/recepciones',               label: 'Recepciones',        icon: PackageCheck,    roles: ['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'] },
  { href: '/operaciones/devoluciones',              label: 'Devoluciones',       icon: RotateCcw,       roles: ['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'] },
  { href: '/operaciones/facturas',                  label: 'Facturas',           icon: Receipt,         roles: ['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA', 'DIRECTOR_CALIDAD'] },
  { href: '/operaciones/pagos',                     label: 'Gestión de Pagos',   icon: CreditCard,      roles: ['DIRECTOR_CALIDAD'] },
]

/* ─── Sidebar Cetox ──────────────────────────────────────────────────────── */

export function Sidebar({ userName, userEmail, userRol, userArea, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  let navItems: typeof allNavItems
  if (userRol === 'SUPER_ADMIN') {
    navItems = [...allNavItems, ...operacionesNavItems]
  } else if (userRol === 'JEFE_OPERACIONES' || userRol === 'ASISTENTE_LOGISTICA') {
    navItems = operacionesNavItems.filter(item => item.roles.includes(userRol))
  } else if (userRol === 'DIRECTOR_CALIDAD') {
    const mainItems = allNavItems.filter(item => item.roles.includes(userRol))
    const opItems = operacionesNavItems.filter(item => item.roles.includes(userRol))
    navItems = [...mainItems, ...opItems]
  } else {
    navItems = allNavItems.filter(item => item.roles.includes(userRol))
  }

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 flex flex-col overflow-hidden"
      onClick={collapsed ? onToggle : undefined}
      style={{
        backgroundColor: '#13602C',
        width:           collapsed ? '64px' : '256px',
        transition:      'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor:          collapsed ? 'pointer' : 'default',
      }}
    >
      {/* ── Logo / Header ── */}
      <div
        className="flex items-center py-5 flex-shrink-0"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.12)',
          padding:      collapsed ? '20px 0' : '20px',
          justifyContent: collapsed ? 'center' : 'space-between',
          transition:   'padding 0.3s ease',
        }}
      >
        {/* Icono + texto */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ backgroundColor: '#4AC3B2', width: 36, height: 36 }}
          >
            <Microscope className="h-5 w-5 text-white" />
          </div>

          {/* Texto: desaparece al colapsar */}
          <div
            className="overflow-hidden whitespace-nowrap"
            style={{
              maxWidth:   collapsed ? '0px' : '160px',
              opacity:    collapsed ? 0 : 1,
              transition: 'max-width 0.3s ease, opacity 0.2s ease',
            }}
          >
            <div
              className="text-white font-bold leading-none"
              style={{ fontFamily: 'var(--font-oswald)', fontSize: 17, letterSpacing: '0.12em' }}
            >
              CETOX
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: '#4AC3B2', letterSpacing: '0.07em' }}>
              SISTEMA ERP · LE-044
            </div>
          </div>
        </div>

        {/* Botón toggle — solo visible cuando está expandido */}
        {!collapsed && (
          <button
            onClick={onToggle}
            title="Colapsar sidebar"
            className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-md transition-all duration-150"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)'
              ;(e.currentTarget as HTMLElement).style.color = 'white'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Navegación ── */}
      <nav
        className="flex-1 py-3 overflow-y-auto overflow-x-hidden cetox-scroll"
        style={{ padding: collapsed ? '12px 8px' : '12px' }}
      >
        {/* Label de sección — oculto al colapsar */}
        <div
          className="overflow-hidden whitespace-nowrap"
          style={{
            maxHeight:  collapsed ? '0px' : '32px',
            opacity:    collapsed ? 0 : 1,
            transition: 'max-height 0.3s ease, opacity 0.2s ease',
          }}
        >
          <p
            className="px-3 pb-2 pt-1 text-[10px] font-semibold tracking-widest uppercase"
            style={{ color: 'rgba(74,195,178,0.7)' }}
          >
            Módulos
          </p>
        </div>

        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const muted = 'muted' in item && item.muted
            // Un ítem es activo si el pathname lo coincide PERO ningún ítem más específico (hijo) también coincide
            const active = (pathname === item.href || pathname.startsWith(item.href + '/')) &&
              !navItems.some(
                (other) =>
                  other.href !== item.href &&
                  (pathname === other.href || pathname.startsWith(other.href + '/')) &&
                  other.href.startsWith(item.href + '/')
              )

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center rounded-lg text-sm font-medium transition-all duration-150',
                  active ? 'text-white' : muted ? 'text-white/40 hover:text-white/70' : 'text-white/70 hover:text-white',
                )}
                style={{
                  gap:             collapsed ? 0 : 12,
                  padding:         collapsed ? '10px 0' : muted && !collapsed ? '6px 12px 6px 24px' : '10px 12px',
                  justifyContent:  collapsed ? 'center' : 'flex-start',
                  backgroundColor: active ? 'rgba(74,195,178,0.22)' : 'transparent',
                  borderLeft:      active && !collapsed ? '3px solid #4AC3B2' : '3px solid transparent',
                  transition:      'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.08)'
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                }}
              >
                <Icon
                  className="flex-shrink-0"
                  style={{
                    width:  collapsed ? 18 : muted ? 14 : 16,
                    height: collapsed ? 18 : muted ? 14 : 16,
                    color:  active ? '#4AC3B2' : 'inherit',
                  }}
                />

                {/* Texto del ítem */}
                <span
                  className="overflow-hidden whitespace-nowrap flex-1"
                  style={{
                    maxWidth:   collapsed ? '0px' : '180px',
                    opacity:    collapsed ? 0 : 1,
                    transition: 'max-width 0.3s ease, opacity 0.2s ease',
                    fontFamily: 'var(--font-montserrat)',
                  }}
                >
                  {item.label}
                </span>

                {/* Chevron activo */}
                {active && !collapsed && (
                  <ChevronRight className="ml-auto h-3 w-3 flex-shrink-0" style={{ color: '#4AC3B2' }} />
                )}

                {/* Punto activo en modo colapsado */}
                {active && collapsed && (
                  <span
                    className="absolute right-1.5 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: '#4AC3B2' }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* ── Footer usuario ── */}
      <div
        className="flex-shrink-0"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.12)',
          padding:   collapsed ? '12px 8px' : '16px',
        }}
      >
        {/* Botón expand — solo visible en modo colapsado */}
        {collapsed && (
          <button
            onClick={onToggle}
            title="Expandir sidebar"
            className="flex items-center justify-center w-full mb-3 rounded-lg transition-all duration-150"
            style={{ height: 36, color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.08)'
              ;(e.currentTarget as HTMLElement).style.color = 'white'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Avatar + info */}
        <div
          className="flex items-center mb-3"
          style={{ gap: collapsed ? 0 : 12, justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          <div
            className="flex items-center justify-center rounded-full font-bold flex-shrink-0 uppercase"
            style={{
              backgroundColor: '#4AC3B2',
              color:           '#13602C',
              fontFamily:      'var(--font-oswald)',
              width:  collapsed ? 36 : 32,
              height: collapsed ? 36 : 32,
              fontSize: 13,
              transition: 'width 0.3s ease, height 0.3s ease',
            }}
          >
            {userName.charAt(0)}
          </div>

          <div
            className="min-w-0 overflow-hidden"
            style={{
              maxWidth:   collapsed ? '0px' : '160px',
              opacity:    collapsed ? 0 : 1,
              transition: 'max-width 0.3s ease, opacity 0.2s ease',
            }}
          >
            <p className="text-white text-sm font-semibold truncate whitespace-nowrap" style={{ fontFamily: 'var(--font-montserrat)' }}>
              {userName}
            </p>
            <p className="text-white/50 text-[10px] truncate whitespace-nowrap">{userEmail}</p>
            <p className="text-[10px] mt-0.5 whitespace-nowrap" style={{ color: '#4AC3B2' }}>
              {ROL_LABELS[userRol] ?? userRol}
              {userArea ? ` · ${AREA_LABELS[userArea] ?? userArea}` : ''}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          title={collapsed ? 'Cerrar sesión' : undefined}
          className="flex items-center w-full rounded-lg text-sm transition-all duration-150"
          style={{
            gap:            collapsed ? 0 : 8,
            padding:        collapsed ? '8px 0' : '8px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            color:          'rgba(255,255,255,0.5)',
            fontFamily:     'var(--font-montserrat)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.08)'
            ;(e.currentTarget as HTMLElement).style.color = 'white'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'
          }}
        >
          <LogOut style={{ width: collapsed ? 18 : 16, height: collapsed ? 18 : 16, flexShrink: 0 }} />
          <span
            className="overflow-hidden whitespace-nowrap"
            style={{
              maxWidth:   collapsed ? '0px' : '120px',
              opacity:    collapsed ? 0 : 1,
              transition: 'max-width 0.3s ease, opacity 0.2s ease',
            }}
          >
            Cerrar sesión
          </span>
        </button>
      </div>
    </aside>
  )
}
