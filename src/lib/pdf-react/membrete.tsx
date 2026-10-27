import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import path from 'node:path'

// ── Membrete declarativo (React PDF) ────────────────────────────────────────
// Reemplaza el dibujado a mano de pdf-membrete.ts (coordenadas x/y calculadas
// a pulso, ensureSpace() antes de cada bloque) por maquetación con flexbox:
// el contenido fluye y pagina solo, sin tener que medir alturas. El membrete
// y el pie se marcan `fixed` para que se repitan en cada página que genere
// la paginación automática.

export const GREEN = '#13602C'
export const BLACK = '#000000'
export const GRAY = '#6b6b6b'
export const LIGHT_GRAY = '#f5f5f5'
export const SHADE = '#eaf4f4'   // fondo claro CETOX
export const WHITE = '#ffffff'

export const PAGE_W = 595.28
export const PAGE_H = 841.89
export const ML = 42
export const MR = 42
export const CW = PAGE_W - ML - MR

const letterheadPath = path.join(process.cwd(), 'public', 'templates', 'letterhead-set-bg.png')

export const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: BLACK,
    paddingTop: 168,
    paddingBottom: 36,
    paddingHorizontal: ML,
  },
  bg: { position: 'absolute', top: 0, left: 0, width: PAGE_W, height: PAGE_H },
  footer: {
    position: 'absolute', bottom: 14, right: MR,
    textAlign: 'right',
  },
  footerLine1: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: GREEN },
  footerLine2: { fontSize: 7, color: GREEN, marginTop: 2 },
})

/**
 * Página A4 con el membrete oficial de fondo (imagen fija, se repite en toda
 * página que la paginación automática genere) y el pie con el código de
 * formato.
 */
export function Membrete({
  numeroFormato, versionFormato, children,
}: {
  numeroFormato: string
  versionFormato: string
  children: React.ReactNode
}) {
  return (
    <Page size="A4" style={styles.page} wrap>
      <Image src={letterheadPath} style={styles.bg} fixed />
      {children}
      <View style={styles.footer} fixed>
        <Text style={styles.footerLine1}>{numeroFormato}</Text>
        <Text style={styles.footerLine2}>{versionFormato}</Text>
      </View>
    </Page>
  )
}

export function DocumentoMembrete({ title, children }: { title: string; children: React.ReactNode }) {
  return <Document title={title}>{children}</Document>
}

// ── Encabezado de título (fuera del membrete fijo, fluye con el contenido) ──
const headStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  titulo: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: GREEN },
  numero: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: BLACK },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  subtitulo: { fontSize: 8, color: GRAY },
  fechas: { fontSize: 7.5, color: GRAY },
  hr: { borderBottomWidth: 0.8, borderBottomColor: GREEN, marginTop: 8, marginBottom: 15 },
})

export function Encabezado({ titulo, numero, subtitulo, fechas }: {
  titulo: string; numero: string; subtitulo: string; fechas: string
}) {
  return (
    <View>
      <View style={headStyles.row}>
        <Text style={headStyles.titulo}>{titulo}</Text>
        <Text style={headStyles.numero}>{numero}</Text>
      </View>
      <View style={headStyles.subRow}>
        <Text style={headStyles.subtitulo}>{subtitulo}</Text>
        <Text style={headStyles.fechas}>{fechas}</Text>
      </View>
      <View style={headStyles.hr} />
    </View>
  )
}

// ── Badge de sección numerada ────────────────────────────────────────────────
const badgeStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  num: {
    width: 13, height: 13, backgroundColor: GREEN, color: WHITE,
    fontSize: 8.5, fontFamily: 'Helvetica-Bold', textAlign: 'center', paddingTop: 2,
  },
  titulo: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: GREEN, marginLeft: 6 },
})

export function Badge({ n, titulo }: { n: string; titulo: string }) {
  return (
    <View style={badgeStyles.row} wrap={false}>
      <Text style={badgeStyles.num}>{n}</Text>
      <Text style={badgeStyles.titulo}>{titulo}</Text>
    </View>
  )
}

// ── Cuadro de celdas (equivalente a crearGrid().cuadro() de pdf-membrete) ───
export interface CeldaGrid {
  label: string
  values: (string | null | undefined)[] | string | null | undefined
  span?: number
  size?: number
}

const gridStyles = StyleSheet.create({
  box: { borderWidth: 0.7, borderColor: GREEN, marginBottom: 12 },
  fila: { flexDirection: 'row', borderBottomWidth: 0.6, borderBottomColor: GREEN },
  filaUltima: { flexDirection: 'row' },
  celda: { paddingTop: 3.5, paddingBottom: 2.5, paddingHorizontal: 4, borderRightWidth: 0.6, borderRightColor: GREEN },
  celdaUltima: { paddingTop: 3.5, paddingBottom: 2.5, paddingHorizontal: 4 },
  label: { fontSize: 6.3, fontFamily: 'Helvetica-Bold', color: GREEN, marginBottom: 1.5 },
  valor: { fontSize: 8, color: BLACK, lineHeight: 1.15 },
  valorVacio: { fontSize: 8, color: GRAY },
})

/** Un cuadro tipo tabla de N columnas, con sombreado alterno por fila. */
export function Cuadro({ filas, columnas = 3 }: { filas: CeldaGrid[][]; columnas?: number }) {
  return (
    <View style={gridStyles.box} wrap>
      {filas.map((celdas, i) => (
        <View
          key={i}
          wrap={false}
          style={[
            i === filas.length - 1 ? gridStyles.filaUltima : gridStyles.fila,
            i % 2 === 0 ? { backgroundColor: SHADE } : {},
          ]}
        >
          {celdas.map((c, j) => {
            const span = c.span ?? 1
            const raw = Array.isArray(c.values) ? c.values : [c.values]
            const vals = raw.filter(Boolean) as string[]
            const esUltimaCelda = j === celdas.length - 1
            return (
              <View
                key={j}
                style={[esUltimaCelda ? gridStyles.celdaUltima : gridStyles.celda, { flexGrow: span, flexBasis: 0 }]}
              >
                <Text style={gridStyles.label}>{c.label}</Text>
                {vals.length ? vals.map((v, k) => (
                  <Text key={k} style={[gridStyles.valor, { fontSize: c.size ?? 8 }]}>{v}</Text>
                )) : <Text style={gridStyles.valorVacio}>—</Text>}
              </View>
            )
          })}
        </View>
      ))}
    </View>
  )
}
