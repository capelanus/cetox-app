// Counters de laboratorio: un mostrador por área donde Administración deja la
// muestra y el laboratorio la recepciona. Un solo rol COUNTER para las tablets;
// el área de la cuenta dice de qué mostrador es.

export const LABS = {
  quimica:       { slug: 'quimica',       area: 'Q', nombre: 'Química' },
  biologia:      { slug: 'biologia',      area: 'B', nombre: 'Biología' },
  microbiologia: { slug: 'microbiologia', area: 'M', nombre: 'Microbiología' },
} as const

export type LabSlug = keyof typeof LABS
export type Lab = (typeof LABS)[LabSlug]
export const LAB_SLUGS = Object.keys(LABS) as LabSlug[]
export const LAB_LIST: Lab[] = LAB_SLUGS.map(s => LABS[s])

export function labPorSlug(slug: string | undefined | null): Lab | null {
  return slug && slug in LABS ? LABS[slug as LabSlug] : null
}

export function labPorArea(area: string | undefined | null): Lab | null {
  return LAB_LIST.find(l => l.area === area) ?? null
}

// Quién puede dejar una muestra en cualquier counter (firma con su PIN).
export const ROLES_ENTREGAN = ['ADMINISTRACION', 'DIRECTOR_CALIDAD', 'COORDINADOR_CALIDAD', 'SUPER_ADMIN']

// Quién administra cuentas de tablet y PIN del personal.
export const ROLES_ADMIN_COUNTERS = [
  'ADMINISTRACION', 'DIRECTOR_ADMINISTRACION', 'DIRECTOR_CALIDAD', 'GERENTE_TECNICO', 'GERENTE_GENERAL', 'SUPER_ADMIN',
]

// Quién puede abrir la pantalla de un counter (además de su cuenta de tablet).
export const ROLES_ABREN_COUNTER = [...ROLES_ENTREGAN, 'ANALISTA', 'GERENTE_TECNICO', 'GERENTE_GENERAL', 'DIRECTOR_ADMINISTRACION']
