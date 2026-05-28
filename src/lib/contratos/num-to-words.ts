// Convierte un número entero a texto en español mayúsculas
// Ej: 3500 → "TRES MIL QUINIENTOS"

const UNIDADES = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
  'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE']
const DECENAS = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
const CENTENAS = ['', 'CIEN', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
  'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']

function centenas(n: number): string {
  if (n === 0) return ''
  if (n === 100) return 'CIEN'
  const c = Math.floor(n / 100)
  const resto = n % 100
  let res = c > 0 ? CENTENAS[c] : ''
  if (resto > 0) res += (c > 0 ? ' ' : '') + decenas(resto)
  return res
}

function decenas(n: number): string {
  if (n < 20) return UNIDADES[n]
  const d = Math.floor(n / 10)
  const u = n % 10
  if (u === 0) return DECENAS[d]
  if (d === 2) return 'VEINTI' + UNIDADES[u].toLowerCase().replace('ú', 'u')
  return DECENAS[d] + ' Y ' + UNIDADES[u]
}

export function numeroATexto(n: number): string {
  const entero = Math.floor(n)
  if (entero === 0) return 'CERO'
  if (entero === 1000000) return 'UN MILLÓN'

  const miles = Math.floor(entero / 1000)
  const resto = entero % 1000

  let resultado = ''

  if (miles > 0) {
    if (miles === 1) resultado = 'MIL'
    else resultado = centenas(miles) + ' MIL'
  }

  if (resto > 0) {
    if (resultado) resultado += ' '
    resultado += centenas(resto)
  }

  return resultado.trim()
}

// Formatea como cantidad de soles: "S/ 3,500.00 (TRES MIL QUINIENTOS 00/100 SOLES)"
export function formatearSoles(n: number): { numero: string; texto: string; completo: string } {
  const entero = Math.floor(n)
  const centavos = Math.round((n - entero) * 100).toString().padStart(2, '0')
  const texto = numeroATexto(entero)
  const numero = `S/ ${entero.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
  const completo = `${numero} (${texto} ${centavos}/100 SOLES)`
  return { numero, texto, completo }
}
