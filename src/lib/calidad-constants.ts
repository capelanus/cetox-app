export const DEPARTAMENTOS = [
  { key: 'ADMINISTRACION', label: 'Administración' },
  { key: 'LABORATORIO',    label: 'Laboratorio' },
  { key: 'OPERACIONES',    label: 'Operaciones' },
] as const

export type Departamento = typeof DEPARTAMENTOS[number]['key']
