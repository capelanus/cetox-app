import { pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

export interface ItemExtraido {
  descripcion: string
  cantidad: number
  unidad: string
  precioUnitario: number
  // true cuando cantidad × precio cuadra con el importe de la línea, que es la
  // señal de que se interpretaron bien las columnas y no números sueltos.
  confiable: boolean
}

export interface TotalesExtraidos {
  subtotal?: number
  igv?: number
  percepcion?: number
  total?: number
}

export async function extraerTextoPdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: buffer }).promise
  const paginas: string[] = []

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const contenido = await page.getTextContent()
    // Se reconstruyen las filas agrupando por coordenada Y: getTextContent
    // devuelve fragmentos sueltos y sin esto las columnas se mezclan.
    const filas = new Map<number, { x: number; texto: string }[]>()
    for (const item of contenido.items) {
      if (!('str' in item) || !item.str.trim()) continue
      const y = Math.round(item.transform[5])
      const fila = filas.get(y) ?? []
      fila.push({ x: item.transform[4], texto: item.str })
      filas.set(y, fila)
    }
    const lineas = [...filas.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, fragmentos]) => fragmentos.sort((a, b) => a.x - b.x).map(f => f.texto).join(' ').replace(/\s+/g, ' ').trim())
    paginas.push(lineas.join('\n'))
  }

  return paginas.join('\n')
}

function aNumero(token: string): number | null {
  // Formato peruano: 1,234.56 — la coma es separador de miles.
  const limpio = token.replace(/,/g, '')
  if (!/^\d+(\.\d+)?$/.test(limpio)) return null
  return parseFloat(limpio)
}

const UNIDADES = /^(und|unid|unidad|unidades|pza|pzas|kg|g|gr|l|lt|ml|caja|cajas|paq|paquete|frasco|galon|gal|rollo|juego|par|set|serv|servicio)\.?$/i

export function extraerItems(texto: string): ItemExtraido[] {
  const items: ItemExtraido[] = []

  for (const lineaCruda of texto.split('\n')) {
    const linea = lineaCruda.trim()
    if (!linea || /^(sub\s*total|igv|i\.g\.v|total|percepci|descuento|op\.|son:)/i.test(linea)) continue

    const tokens = linea.split(/\s+/)
    const numerosFinales: number[] = []
    let corte = tokens.length
    while (corte > 0) {
      const n = aNumero(tokens[corte - 1])
      if (n === null) break
      numerosFinales.unshift(n)
      corte--
    }
    if (numerosFinales.length < 2) continue

    let descripcionTokens = tokens.slice(0, corte)
    // El índice de fila ("1", "2", ...) al inicio no es parte de la descripción.
    if (descripcionTokens.length > 1 && /^\d+$/.test(descripcionTokens[0])) descripcionTokens = descripcionTokens.slice(1)

    let unidad = 'Unidad'
    const posibleUnidad = descripcionTokens[descripcionTokens.length - 1]
    if (posibleUnidad && UNIDADES.test(posibleUnidad)) {
      unidad = posibleUnidad.replace(/\.$/, '')
      descripcionTokens = descripcionTokens.slice(0, -1)
    }

    const importe = numerosFinales[numerosFinales.length - 1]
    const precioUnitario = numerosFinales[numerosFinales.length - 2]

    // La cantidad puede venir junto al precio ("… 40 2.50 100.00") o quedar del
    // otro lado de la unidad ("… 40 UND 2.50 100.00"); en ese caso es el último
    // token de la descripción y hay que sacarla de ahí.
    let cantidad = numerosFinales.length >= 3 ? numerosFinales[numerosFinales.length - 3] : null
    if (cantidad === null) {
      const ultimo = descripcionTokens[descripcionTokens.length - 1]
      const n = ultimo ? aNumero(ultimo) : null
      if (n !== null) {
        cantidad = n
        descripcionTokens = descripcionTokens.slice(0, -1)
      }
    }
    if (cantidad === null) cantidad = 1

    const descripcion = descripcionTokens.join(' ').trim()
    if (descripcion.replace(/[^a-zA-ZÁ-ú]/g, '').length < 3) continue

    if (precioUnitario <= 0 || cantidad <= 0) continue

    const esperado = cantidad * precioUnitario
    const confiable = esperado > 0 && Math.abs(esperado - importe) / Math.max(esperado, importe) < 0.02

    items.push({ descripcion, cantidad, unidad, precioUnitario, confiable })
  }

  return items
}

// Se resuelve por línea y tomando el ÚLTIMO número de cada una: así "IGV (18%)
// 49.59" no devuelve 18, y "SUB TOTAL" no se confunde con "TOTAL" porque cada
// etiqueta se evalúa en su propio renglón y en orden de especificidad.
export function extraerTotales(texto: string): TotalesExtraidos {
  const resultado: TotalesExtraidos = {}

  for (const linea of texto.split('\n')) {
    const numeros = linea.split(/\s+/).map(aNumero).filter((n): n is number => n !== null)
    if (numeros.length === 0) continue
    const monto = numeros[numeros.length - 1]

    if (/sub\s*-?\s*total/i.test(linea)) resultado.subtotal = monto
    else if (/percepci[óo]n/i.test(linea)) resultado.percepcion = monto
    else if (/\bi\.?\s*g\.?\s*v\.?\b/i.test(linea)) resultado.igv = monto
    else if (/\btotal\b/i.test(linea)) resultado.total = monto
  }

  return resultado
}
