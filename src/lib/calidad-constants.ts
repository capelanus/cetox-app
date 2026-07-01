export const DEPARTAMENTOS = [
  { key: 'ADMINISTRACION', label: 'Administración' },
  { key: 'GERENCIA',       label: 'Gerencia' },
  { key: 'QUIMICA',        label: 'Química' },
  { key: 'BIOLOGIA',       label: 'Biología' },
  { key: 'MICROBIOLOGIA',  label: 'Microbiología' },
  { key: 'OPERACIONES',    label: 'Operaciones' },
] as const

export type Departamento = typeof DEPARTAMENTOS[number]['key']

/** Devuelve el departamento al que pertenece un usuario según su rol y área. */
export function getDepartamento(rol: string, area?: string | null): Departamento | null {
  switch (rol) {
    case 'ADMINISTRACION':          return 'ADMINISTRACION'
    case 'DIRECTOR_ADMINISTRACION': return 'GERENCIA'
    case 'GERENTE_TECNICO':         return 'GERENCIA'
    case 'GERENTE_GENERAL':         return 'GERENCIA'
    case 'ANALISTA':
      if (area === 'Q') return 'QUIMICA'
      if (area === 'B') return 'BIOLOGIA'
      if (area === 'M') return 'MICROBIOLOGIA'
      return null
    case 'JEFE_OPERACIONES':        return 'OPERACIONES'
    case 'ASISTENTE_LOGISTICA':     return 'OPERACIONES'
    default:                        return null
  }
}
