// Shared utilities for the equipment module — NOT a server action file

export type EstadoEquipo = 'VENCIDO' | 'PROXIMO' | 'PROGRAMADO' | 'AL_DIA'

export interface TareaConEstado {
  id:         string
  tipo:       string
  mes:        number
  anio:       number
  completado: boolean
  fechaReal:  Date | null
  nota:       string | null
  estado:     EstadoEquipo
}

export interface EquipoConEstado {
  id:             string
  codigo:         string
  nombre:         string
  area:           string | null
  categoria:      string
  activo:         boolean
  notas:          string | null
  ultimoServicio: Date | null
  tareas:         TareaConEstado[]
  estadoGeneral:  EstadoEquipo
  proximaTarea:   { mes: number; anio: number; tipo: string } | null
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic']

export function mesLabel(mes: number) {
  return MESES[mes - 1] ?? String(mes)
}

export function calcularEstado(mes: number, anio: number, completado: boolean): EstadoEquipo {
  if (completado) return 'AL_DIA'
  const hoy   = new Date()
  const ahora = hoy.getFullYear() * 12 + (hoy.getMonth() + 1)
  const tarea = anio * 12 + mes
  const diff  = tarea - ahora
  if (diff < 0)  return 'VENCIDO'
  if (diff <= 1) return 'PROXIMO'
  return 'PROGRAMADO'
}

export function estadoGeneral(tareas: { estado: EstadoEquipo }[]): EstadoEquipo {
  if (tareas.some(t => t.estado === 'VENCIDO'))    return 'VENCIDO'
  if (tareas.some(t => t.estado === 'PROXIMO'))    return 'PROXIMO'
  if (tareas.some(t => t.estado === 'PROGRAMADO')) return 'PROGRAMADO'
  return 'AL_DIA'
}
