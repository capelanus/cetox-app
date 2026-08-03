'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  Users2,
  PalmtreeIcon,
  CalendarDays,
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
  ShoppingBag,
  Wallet,
  Wrench,
  Calendar,
  History,
  DollarSign,
  BarChart2,
  Shield,
  Banknote,
  Landmark,
  FolderOpen,
  ClipboardCheck,
  BookOpen,
  FileStack,
  ListChecks,
  ShieldCheck,
  MessageSquare,
  Target,
  Gauge,
  ShieldAlert,
  Rocket,
  Goal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROL_LABELS, AREA_LABELS } from '@/lib/constants'
import { getInitials } from '@/components/ui/user-avatar'

// ── Types ─────────────────────────────────────────────────────────────────────

interface NavItem {
  href:   string
  label:  string
  icon:   React.ElementType
  roles:  string[]
  muted?: boolean
}

interface NavSection {
  label: string
  items: NavItem[]
}

interface SidebarProps {
  userName:       string
  userEmail:      string
  userRol:        string
  userArea:       string | null
  isVacApprover?: boolean
  collapsed:      boolean
  onToggle:       () => void
}

// ── Nav item definitions ───────────────────────────────────────────────────────

const allNavItems: NavItem[] = [
  { href: '/dashboard',             label: 'Dashboard',         icon: LayoutDashboard, roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
  { href: '/clientes',              label: 'Clientes',          icon: Users,           roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
  { href: '/ensayos',               label: 'Ensayos',           icon: FlaskConical,    roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
  { href: '/cotizaciones',          label: 'Cotizaciones',      icon: FileText,        roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
  { href: '/cotizaciones/papelera', label: 'Papelera',          icon: Trash2,          roles: ['ADMINISTRACION', 'DIRECTOR_CALIDAD'], muted: true },
  { href: '/set',                   label: 'SET',               icon: ClipboardList,   roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
  { href: '/oda',                   label: 'ODA',               icon: TestTube,        roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION', 'ANALISTA'] },
  { href: '/informes',              label: 'Informes',          icon: FileCheck,       roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION', 'ANALISTA'] },
  { href: '/cargos',                label: 'Cargos de Entrega', icon: Package,         roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
  { href: '/ingresos',              label: 'Ingresos',          icon: TrendingUp,      roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
  { href: '/resumen',               label: 'Resumen',           icon: TableProperties, roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION'] },
  { href: '/solicitudes',           label: 'Mis Solicitudes',   icon: ShoppingBag,     roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION', 'ANALISTA'] },
  { href: '/vacaciones',           label: 'Mis Vacaciones',    icon: CalendarDays,    roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION', 'ANALISTA', 'COORDINADOR_CALIDAD', 'JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'] },
  { href: '/caja-chica',           label: 'Caja Chica',        icon: Wallet,   roles: ['DIRECTOR_CALIDAD'] },
  { href: '/gerencia/accesos',     label: 'Control de Accesos', icon: Shield,   roles: ['GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION'] },
  { href: '/rrhh',                 label: 'RRHH',               icon: Users2,   roles: ['ADMINISTRACION', 'DIRECTOR_ADMINISTRACION'] },
  { href: '/documentos', label: 'Documentos Calidad', icon: BookOpen, roles: ['GERENTE_TECNICO', 'ANALISTA', 'ADMINISTRACION', 'DIRECTOR_ADMINISTRACION'] },
  { href: '/gerencia/dashboard',    label: 'Dashboard Gerencial', icon: Goal,        roles: ['GERENTE_TECNICO'] },
  { href: '/gerencia/pei',          label: 'Plan Estratégico',    icon: Target,      roles: ['GERENTE_TECNICO'] },
  { href: '/gerencia/poa',          label: 'Plan Operativo',      icon: ClipboardList, roles: ['GERENTE_TECNICO'] },
  { href: '/gerencia/indicadores',  label: 'Indicadores (KPIs)',  icon: Gauge,       roles: ['GERENTE_TECNICO'] },
  { href: '/gerencia/riesgos',      label: 'Riesgos',             icon: ShieldAlert, roles: ['GERENTE_TECNICO'] },
  { href: '/gerencia/proyectos',    label: 'Proyectos',           icon: Rocket,      roles: ['GERENTE_TECNICO'] },
  { href: '/gerencia/mejoras',      label: 'Acciones de Mejora',  icon: Wrench,      roles: ['GERENTE_TECNICO'] },
  { href: '/gerencia/contabilidad',                label: 'Panel Financiero',   icon: Landmark,    roles: ['GERENTE_TECNICO'] },
  { href: '/gerencia/departamentos',               label: 'Panel Departamentos', icon: BarChart2,  roles: ['GERENTE_TECNICO'] },
  { href: '/gerencia/contabilidad/presupuesto',    label: 'Presupuesto',        icon: Wallet,      roles: ['GERENTE_TECNICO'] },
  { href: '/gerencia/contabilidad/flujo-caja',     label: 'Flujo de Caja',      icon: TrendingUp,  roles: ['GERENTE_TECNICO'] },
  { href: '/gerencia/contabilidad/egresos',        label: 'Egresos (Logística)', icon: Receipt,    roles: ['GERENTE_TECNICO'] },
  { href: '/gerencia/contabilidad/centros-costo',  label: 'Centros de Costo',   icon: Building2,   roles: ['GERENTE_TECNICO'] },
  { href: '/gerencia/contabilidad/rentabilidad',   label: 'Rentabilidad',       icon: DollarSign,  roles: ['GERENTE_TECNICO'] },
  { href: '/gerencia/contabilidad/documentos',     label: 'Docs Financieros',   icon: FileText,    roles: ['GERENTE_TECNICO'] },
  { href: '/gerencia/ayuda',                       label: 'Guía / Ayuda',       icon: BookOpen,    roles: ['GERENTE_TECNICO'] },
]

const operacionesNavItems: NavItem[] = [
  { href: '/operaciones',                        label: 'Panel Operaciones', icon: LayoutDashboard, roles: ['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA', 'DIRECTOR_CALIDAD'] },
  { href: '/operaciones/requerimientos',          label: 'Requerimientos',    icon: ClipboardList,   roles: ['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'] },
  { href: '/operaciones/proveedores',             label: 'Proveedores',       icon: Building2,       roles: ['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'] },
  { href: '/operaciones/cotizaciones-proveedor',  label: 'Cotiz. Proveedor',  icon: FileText,        roles: ['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA', 'DIRECTOR_CALIDAD'] },
  { href: '/operaciones/ordenes-compra',          label: 'Órdenes de Compra', icon: ShoppingCart,    roles: ['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA', 'DIRECTOR_CALIDAD'] },
  { href: '/operaciones/recepciones',             label: 'Recepciones',       icon: PackageCheck,    roles: ['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'] },
  { href: '/operaciones/devoluciones',            label: 'Devoluciones',      icon: RotateCcw,       roles: ['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'] },
  { href: '/operaciones/facturas',                label: 'Facturas',          icon: Receipt,         roles: ['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA', 'DIRECTOR_CALIDAD'] },
  { href: '/operaciones/pagos',                   label: 'Gestión de Pagos',  icon: CreditCard,      roles: ['DIRECTOR_CALIDAD'] },
  { href: '/operaciones/inventario',              label: 'Inventario',        icon: Microscope,      roles: ['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'] },
  { href: '/operaciones/historial',               label: 'Historial OC',      icon: History,         roles: ['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'] },
  { href: '/documentos', label: 'Documentos Calidad', icon: BookOpen, roles: ['JEFE_OPERACIONES', 'ASISTENTE_LOGISTICA'] },
]

// ── Sections for ADMINISTRACION ───────────────────────────────────────────────

const sectionesAdministracion: NavSection[] = [
  {
    label: 'Calidad',
    items: [
      { href: '/ensayos',   label: 'Ensayos',    icon: FlaskConical,  roles: ['ADMINISTRACION'] },
      { href: '/set',       label: 'SET',         icon: ClipboardList, roles: ['ADMINISTRACION'] },
      { href: '/oda',       label: 'ODA',         icon: TestTube,      roles: ['ADMINISTRACION'] },
      { href: '/informes',  label: 'Informes',    icon: FileCheck,     roles: ['ADMINISTRACION'] },
      { href: '/cargos',    label: 'Cargos',      icon: Package,       roles: ['ADMINISTRACION'] },
      { href: '/documentos', label: 'Documentos', icon: BookOpen,      roles: ['ADMINISTRACION'] },
    ],
  },
  {
    label: 'Administración',
    items: [
      { href: '/dashboard',             label: 'Dashboard',    icon: LayoutDashboard, roles: ['ADMINISTRACION'] },
      { href: '/clientes',              label: 'Clientes',     icon: Users,           roles: ['ADMINISTRACION'] },
      { href: '/cotizaciones',          label: 'Cotizaciones', icon: FileText,        roles: ['ADMINISTRACION'] },
      { href: '/cotizaciones/papelera', label: 'Papelera',     icon: Trash2,          roles: ['ADMINISTRACION'], muted: true },
      { href: '/ingresos',  label: 'Ingresos',             icon: TrendingUp,      roles: ['ADMINISTRACION'] },
      { href: '/resumen',   label: 'Resumen',              icon: TableProperties, roles: ['ADMINISTRACION'] },
      { href: '/finanzas',     label: 'Dashboard Financiero', icon: DollarSign,   roles: ['ADMINISTRACION'] },
      { href: '/facturacion',  label: 'Facturación',          icon: Landmark,     roles: ['ADMINISTRACION'] },
      { href: '/historial',    label: 'Historial',            icon: History,      roles: ['ADMINISTRACION'], muted: true },
      { href: '/solicitudes',  label: 'Mis Solicitudes',      icon: ShoppingBag,  roles: ['ADMINISTRACION'] },
      { href: '/vacaciones',   label: 'Mis Vacaciones',       icon: CalendarDays, roles: ['ADMINISTRACION'] },
      { href: '/administracion/sugerencias', label: 'Sugerencias', icon: MessageSquare, roles: ['ADMINISTRACION'] },
    ],
  },
  {
    label: 'RRHH',
    items: [
      { href: '/rrhh',             label: 'Resumen RRHH',  icon: Users2,        roles: ['ADMINISTRACION'] },
      { href: '/rrhh/personal',    label: 'Personal',      icon: Users,         roles: ['ADMINISTRACION'] },
      { href: '/rrhh/vacaciones',  label: 'Vacaciones',    icon: PalmtreeIcon,  roles: ['ADMINISTRACION'] },
      { href: '/rrhh/contratos',   label: 'Contratos',     icon: ClipboardList, roles: ['ADMINISTRACION'] },
      { href: '/rrhh/estructura',  label: 'Estructura',    icon: Building2,     roles: ['ADMINISTRACION'] },
    ],
  },
]

// ── Sections for COORDINADOR_CALIDAD ─────────────────────────────────────────
// Acceso a módulos de laboratorio + admin básico. Sin RRHH, sin Historial,
// sin KPIs, sin Control de Accesos, sin Caja Chica.

const sectionesCoordinadorCalidad: NavSection[] = [
  {
    label: 'Calidad',
    items: [
      { href: '/ensayos',              label: 'Ensayos',       icon: FlaskConical,   roles: ['COORDINADOR_CALIDAD'] },
      { href: '/set',                  label: 'SET',           icon: ClipboardList,  roles: ['COORDINADOR_CALIDAD'] },
      { href: '/oda',                  label: 'ODA',           icon: TestTube,       roles: ['COORDINADOR_CALIDAD'] },
      { href: '/informes',             label: 'Informes',      icon: FileCheck,      roles: ['COORDINADOR_CALIDAD'] },
      { href: '/cargos',               label: 'Cargos',        icon: Package,        roles: ['COORDINADOR_CALIDAD'] },
      { href: '/documentos-personal',  label: 'Docs Personal',   icon: FolderOpen,     roles: ['COORDINADOR_CALIDAD'] },
      { href: '/auditorias',           label: 'Auditorías',      icon: ClipboardCheck, roles: ['COORDINADOR_CALIDAD'] },
      { href: '/calidad/formatos',        label: 'Formatos',          icon: FileStack,   roles: ['COORDINADOR_CALIDAD'] },
      { href: '/calidad/procedimientos', label: 'Procedimientos',    icon: BookOpen,    roles: ['COORDINADOR_CALIDAD'] },
      { href: '/calidad/instructivos',   label: 'Instructivos',      icon: ListChecks,  roles: ['COORDINADOR_CALIDAD'] },
      { href: '/calidad/aseguramiento',  label: 'Aseguramiento',     icon: ShieldCheck, roles: ['COORDINADOR_CALIDAD'] },
    ],
  },
  {
    label: 'Administración',
    items: [
      { href: '/dashboard',             label: 'Dashboard',            icon: LayoutDashboard, roles: ['COORDINADOR_CALIDAD'] },
      { href: '/clientes',              label: 'Clientes',             icon: Users,           roles: ['COORDINADOR_CALIDAD'] },
      { href: '/cotizaciones',          label: 'Cotizaciones',         icon: FileText,        roles: ['COORDINADOR_CALIDAD'] },
      { href: '/cotizaciones/papelera', label: 'Papelera',             icon: Trash2,          roles: ['COORDINADOR_CALIDAD'], muted: true },
      { href: '/ingresos',              label: 'Ingresos',             icon: TrendingUp,      roles: ['COORDINADOR_CALIDAD'] },
      { href: '/resumen',               label: 'Resumen',              icon: TableProperties, roles: ['COORDINADOR_CALIDAD'] },
      { href: '/finanzas',     label: 'Dashboard Financiero', icon: DollarSign, roles: ['COORDINADOR_CALIDAD'] },
      { href: '/facturacion',  label: 'Facturación',          icon: Landmark,   roles: ['COORDINADOR_CALIDAD'] },
      { href: '/administracion/sugerencias', label: 'Sugerencias', icon: MessageSquare, roles: ['COORDINADOR_CALIDAD'] },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { href: '/operaciones',                        label: 'Panel Operaciones', icon: LayoutDashboard, roles: ['COORDINADOR_CALIDAD'] },
      { href: '/operaciones/cotizaciones-proveedor', label: 'Cotiz. Proveedor',  icon: FileText,        roles: ['COORDINADOR_CALIDAD'] },
      { href: '/operaciones/facturas',               label: 'Facturas',          icon: Receipt,         roles: ['COORDINADOR_CALIDAD'] },
      { href: '/operaciones/pagos',                  label: 'Gestión de Pagos',  icon: CreditCard,      roles: ['COORDINADOR_CALIDAD'] },
      { href: '/solicitudes',      label: 'Mis Solicitudes', icon: ShoppingBag,  roles: ['COORDINADOR_CALIDAD'] },
      { href: '/vacaciones',       label: 'Mis Vacaciones',  icon: CalendarDays, roles: ['COORDINADOR_CALIDAD'] },
    ],
  },
]

// ── Sections for DIRECTOR_ADMINISTRACION ─────────────────────────────────────

const sectionesDirectorAdmin: NavSection[] = [
  {
    label: 'Calidad',
    items: [
      { href: '/ensayos',   label: 'Ensayos',    icon: FlaskConical,  roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/set',       label: 'SET',         icon: ClipboardList, roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/oda',       label: 'ODA',         icon: TestTube,      roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/informes',  label: 'Informes',    icon: FileCheck,     roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/cargos',    label: 'Cargos',      icon: Package,       roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/documentos', label: 'Documentos', icon: BookOpen,      roles: ['DIRECTOR_ADMINISTRACION'] },
    ],
  },
  {
    label: 'Administración',
    items: [
      { href: '/dashboard',             label: 'Dashboard',    icon: LayoutDashboard, roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/clientes',              label: 'Clientes',     icon: Users,           roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/cotizaciones',          label: 'Cotizaciones', icon: FileText,        roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/cotizaciones/papelera', label: 'Papelera',     icon: Trash2,          roles: ['DIRECTOR_ADMINISTRACION'], muted: true },
      { href: '/ingresos',  label: 'Ingresos',             icon: TrendingUp,      roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/resumen',   label: 'Resumen',              icon: TableProperties, roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/finanzas',    label: 'Dashboard Financiero', icon: DollarSign,  roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/facturacion', label: 'Facturación',          icon: Landmark,    roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/historial',   label: 'Historial',            icon: History,     roles: ['DIRECTOR_ADMINISTRACION'], muted: true },
      { href: '/solicitudes', label: 'Mis Solicitudes',      icon: ShoppingBag, roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/administracion/sugerencias', label: 'Sugerencias', icon: MessageSquare, roles: ['DIRECTOR_ADMINISTRACION'] },
    ],
  },
  {
    label: 'RRHH',
    items: [
      { href: '/rrhh',             label: 'Resumen RRHH',  icon: Users2,        roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/rrhh/personal',    label: 'Personal',      icon: Users,         roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/rrhh/vacaciones',  label: 'Vacaciones',    icon: PalmtreeIcon,  roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/rrhh/contratos',   label: 'Contratos',     icon: ClipboardList, roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/rrhh/estructura',  label: 'Estructura',    icon: Building2,     roles: ['DIRECTOR_ADMINISTRACION'] },
    ],
  },
  {
    label: 'Gerencia',
    items: [
      { href: '/gerencia/accesos',      label: 'Control de Accesos',     icon: Shield,    roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/caja-chica',            label: 'Gastos Caja Chica',       icon: Wallet,    roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/caja-chica/peticiones', label: 'Peticiones de Efectivo',  icon: Banknote,  roles: ['DIRECTOR_ADMINISTRACION'] },
    ],
  },
  {
    label: 'Planeamiento Estratégico',
    items: [
      { href: '/gerencia/dashboard',   label: 'Dashboard Gerencial', icon: Goal,          roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/gerencia/pei',         label: 'Plan Estratégico',    icon: Target,        roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/gerencia/poa',         label: 'Plan Operativo',      icon: ClipboardList, roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/gerencia/indicadores', label: 'Indicadores (KPIs)',  icon: Gauge,         roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/gerencia/riesgos',     label: 'Riesgos',             icon: ShieldAlert,   roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/gerencia/proyectos',   label: 'Proyectos',           icon: Rocket,        roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/gerencia/mejoras',     label: 'Acciones de Mejora',  icon: Wrench,        roles: ['DIRECTOR_ADMINISTRACION'] },
    ],
  },
  {
    label: 'Contabilidad y Finanzas',
    items: [
      { href: '/gerencia/contabilidad',                label: 'Panel Financiero',  icon: Landmark,   roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/gerencia/departamentos',               label: 'Panel Departamentos', icon: BarChart2, roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/gerencia/contabilidad/presupuesto',    label: 'Presupuesto',       icon: Wallet,     roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/gerencia/contabilidad/flujo-caja',     label: 'Flujo de Caja',     icon: TrendingUp, roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/gerencia/contabilidad/egresos',        label: 'Egresos (Logística)', icon: Receipt,  roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/gerencia/contabilidad/centros-costo',  label: 'Centros de Costo',  icon: Building2,  roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/gerencia/contabilidad/rentabilidad',   label: 'Rentabilidad',      icon: DollarSign, roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/gerencia/contabilidad/documentos',     label: 'Documentos',        icon: FileText,   roles: ['DIRECTOR_ADMINISTRACION'] },
      { href: '/gerencia/ayuda',                       label: 'Guía / Ayuda',      icon: BookOpen,   roles: ['DIRECTOR_ADMINISTRACION'] },
    ],
  },
]

// ── Sections for DIRECTOR_CALIDAD ─────────────────────────────────────────────

const sectionesDirectorCalidad: NavSection[] = [
  {
    label: 'Calidad',
    items: [
      { href: '/ensayos',    label: 'Ensayos',    icon: FlaskConical,  roles: ['DIRECTOR_CALIDAD'] },
      { href: '/set',        label: 'SET',         icon: ClipboardList, roles: ['DIRECTOR_CALIDAD'] },
      { href: '/oda',        label: 'ODA',         icon: TestTube,      roles: ['DIRECTOR_CALIDAD'] },
      { href: '/informes',   label: 'Informes',    icon: FileCheck,     roles: ['DIRECTOR_CALIDAD'] },
      { href: '/equipos',             label: 'Equipos',            icon: Wrench,          roles: ['DIRECTOR_CALIDAD'] },
      { href: '/equipos/calendario',  label: 'Cal. Mantenimiento', icon: Calendar,        roles: ['DIRECTOR_CALIDAD'], muted: true },
      { href: '/documentos-personal',    label: 'Docs Personal',      icon: FolderOpen,     roles: ['DIRECTOR_CALIDAD'] },
      { href: '/auditorias',             label: 'Auditorías',         icon: ClipboardCheck, roles: ['DIRECTOR_CALIDAD'] },
      { href: '/calidad/formatos',        label: 'Formatos',           icon: FileStack,      roles: ['DIRECTOR_CALIDAD'] },
      { href: '/calidad/procedimientos', label: 'Procedimientos',     icon: BookOpen,       roles: ['DIRECTOR_CALIDAD'] },
      { href: '/calidad/instructivos',   label: 'Instructivos',       icon: ListChecks,     roles: ['DIRECTOR_CALIDAD'] },
      { href: '/calidad/aseguramiento',  label: 'Aseguramiento',      icon: ShieldCheck,    roles: ['DIRECTOR_CALIDAD'] },
      { href: '/caja-chica',            label: 'Caja Chica',          icon: Wallet,    roles: ['DIRECTOR_CALIDAD'] },
      { href: '/caja-chica/peticiones', label: 'Petición de Efectivo', icon: Banknote,  roles: ['DIRECTOR_CALIDAD'], muted: true },
    ],
  },
  {
    label: 'Administración',
    items: [
      { href: '/dashboard',             label: 'Dashboard',         icon: LayoutDashboard, roles: ['DIRECTOR_CALIDAD'] },
      { href: '/clientes',              label: 'Clientes',          icon: Users,           roles: ['DIRECTOR_CALIDAD'] },
      { href: '/cotizaciones',          label: 'Cotizaciones',      icon: FileText,        roles: ['DIRECTOR_CALIDAD'] },
      { href: '/cotizaciones/papelera', label: 'Papelera',          icon: Trash2,          roles: ['DIRECTOR_CALIDAD'], muted: true },
      { href: '/cargos',                label: 'Cargos de Entrega', icon: Package,         roles: ['DIRECTOR_CALIDAD'] },
      { href: '/ingresos',  label: 'Ingresos',          icon: TrendingUp,    roles: ['DIRECTOR_CALIDAD'] },
      { href: '/resumen',   label: 'Resumen',           icon: TableProperties, roles: ['DIRECTOR_CALIDAD'] },
      { href: '/finanzas',    label: 'Dashboard Financiero', icon: DollarSign, roles: ['DIRECTOR_CALIDAD'] },
      { href: '/facturacion', label: 'Facturación',          icon: Landmark,   roles: ['DIRECTOR_CALIDAD'] },
      { href: '/kpis',        label: 'KPIs Equipo',          icon: BarChart2,  roles: ['DIRECTOR_CALIDAD'] },
      { href: '/administracion/sugerencias', label: 'Sugerencias', icon: MessageSquare, roles: ['DIRECTOR_CALIDAD'] },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { href: '/operaciones',                       label: 'Panel Operaciones', icon: LayoutDashboard, roles: ['DIRECTOR_CALIDAD'] },
      { href: '/operaciones/cotizaciones-proveedor', label: 'Cotiz. Proveedor',  icon: FileText,        roles: ['DIRECTOR_CALIDAD'] },
      { href: '/operaciones/ordenes-compra',        label: 'Órdenes de Compra', icon: ShoppingCart,    roles: ['DIRECTOR_CALIDAD'] },
      { href: '/operaciones/facturas',              label: 'Facturas',          icon: Receipt,         roles: ['DIRECTOR_CALIDAD'] },
      { href: '/operaciones/pagos',                 label: 'Gestión de Pagos',  icon: CreditCard,      roles: ['DIRECTOR_CALIDAD'] },
      { href: '/solicitudes',      label: 'Mis Solicitudes',    icon: ShoppingBag,  roles: ['DIRECTOR_CALIDAD'] },
      { href: '/vacaciones',       label: 'Mis Vacaciones',     icon: CalendarDays, roles: ['DIRECTOR_CALIDAD'] },
      { href: '/historial',        label: 'Historial',          icon: History,      roles: ['DIRECTOR_CALIDAD'], muted: true },
      { href: '/gerencia/accesos', label: 'Control de Accesos', icon: Shield,      roles: ['DIRECTOR_CALIDAD'] },
    ],
  },
  {
    label: 'Planeamiento Estratégico',
    items: [
      { href: '/gerencia/dashboard',   label: 'Dashboard Gerencial', icon: Goal,          roles: ['DIRECTOR_CALIDAD'] },
      { href: '/gerencia/pei',         label: 'Plan Estratégico',    icon: Target,        roles: ['DIRECTOR_CALIDAD'] },
      { href: '/gerencia/poa',         label: 'Plan Operativo',      icon: ClipboardList, roles: ['DIRECTOR_CALIDAD'] },
      { href: '/gerencia/indicadores', label: 'Indicadores (KPIs)',  icon: Gauge,         roles: ['DIRECTOR_CALIDAD'] },
      { href: '/gerencia/riesgos',     label: 'Riesgos',             icon: ShieldAlert,   roles: ['DIRECTOR_CALIDAD'] },
      { href: '/gerencia/proyectos',   label: 'Proyectos',           icon: Rocket,        roles: ['DIRECTOR_CALIDAD'] },
      { href: '/gerencia/mejoras',     label: 'Acciones de Mejora',  icon: Wrench,        roles: ['DIRECTOR_CALIDAD'] },
    ],
  },
  {
    label: 'Contabilidad y Finanzas',
    items: [
      { href: '/gerencia/contabilidad',                label: 'Panel Financiero',  icon: Landmark,   roles: ['DIRECTOR_CALIDAD'] },
      { href: '/gerencia/departamentos',               label: 'Panel Departamentos', icon: BarChart2, roles: ['DIRECTOR_CALIDAD'] },
      { href: '/gerencia/contabilidad/presupuesto',    label: 'Presupuesto',       icon: Wallet,     roles: ['DIRECTOR_CALIDAD'] },
      { href: '/gerencia/contabilidad/flujo-caja',     label: 'Flujo de Caja',     icon: TrendingUp, roles: ['DIRECTOR_CALIDAD'] },
      { href: '/gerencia/contabilidad/egresos',        label: 'Egresos (Logística)', icon: Receipt,  roles: ['DIRECTOR_CALIDAD'] },
      { href: '/gerencia/contabilidad/centros-costo',  label: 'Centros de Costo',  icon: Building2,  roles: ['DIRECTOR_CALIDAD'] },
      { href: '/gerencia/contabilidad/rentabilidad',   label: 'Rentabilidad',      icon: DollarSign, roles: ['DIRECTOR_CALIDAD'] },
      { href: '/gerencia/contabilidad/documentos',     label: 'Documentos',        icon: FileText,   roles: ['DIRECTOR_CALIDAD'] },
      { href: '/gerencia/ayuda',                       label: 'Guía / Ayuda',      icon: BookOpen,   roles: ['DIRECTOR_CALIDAD'] },
    ],
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function Sidebar({ userName, userEmail, userRol, userArea, isVacApprover, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  // Build flat navItems for non-DC roles
  let navItems: NavItem[] = []
  let sections: NavSection[] | null = null

  if (userRol === 'DIRECTOR_CALIDAD') {
    sections = sectionesDirectorCalidad
  } else if (userRol === 'DIRECTOR_ADMINISTRACION') {
    sections = sectionesDirectorAdmin
  } else if (userRol === 'ADMINISTRACION') {
    sections = sectionesAdministracion
  } else if (userRol === 'COORDINADOR_CALIDAD') {
    sections = sectionesCoordinadorCalidad
  } else if (userRol === 'SUPER_ADMIN') {
    navItems = [...allNavItems, ...operacionesNavItems]
  } else if (userRol === 'JEFE_OPERACIONES' || userRol === 'ASISTENTE_LOGISTICA') {
    navItems = operacionesNavItems.filter(item => item.roles.includes(userRol))
  } else if (userRol === 'GERENTE_GENERAL') {
    // Gerente General: mismo menú que GERENTE_TECNICO
    navItems = allNavItems.filter(item => item.roles.includes('GERENTE_TECNICO'))
  } else {
    navItems = allNavItems.filter(item => item.roles.includes(userRol))
  }

  // Aprobador de vacaciones que no es HR: inyectar acceso a la bandeja
  // de aprobación. Si ya está visible por su rol (HR), no duplicamos.
  if (isVacApprover) {
    const aprobItem: NavItem = {
      href:  '/rrhh/vacaciones',
      label: 'Aprobar Vacaciones',
      icon:  PalmtreeIcon,
      roles: [userRol],
    }
    const alreadyHas = (sections ?? [{ items: navItems } as NavSection])
      .some(s => s.items.some(i => i.href === '/rrhh/vacaciones'))
    if (!alreadyHas) {
      if (sections) {
        sections = [...sections, { label: 'Mi equipo', items: [aprobItem] }]
      } else {
        navItems = [...navItems, aprobItem]
      }
    }
  }

  // All items in a flat list (for active-state logic)
  const allVisible: NavItem[] = sections
    ? sections.flatMap(s => s.items)
    : navItems

  function isActive(href: string) {
    return (
      (pathname === href || pathname.startsWith(href + '/')) &&
      !allVisible.some(
        other =>
          other.href !== href &&
          (pathname === other.href || pathname.startsWith(other.href + '/')) &&
          other.href.startsWith(href + '/')
      )
    )
  }

  function renderItem(item: NavItem) {
    const Icon  = item.icon
    const muted = !!item.muted
    const active = isActive(item.href)

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
          padding:         collapsed ? '10px 0' : muted ? '6px 12px 6px 24px' : '10px 12px',
          justifyContent:  collapsed ? 'center' : 'flex-start',
          backgroundColor: active ? 'rgba(74,195,178,0.20)' : 'transparent',
          borderLeft:      active && !collapsed ? '3px solid #4AC3B2' : '3px solid transparent',
          borderRadius:    '0.5rem',
          transition:      'all 0.15s ease',
          position:        'relative',
          backdropFilter:  active ? 'blur(4px)' : 'none',
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
        {active && !collapsed && (
          <ChevronRight className="ml-auto h-3 w-3 flex-shrink-0" style={{ color: '#4AC3B2' }} />
        )}
        {active && collapsed && (
          <span
            className="absolute right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: '#4AC3B2' }}
          />
        )}
      </Link>
    )
  }

  function renderSectionLabel(label: string) {
    return (
      <div
        className="overflow-hidden whitespace-nowrap"
        style={{
          maxHeight:  collapsed ? '0px' : '28px',
          opacity:    collapsed ? 0 : 1,
          transition: 'max-height 0.3s ease, opacity 0.2s ease',
        }}
      >
        <p
          className="px-3 pb-1.5 pt-2 text-[10px] font-semibold tracking-widest uppercase"
          style={{ color: 'rgba(74,195,178,0.7)' }}
        >
          {label}
        </p>
      </div>
    )
  }

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 flex flex-col overflow-hidden"
      onClick={collapsed ? onToggle : undefined}
      style={{
        background: 'linear-gradient(175deg, #0e4a22 0%, #13602C 40%, #0f5226 100%)',
        width:      collapsed ? '64px' : '256px',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor:     collapsed ? 'pointer' : 'default',
        boxShadow:  '4px 0 24px oklch(0 0 0 / 0.18)',
      }}
    >
      {/* ── Logo / Header ── */}
      <div
        className="flex items-center py-5 flex-shrink-0"
        style={{
          borderBottom:   '1px solid rgba(255,255,255,0.12)',
          padding:        collapsed ? '20px 0' : '20px',
          justifyContent: collapsed ? 'center' : 'space-between',
          transition:     'padding 0.3s ease',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/cetox-logo.svg"
            alt="CETOX"
            className="flex-shrink-0"
            style={{ width: 36, height: 36 }}
          />
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
        {sections ? (
          /* ── Sectioned view (DIRECTOR_CALIDAD) ── */
          sections.map((section, i) => (
            <div key={section.label} className={i > 0 ? 'mt-1' : ''}>
              {/* Separator between sections when collapsed */}
              {i > 0 && collapsed && (
                <div style={{
                  height: 1,
                  backgroundColor: 'rgba(255,255,255,0.10)',
                  margin: '8px 6px',
                }} />
              )}
              {/* Section label (hidden when collapsed) */}
              {renderSectionLabel(section.label)}
              {/* Items */}
              <div className="space-y-0.5">
                {section.items.map(item => renderItem(item))}
              </div>
            </div>
          ))
        ) : (
          /* ── Flat view (other roles) ── */
          <>
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
              {navItems.map(item => renderItem(item))}
            </div>
          </>
        )}
      </nav>

      {/* ── Footer usuario ── */}
      <div
        className="flex-shrink-0"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.12)',
          padding:   collapsed ? '12px 8px' : '16px',
        }}
      >
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

        <div
          className="flex items-center mb-3"
          style={{ gap: collapsed ? 0 : 12, justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          <div
            className="flex items-center justify-center rounded-full font-bold flex-shrink-0"
            style={{
              backgroundColor: '#4AC3B2',
              color:           '#13602C',
              fontFamily:      'var(--font-oswald)',
              width:  collapsed ? 36 : 32,
              height: collapsed ? 36 : 32,
              fontSize: 12,
              letterSpacing: '0.03em',
              transition: 'width 0.3s ease, height 0.3s ease',
            }}
          >
            {getInitials(userName)}
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
