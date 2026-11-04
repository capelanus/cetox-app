// Actividades puntuadas de la capacitación en Claude. La clave de respuestas
// vive aquí (servidor) y no se confía en la nota que mande el navegador.
// Debe coincidir, en orden, con `duels` (1.4) y `sem` (3.2) de
// contenido/capacitacion-claude/index.html.
export const ACTIVIDADES = {
  duelo: { nombre: 'Duelo de pedidos', modulo: '1.4', clave: ['b', 'a', 'b', 'a'] },
  semaforo: { nombre: 'Semáforo de datos', modulo: '3.2', clave: ['v', 'v', 'r', 'r', 'a', 'a', 'r', 'v'] },
} as const

export type Actividad = keyof typeof ACTIVIDADES

/** Nota del 0 al 20 con un decimal. */
export function notaSobre20(aciertos: number, total: number): number {
  return total ? Math.round((aciertos / total) * 200) / 10 : 0
}
