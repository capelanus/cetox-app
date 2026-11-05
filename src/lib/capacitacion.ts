// Pruebas de la evaluación final de la capacitación en Claude. La clave de
// respuestas vive aquí (servidor) y no se confía en la nota que mande el
// navegador. Debe coincidir, en orden, con `duels`, `myths` y `sem` de
// contenido/capacitacion-claude/index.html. El orden de este objeto es el
// orden de las pruebas en la clase y en el ranking.
export const ACTIVIDADES = {
  duelo: { nombre: 'Duelo de pedidos', corto: 'Duelo', modulo: '5.2', clave: ['b', 'a', 'b', 'a'] },
  mitos: { nombre: '¿Mito o verdad?', corto: 'Mito o verdad', modulo: '5.3', clave: ['0', '0', '1', '1', '0', '1', '0'] },
  semaforo: { nombre: 'Semáforo de datos', corto: 'Semáforo', modulo: '5.4', clave: ['v', 'v', 'r', 'r', 'a', 'a', 'r', 'v'] },
} as const

export type Actividad = keyof typeof ACTIVIDADES
export const ORDEN_ACTIVIDADES = Object.keys(ACTIVIDADES) as Actividad[]

/** Nota del 0 al 20 con un decimal. */
export function notaSobre20(aciertos: number, total: number): number {
  return total ? Math.round((aciertos / total) * 200) / 10 : 0
}
