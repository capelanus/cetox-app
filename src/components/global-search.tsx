'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import {
  Search, X,
  LayoutDashboard, Users, FlaskConical, FileText, ClipboardList,
  TestTube, FileCheck, Package, TrendingUp, TableProperties,
  ShoppingBag, Wallet, Users2, Building2, ShoppingCart,
  PackageCheck, RotateCcw, Receipt, CreditCard, Microscope, Wrench,
  PalmtreeIcon, Hash,
} from 'lucide-react'

interface SearchItem {
  id:       string
  label:    string
  href:     string
  group:    string
  icon:     React.ElementType
  keywords?: string
}

const ALL_ITEMS: SearchItem[] = [
  // Principal
  { id: 'dashboard',       label: 'Dashboard',            href: '/dashboard',                       group: 'Principal',    icon: LayoutDashboard },
  { id: 'clientes',        label: 'Clientes',             href: '/clientes',                        group: 'Principal',    icon: Users,         keywords: 'empresas contactos' },
  { id: 'ensayos',         label: 'Ensayos',              href: '/ensayos',                         group: 'Calidad',      icon: FlaskConical,  keywords: 'muestras analisis' },
  { id: 'cotizaciones',    label: 'Cotizaciones',         href: '/cotizaciones',                    group: 'Principal',    icon: FileText,      keywords: 'presupuesto propuesta' },
  { id: 'set',             label: 'SET',                  href: '/set',                             group: 'Calidad',      icon: ClipboardList, keywords: 'servicio especial' },
  { id: 'oda',             label: 'ODA',                  href: '/oda',                             group: 'Calidad',      icon: TestTube,      keywords: 'orden disponibilidad' },
  { id: 'informes',        label: 'Informes',             href: '/informes',                        group: 'Calidad',      icon: FileCheck,     keywords: 'reportes resultados' },
  { id: 'cargos',          label: 'Cargos de Entrega',   href: '/cargos',                          group: 'Calidad',      icon: Package },
  { id: 'ingresos',        label: 'Ingresos',             href: '/ingresos',                        group: 'Principal',    icon: TrendingUp,    keywords: 'facturacion ventas' },
  { id: 'resumen',         label: 'Resumen',              href: '/resumen',                         group: 'Principal',    icon: TableProperties },
  { id: 'solicitudes',     label: 'Mis Solicitudes',      href: '/solicitudes',                     group: 'Principal',    icon: ShoppingBag },
  { id: 'caja-chica',      label: 'Caja Chica',           href: '/caja-chica',                      group: 'Finanzas',     icon: Wallet,        keywords: 'gastos fondo' },
  // RRHH
  { id: 'rrhh',            label: 'RRHH',                 href: '/rrhh',                            group: 'RRHH',         icon: Users2 },
  { id: 'personal',        label: 'Personal',             href: '/rrhh/personal',                   group: 'RRHH',         icon: Users,         keywords: 'empleados trabajadores' },
  { id: 'vacaciones',      label: 'Vacaciones',           href: '/rrhh/vacaciones',                 group: 'RRHH',         icon: PalmtreeIcon,  keywords: 'descanso licencia' },
  { id: 'contratos',       label: 'Contratos',            href: '/rrhh/contratos',                  group: 'RRHH',         icon: ClipboardList, keywords: 'acuerdos documentos' },
  { id: 'estructura',      label: 'Estructura Org.',      href: '/rrhh/estructura',                 group: 'RRHH',         icon: Building2,     keywords: 'organigrama areas' },
  // Operaciones
  { id: 'op-panel',        label: 'Panel Operaciones',    href: '/operaciones',                     group: 'Operaciones',  icon: LayoutDashboard },
  { id: 'requerimientos',  label: 'Requerimientos',       href: '/operaciones/requerimientos',      group: 'Operaciones',  icon: ClipboardList, keywords: 'solicitudes compra' },
  { id: 'proveedores',     label: 'Proveedores',          href: '/operaciones/proveedores',         group: 'Operaciones',  icon: Building2,     keywords: 'suppliers vendors' },
  { id: 'cotiz-proveedor', label: 'Cotiz. Proveedor',     href: '/operaciones/cotizaciones-proveedor', group: 'Operaciones', icon: FileText },
  { id: 'ordenes-compra',  label: 'Órdenes de Compra',   href: '/operaciones/ordenes-compra',      group: 'Operaciones',  icon: ShoppingCart,  keywords: 'po purchase order' },
  { id: 'recepciones',     label: 'Recepciones',          href: '/operaciones/recepciones',         group: 'Operaciones',  icon: PackageCheck,  keywords: 'recibir ingreso' },
  { id: 'devoluciones',    label: 'Devoluciones',         href: '/operaciones/devoluciones',        group: 'Operaciones',  icon: RotateCcw },
  { id: 'facturas',        label: 'Facturas',             href: '/operaciones/facturas',            group: 'Operaciones',  icon: Receipt,       keywords: 'boletas documentos' },
  { id: 'pagos',           label: 'Gestión de Pagos',     href: '/operaciones/pagos',               group: 'Operaciones',  icon: CreditCard,    keywords: 'transferencias banco' },
  { id: 'inventario',      label: 'Inventario',           href: '/operaciones/inventario',          group: 'Operaciones',  icon: Microscope,    keywords: 'stock materiales reactivos' },
  // Equipos
  { id: 'equipos',         label: 'Equipos',              href: '/equipos',                         group: 'Calidad',      icon: Wrench,        keywords: 'mantenimiento calibracion' },
  // Chat
  { id: 'chat-general',    label: 'Chat · General',       href: '#chat-general',                    group: 'Chat',         icon: Hash },
  { id: 'chat-gerencia',   label: 'Chat · Gerencia',      href: '#chat-gerencia',                   group: 'Chat',         icon: Hash },
  { id: 'chat-operaciones',label: 'Chat · Operaciones',   href: '#chat-operaciones',                group: 'Chat',         icon: Hash },
]

interface Props {
  userRol: string
}

export function GlobalSearch({ userRol }: Props) {
  const [open, setOpen]   = useState(false)
  const router            = useRouter()

  // ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleSelect = useCallback((href: string) => {
    setOpen(false)
    if (href.startsWith('#chat-')) {
      // dispatch a custom event to open the chat at a specific channel
      window.dispatchEvent(new CustomEvent('cetox:open-chat', { detail: { canal: href.slice(6) } }))
    } else {
      router.push(href)
    }
  }, [router])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Búsqueda global (⌘K)"
        className="flex items-center gap-2 px-3 h-8 rounded-lg text-sm transition-all duration-200 select-none"
        style={{
          backgroundColor: 'rgba(0,0,0,0.05)',
          color:           '#64748b',
          border:          '1px solid rgba(0,0,0,0.08)',
          minWidth:        120,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.09)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.05)' }}
      >
        <Search className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="text-xs flex-1 text-left hidden sm:block">Buscar…</span>
        <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] font-mono text-slate-400">
          <span>⌘</span><span>K</span>
        </kbd>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <Command className="w-full" label="Búsqueda global">
          {/* Search input */}
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <Search className="h-4 w-4 flex-shrink-0" style={{ color: '#4AC3B2' }} />
            <Command.Input
              autoFocus
              placeholder="Buscar módulos, páginas…"
              className="flex-1 bg-transparent text-sm outline-none placeholder-slate-400"
              style={{ color: 'var(--foreground)' }}
            />
            <button
              onClick={() => setOpen(false)}
              className="flex items-center justify-center w-6 h-6 rounded-md transition-colors"
              style={{ color: '#94a3b8' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Results */}
          <Command.List className="max-h-[320px] overflow-y-auto py-2 cetox-scroll">
            <Command.Empty className="py-8 text-center text-sm text-slate-400">
              No se encontraron resultados
            </Command.Empty>

            {['Principal', 'Calidad', 'Operaciones', 'Finanzas', 'RRHH', 'Chat'].map(group => {
              const items = ALL_ITEMS.filter(i => i.group === group)
              return (
                <Command.Group key={group} heading={group}>
                  <div
                    className="px-3 py-1 text-[10px] font-semibold tracking-widest uppercase"
                    style={{ color: '#4AC3B2' }}
                  >
                    {group}
                  </div>
                  {items.map(item => {
                    const Icon = item.icon
                    return (
                      <Command.Item
                        key={item.id}
                        value={`${item.label} ${item.keywords ?? ''}`}
                        onSelect={() => handleSelect(item.href)}
                        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm transition-colors rounded-lg mx-1 mb-0.5"
                        style={{ color: 'var(--foreground)' }}
                        data-selected-style="background: rgba(74,195,178,0.12);"
                      >
                        <div
                          className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: 'rgba(74,195,178,0.12)' }}
                        >
                          <Icon className="h-3.5 w-3.5" style={{ color: '#4AC3B2' }} />
                        </div>
                        <span>{item.label}</span>
                      </Command.Item>
                    )
                  })}
                </Command.Group>
              )
            })}
          </Command.List>

          {/* Footer */}
          <div
            className="flex items-center gap-4 px-4 py-2 text-[10px]"
            style={{ borderTop: '1px solid var(--border)', color: '#94a3b8' }}
          >
            <span className="flex items-center gap-1"><kbd className="font-mono">↑↓</kbd> navegar</span>
            <span className="flex items-center gap-1"><kbd className="font-mono">↵</kbd> abrir</span>
            <span className="flex items-center gap-1"><kbd className="font-mono">Esc</kbd> cerrar</span>
          </div>
        </Command>
      </div>
    </div>
  )
}
