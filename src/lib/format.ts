import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatFecha(date: Date | string | null | undefined): string {
  if (!date) return '—'
  try {
    return format(new Date(date), 'dd/MM/yyyy', { locale: es })
  } catch {
    return '—'
  }
}

export function formatFechaHora(date: Date | string | null | undefined): { fecha: string; hora: string } {
  if (!date) return { fecha: '—', hora: '' }
  try {
    const d = new Date(date)
    return {
      fecha: format(d, 'dd/MM/yyyy', { locale: es }),
      hora: format(d, 'HH:mm', { locale: es }),
    }
  } catch {
    return { fecha: '—', hora: '' }
  }
}

export function formatMoneda(amount: number, currency: 'USD' | 'PEN'): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatNumCotizacion(numero: number, anio: number, sufijo?: string): string {
  return `COT-${String(numero).padStart(4, '0')}${sufijo ?? ''}-${anio}`
}

export function formatNumSET(numero: number, anio: number): string {
  return `SET-${String(numero).padStart(4, '0')}-${anio}`
}

export function formatNumODA(numero: number, anio: number): string {
  return `${String(numero).padStart(5, '0')}-${anio}`
}

export function formatNumInforme(prefijo: string, numero: number, anio: number): string {
  return `${prefijo}-${numero}-${anio}`
}

export function formatNumRequerimiento(numero: number, anio: number): string {
  return `REQ-${String(numero).padStart(4, '0')}-${anio}`
}

export function formatNumCotizacionProveedor(numero: number, anio: number): string {
  return `COTP-${String(numero).padStart(4, '0')}-${anio}`
}

export function formatNumOrdenCompra(numero: number, anio: number): string {
  return `OC-${String(numero).padStart(4, '0')}-${anio}`
}

export function formatNumRecepcion(numero: number, anio: number): string {
  return `REC-${String(numero).padStart(4, '0')}-${anio}`
}

export function formatNumDevolucion(numero: number, anio: number): string {
  return `DEV-${String(numero).padStart(4, '0')}-${anio}`
}

export function formatNumPago(numero: number, anio: number): string {
  return `PAG-${String(numero).padStart(4, '0')}-${anio}`
}

export function formatNumFacturaCliente(serie: string, numero: number, anio: number): string {
  return `${serie}-${String(numero).padStart(5, '0')} / ${anio}`
}

/**
 * Suaviza solo los textos escritos TODO EN MAYÚSCULAS: los pasa a minúscula
 * con mayúscula inicial de oración (al inicio, tras ". " y tras ": "). No
 * corrige nada más: una línea que ya trae minúsculas se deja tal cual, para
 * no romper unidades ni nombres científicos (ufc/mL, E. coli, ATCC 6538).
 */
export function suavizarMayusculas(texto: string): string {
  return texto.split(/\r?\n/).map(linea => {
    const letras = linea.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '')
    if (letras.length < 2 || letras !== letras.toUpperCase()) return linea
    return linea.toLowerCase()
      .replace(/(^\s*[^\p{L}]*|[.:;!?]\s+[^\p{L}]*)(\p{L})/gu, (_m, pre: string, l: string) => pre + l.toUpperCase())
  }).join('\n')
}

/** Nombre propio en mayúsculas → Tipo Título (MUESTRA ANGIE → Muestra Angie). */
export function suavizarNombre(texto: string): string {
  const letras = texto.replace(/[^\p{L}]/gu, '')
  if (letras.length < 2 || letras !== letras.toUpperCase()) return texto
  return texto.toLowerCase().replace(/(^|[\s(/-])(\p{L})/gu, (_m, p: string, l: string) => p + l.toUpperCase())
}

/**
 * Fecha de fabricación/vencimiento de una muestra. Algunos clientes la dan
 * completa (dd/mm/aaaa) y otros solo mes y año ("agosto 2026"); en ese caso
 * se guarda el día 15 a mediodía UTC (ningún huso horario lo corre de mes) y
 * `soloMes` indica que se muestre sin día.
 */
export function formatFechaMuestra(date: Date | string | null | undefined, soloMes: boolean | null | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  // Siempre en UTC: la fecha se guardó sin hora real, y leerla en hora de
  // Lima la correría al día anterior.
  if (!soloMes) {
    const dd = String(d.getUTCDate()).padStart(2, '0'), mm = String(d.getUTCMonth() + 1).padStart(2, '0')
    return `${dd}/${mm}/${d.getUTCFullYear()}`
  }
  const mes = new Intl.DateTimeFormat('es-PE', { month: 'long', timeZone: 'UTC' }).format(d)
  return `${mes} ${d.getUTCFullYear()}`
}

/** Valor del formulario ("2026-08-14" o, con soloMes, "2026-08") → Date. */
export function parseFechaMuestra(valor: string | null | undefined, soloMes: boolean): Date | null {
  if (!valor) return null
  const m = valor.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/)
  if (!m) return null
  return new Date(Date.UTC(+m[1], +m[2] - 1, soloMes ? 15 : +(m[3] ?? 1), 12))
}
