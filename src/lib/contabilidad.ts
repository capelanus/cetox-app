// Helpers y constantes del módulo de Contabilidad y Finanzas.
// Funciones puras usables en server y client.

export { MESES } from './planeamiento'

export const CATEGORIAS_INGRESO = [
  'Servicios de laboratorio',
  'Consultorías',
  'Capacitaciones',
  'Otros ingresos',
]

export const CATEGORIAS_EGRESO = [
  'Personal / Planilla',
  'Reactivos e insumos',
  'Equipos y mantenimiento',
  'Servicios básicos (luz/agua/internet)',
  'Alquiler',
  'Marketing y ventas',
  'Gastos administrativos',
  'Impuestos y tributos',
  'Movilidad y viáticos',
  'Otros egresos',
]

export const CATEGORIAS_DOCUMENTO = [
  'Estado de cuenta',
  'Comprobante',
  'Reporte financiero',
  'Conciliación bancaria',
  'Declaración / SUNAT',
  'Presupuesto',
  'Otro',
]

export const TIPO_PARTIDA_LABEL: Record<string, string> = {
  INGRESO: 'Ingreso',
  EGRESO:  'Egreso',
}

// Formato de moneda peruana
export function soles(n: number): string {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(n)
}

export function solesCompact(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `S/ ${(n / 1_000).toFixed(1)}k`
  return `S/ ${n.toFixed(0)}`
}

// % de ejecución presupuestal
export function pctEjecucion(planificado: number, ejecutado: number): number | null {
  if (planificado === 0) return ejecutado > 0 ? 999 : null
  return Math.round((ejecutado / planificado) * 100)
}

// Color del % de ejecución. Para egresos, sobreejecutar (>100) es malo (rojo);
// para ingresos, superar la meta es bueno (verde).
export function colorEjecucion(pct: number | null, tipo: 'INGRESO' | 'EGRESO'): string {
  if (pct === null) return '#cbd5e1'
  if (tipo === 'EGRESO') {
    if (pct > 100) return '#ef4444'
    if (pct >= 85) return '#f59e0b'
    return '#10b981'
  }
  // INGRESO
  if (pct >= 100) return '#10b981'
  if (pct >= 80) return '#f59e0b'
  return '#ef4444'
}

// Margen de rentabilidad
export function margen(ingreso: number, costoDirecto: number, costoIndirecto: number): number {
  return ingreso - costoDirecto - costoIndirecto
}

export function margenPct(ingreso: number, costoDirecto: number, costoIndirecto: number): number | null {
  if (ingreso === 0) return null
  return Math.round((margen(ingreso, costoDirecto, costoIndirecto) / ingreso) * 100)
}

export function colorMargen(pct: number | null): string {
  if (pct === null) return '#cbd5e1'
  if (pct >= 25) return '#10b981'
  if (pct >= 10) return '#f59e0b'
  if (pct >= 0) return '#f97316'
  return '#ef4444'
}
