// Helpers y constantes del módulo de Planeamiento Estratégico y Control Gerencial.
// Funciones puras: usables tanto en server como en client components.

export const DEPARTAMENTOS: { key: string; label: string }[] = [
  { key: 'QUIMICA',        label: 'Química' },
  { key: 'BIOLOGIA',       label: 'Biología' },
  { key: 'MICROBIOLOGIA',  label: 'Microbiología' },
  { key: 'CALIDAD',        label: 'Calidad' },
  { key: 'ADMINISTRACION', label: 'Administración' },
  { key: 'OPERACIONES',    label: 'Operaciones' },
  { key: 'GERENCIA',       label: 'Gerencia' },
]

export const DEPTO_LABEL: Record<string, string> = Object.fromEntries(
  DEPARTAMENTOS.map(d => [d.key, d.label]),
)

export const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

// Estado semáforo genérico por porcentaje de cumplimiento (0-100+)
export type Semaforo = 'verde' | 'ambar' | 'rojo' | 'gris'

export const SEMAFORO_COLOR: Record<Semaforo, string> = {
  verde: '#10b981',
  ambar: '#f59e0b',
  rojo:  '#ef4444',
  gris:  '#cbd5e1',
}

export const SEMAFORO_LABEL: Record<Semaforo, string> = {
  verde: 'En meta',
  ambar: 'En riesgo',
  rojo:  'Crítico',
  gris:  'Sin datos',
}

export function semaforoDeCumplimiento(pct: number | null): Semaforo {
  if (pct === null || Number.isNaN(pct)) return 'gris'
  if (pct >= 90) return 'verde'
  if (pct >= 70) return 'ambar'
  return 'rojo'
}

// % de cumplimiento de un KPI dada su meta, valor real y sentido.
// ASCENDENTE: mayor es mejor → valor/meta. DESCENDENTE: menor es mejor → meta/valor.
export function cumplimientoKpi(
  valor: number | null,
  meta: number | null,
  sentido: string,
): number | null {
  if (valor === null || meta === null || meta === 0) {
    if (sentido === 'DESCENDENTE' && valor !== null && meta === 0) return valor === 0 ? 100 : 0
    return null
  }
  const pct = sentido === 'DESCENDENTE' ? (meta / valor) * 100 : (valor / meta) * 100
  return Math.max(0, Math.round(pct))
}

// % de avance de una actividad POA: sum(ejecutado) / metaAnual
export function avanceActividad(metaAnual: number, ejecutadoTotal: number): number | null {
  if (metaAnual <= 0) return null
  return Math.min(999, Math.round((ejecutadoTotal / metaAnual) * 100))
}

// ── Riesgos: matriz probabilidad × impacto (1-5) ──────────────────────────────

export type NivelRiesgo = 'bajo' | 'medio' | 'alto' | 'critico'

export function nivelRiesgo(probabilidad: number, impacto: number): NivelRiesgo {
  const score = probabilidad * impacto
  if (score >= 15) return 'critico'
  if (score >= 9)  return 'alto'
  if (score >= 4)  return 'medio'
  return 'bajo'
}

export const NIVEL_RIESGO_COLOR: Record<NivelRiesgo, string> = {
  bajo:    '#10b981',
  medio:   '#f59e0b',
  alto:    '#f97316',
  critico: '#ef4444',
}

export const NIVEL_RIESGO_LABEL: Record<NivelRiesgo, string> = {
  bajo: 'Bajo', medio: 'Medio', alto: 'Alto', critico: 'Crítico',
}

// Color de una celda de la matriz de calor (para el heatmap del dashboard/riesgos)
export function colorCeldaMatriz(probabilidad: number, impacto: number): string {
  return NIVEL_RIESGO_COLOR[nivelRiesgo(probabilidad, impacto)]
}

// ── Estados ───────────────────────────────────────────────────────────────────

export const ESTADO_RIESGO_LABEL: Record<string, string> = {
  IDENTIFICADO:  'Identificado',
  EN_TRATAMIENTO:'En tratamiento',
  MITIGADO:      'Mitigado',
  MATERIALIZADO: 'Materializado',
}

export const ESTADO_PROYECTO_LABEL: Record<string, string> = {
  PLANIFICADO: 'Planificado',
  EN_CURSO:    'En curso',
  EN_PAUSA:    'En pausa',
  COMPLETADO:  'Completado',
  CANCELADO:   'Cancelado',
}

export const ESTADO_PROYECTO_COLOR: Record<string, string> = {
  PLANIFICADO: '#64748b',
  EN_CURSO:    '#3b82f6',
  EN_PAUSA:    '#f59e0b',
  COMPLETADO:  '#10b981',
  CANCELADO:   '#94a3b8',
}

export const ESTADO_ACTIVIDAD_LABEL: Record<string, string> = {
  PLANIFICADO: 'Planificado',
  EN_CURSO:    'En curso',
  COMPLETADO:  'Completado',
  CANCELADO:   'Cancelado',
}

export const ESTADO_MEJORA_LABEL: Record<string, string> = {
  ABIERTA:    'Abierta',
  EN_PROCESO: 'En proceso',
  CERRADA:    'Cerrada',
}

// ── Tareas de proyecto (estilo Asana) ─────────────────────────────────────────

export const ESTADO_TAREA: { key: string; label: string; color: string }[] = [
  { key: 'POR_HACER',   label: 'Por hacer',   color: '#94a3b8' },
  { key: 'EN_CURSO',    label: 'En curso',    color: '#3b82f6' },
  { key: 'EN_REVISION', label: 'En revisión', color: '#f59e0b' },
  { key: 'HECHO',       label: 'Hecho',       color: '#10b981' },
]

export const ESTADO_TAREA_LABEL: Record<string, string> = Object.fromEntries(ESTADO_TAREA.map(e => [e.key, e.label]))
export const ESTADO_TAREA_COLOR: Record<string, string> = Object.fromEntries(ESTADO_TAREA.map(e => [e.key, e.color]))

export const PRIORIDAD_TAREA_LABEL: Record<string, string> = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta' }
export const PRIORIDAD_TAREA_COLOR: Record<string, string> = { BAJA: '#64748b', MEDIA: '#f59e0b', ALTA: '#ef4444' }

export function iniciales(nombre: string): string {
  return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

export const ESTADO_MEJORA_COLOR: Record<string, string> = {
  ABIERTA:    '#ef4444',
  EN_PROCESO: '#f59e0b',
  CERRADA:    '#10b981',
}

export const ORIGEN_MEJORA_LABEL: Record<string, string> = {
  AUDITORIA:          'Auditoría',
  RIESGO:             'Riesgo',
  SUGERENCIA:         'Sugerencia de cliente',
  NO_CONFORMIDAD:     'No conformidad',
  REVISION_DIRECCION: 'Revisión por dirección',
  OTRO:               'Otro',
}

export const CATEGORIA_RIESGO_LABEL: Record<string, string> = {
  ESTRATEGICO:  'Estratégico',
  OPERATIVO:    'Operativo',
  FINANCIERO:   'Financiero',
  CUMPLIMIENTO: 'Cumplimiento',
  TECNOLOGICO:  'Tecnológico',
}

// Detecta si una fecha (compromiso) está vencida respecto a "hoy"
export function estaVencida(fecha: Date | string | null, cerrada: boolean): boolean {
  if (!fecha || cerrada) return false
  return new Date(fecha).getTime() < Date.now()
}
