import { View, Text, StyleSheet } from '@react-pdf/renderer'
import {
  DocumentoMembrete, Membrete, Encabezado, Badge, Cuadro, type CeldaGrid,
  GREEN, BLACK, GRAY, LIGHT_GRAY, SHADE, WHITE,
} from './membrete'
import { formatFecha, formatMoneda, formatNumCotizacion, suavizarMayusculas, formatFechaMuestra } from '@/lib/format'

const NUM_FORMATO = 'SIG-FR-ADM-002'
const VERSION_FORMATO = 'Versión: 01'

// ── Tipos de entrada: el shape exacto que devuelve el include de Prisma en
// la ruta /api/set/[id]/generar-pdf (ver route.ts). Mantenerlo separado del
// tipo generado de Prisma deja este componente fácil de probar con datos de
// prueba, sin depender de una consulta real.
export interface SetPdfData {
  numero: number
  anio: number
  fechaIngreso: Date
  codigoMuestra: string
  nombreComercial: string | null
  ingredienteActivo: string | null
  formulacion: string | null
  numeroLote: string | null
  fechaFabricacion: Date | null
  fechaVencimiento: Date | null
  fechaFabricacionSoloMes: boolean
  fechaVencimientoSoloMes: boolean
  pesoVolumen: string | null
  numeroMuestras: string | null
  tipoMuestra: string | null
  devolucionMuestra: string | null
  condicionesAmbientales: string | null
  procedenciaDescripcion: string | null
  ingresoMuestra: string | null
  ingresoMuestraOtro: string | null
  nombrePaciente: string | null
  edadPaciente: string | null
  tipoEnvase: string | null
  materialEnvase: string | null
  etiquetaEnvase: string | null
  seguridadEnvase: string | null
  otraIndicacionQ: string | null
  otraIndicacionB: string | null
  otraIndicacionM: string | null
  otraIndicacion: string | null
  observaciones: string | null
  cliente: { razonSocial: string; ruc: string; direccion: string }
  creadoPor: { email: string }
  cotizacion: {
    numero: number; anio: number; sufijo: string | null; moneda: string; fechaEmision: Date
    contactoNombre: string | null; contactoNombre2: string | null; contactoNombre3: string | null
    contactoTelefono: string | null; contactoTelefono2: string | null; contactoTelefono3: string | null
    contactoEmail: string | null; contactoEmail2: string | null; contactoEmail3: string | null
    facturasCliente: { serie: string; numero: number; fechaEmision: Date }[]
  } | null
  odas: {
    numero: number
    area: string
    fechaEntregaCompromiso: Date | null
    items: { costo: number; ensayo: { nombre: string } }[]
  }[]
}

const tableStyles = StyleSheet.create({
  header: { flexDirection: 'row', backgroundColor: GREEN, paddingVertical: 4, paddingHorizontal: 4 },
  headerTxt: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: WHITE },
  row: { flexDirection: 'row', paddingVertical: 3, paddingHorizontal: 4, alignItems: 'flex-start' },
  cellOda: { width: 42, fontSize: 8, fontFamily: 'Helvetica-Bold', color: BLACK },
  cellEnsayo: { flexGrow: 1, flexBasis: 0, fontSize: 8, color: BLACK, paddingRight: 4 },
  cellDpto: { width: 40, fontSize: 8, fontFamily: 'Helvetica-Bold', color: GRAY },
  cellEntrega: { width: 48, fontSize: 8, color: BLACK },
  cellCosto: { width: 70, fontSize: 8, color: BLACK, textAlign: 'right' },
  totBox: { marginTop: 6, borderWidth: 0.7, borderColor: GREEN, alignSelf: 'flex-end', width: 220 },
  totRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, paddingHorizontal: 8 },
  totLabel: { fontSize: 8.5, color: BLACK },
  totVal: { fontSize: 8.5, color: BLACK },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, paddingHorizontal: 8, backgroundColor: GREEN },
  totalLabel: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: WHITE },
  totalVal: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: WHITE },
})

function TablaEnsayos({ odas, moneda }: { odas: SetPdfData['odas']; moneda: 'USD' | 'PEN' }) {
  const monedaCorta = moneda === 'USD' ? 'USD' : 'S/.'
  const formatNum = (v: number) => new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
  let subtotal = 0

  return (
    <View>
      <View style={tableStyles.header} wrap={false}>
        <Text style={[tableStyles.headerTxt, { width: 42 }]}>ODA</Text>
        <Text style={[tableStyles.headerTxt, { flexGrow: 1, flexBasis: 0 }]}>Ensayos - Método</Text>
        <Text style={[tableStyles.headerTxt, { width: 40 }]}>Dpto.</Text>
        <Text style={[tableStyles.headerTxt, { width: 48 }]}>Entrega</Text>
        <Text style={[tableStyles.headerTxt, { width: 70, textAlign: 'right' }]}>Costo ({monedaCorta})</Text>
      </View>
      {odas.map((oda, i) => {
        const costo = oda.items.reduce((s, it) => s + it.costo, 0)
        subtotal += costo
        return (
          <View key={i} style={[tableStyles.row, i % 2 === 1 ? { backgroundColor: LIGHT_GRAY } : {}]} wrap={false}>
            <Text style={tableStyles.cellOda}>{String(oda.numero).padStart(5, '0')}</Text>
            <Text style={tableStyles.cellEnsayo}>{oda.items.map(it => it.ensayo.nombre).join(', ')}</Text>
            <Text style={tableStyles.cellDpto}>{oda.area}</Text>
            <Text style={tableStyles.cellEntrega}>{formatFecha(oda.fechaEntregaCompromiso)}</Text>
            <Text style={tableStyles.cellCosto}>{formatNum(costo)}</Text>
          </View>
        )
      })}
      <Totales subtotal={subtotal} moneda={moneda} />
    </View>
  )
}

function Totales({ subtotal, moneda }: { subtotal: number; moneda: 'USD' | 'PEN' }) {
  const monedaCorta = moneda === 'USD' ? 'USD' : 'S/.'
  const igv = subtotal * 0.18
  const total = subtotal + igv
  return (
    <View style={tableStyles.totBox} wrap={false}>
      <View style={[tableStyles.totRow, { backgroundColor: SHADE }]}>
        <Text style={tableStyles.totLabel}>Sub-total</Text>
        <Text style={tableStyles.totVal}>{formatMoneda(subtotal, moneda)}</Text>
      </View>
      <View style={tableStyles.totRow}>
        <Text style={tableStyles.totLabel}>I.G.V (18%)</Text>
        <Text style={tableStyles.totVal}>{formatMoneda(igv, moneda)}</Text>
      </View>
      <View style={tableStyles.totalRow}>
        <Text style={tableStyles.totalLabel}>TOTAL ({monedaCorta})</Text>
        <Text style={tableStyles.totalVal}>{formatMoneda(total, moneda)}</Text>
      </View>
    </View>
  )
}

const entregaStyles = StyleSheet.create({
  box: { borderWidth: 0.7, borderColor: GREEN, marginTop: 10, paddingVertical: 6, paddingHorizontal: 6 },
  linea: { fontSize: 8, color: BLACK, lineHeight: 1.3 },
  importante: { backgroundColor: SHADE, padding: 6, marginTop: 6 },
  importanteTxt: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: BLACK },
  banco: { flexDirection: 'row', borderWidth: 0.7, borderColor: GREEN, borderTopWidth: 0 },
  bancoTag: { width: 92, backgroundColor: GREEN, padding: 6 },
  bancoTagTxt1: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: WHITE },
  bancoTagTxt2: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: WHITE, marginTop: 2 },
  bancoFilas: { flexGrow: 1, backgroundColor: SHADE, justifyContent: 'center', paddingVertical: 2 },
  bancoFila: { flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 1.5 },
  bancoCta: { width: 70, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: GREEN },
  bancoNum: { width: 110, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: BLACK },
  bancoCciLabel: { width: 22, fontSize: 7, fontFamily: 'Helvetica-Bold', color: GRAY },
  bancoCci: { fontSize: 7.5, color: BLACK },
  firmas: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 28, paddingHorizontal: 18 },
  firmaCol: { alignItems: 'center', width: 196 },
  firmaLinea: { borderTopWidth: 0.75, borderTopColor: BLACK, width: '100%' },
  firmaTxt: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: GRAY, marginTop: 4 },
  firmaSub: { fontSize: 8, color: GRAY, marginTop: 2 },
  firmaDato: { flexDirection: 'row', alignItems: 'flex-end', width: '100%', marginTop: 9 },
  firmaDatoLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: GRAY, marginRight: 4 },
  firmaDatoLinea: { flexGrow: 1, borderBottomWidth: 0.6, borderBottomColor: GRAY, marginBottom: 1 },
})

// ── Control de pagos: cabecera prellenada con la cotización (N°, fecha y
// a quién se atendió: el contacto que escribió a CETOX) y dos filas en
// blanco para anotar a mano las facturas y pagos. Las columnas son las
// mismas en todas las filas para que las divisiones queden alineadas.
const pagosStyles = StyleSheet.create({
  box: { flexDirection: 'row', borderWidth: 0.7, borderColor: GREEN, marginTop: 10 },
  tag: { width: 92, backgroundColor: GREEN, padding: 6, justifyContent: 'center' },
  tagTxt1: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: WHITE },
  tagTxt2: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: WHITE, marginTop: 2 },
  cuerpo: { flexGrow: 1, flexBasis: 0 },
  fila: { flexDirection: 'row', borderBottomWidth: 0.6, borderBottomColor: GREEN },
  filaUltima: { flexDirection: 'row' },
  campo: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 6, paddingTop: 7, paddingBottom: 5, borderRightWidth: 0.6, borderRightColor: GREEN },
  campoUltimo: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 6, paddingTop: 7, paddingBottom: 5 },
  label: { fontSize: 6.3, fontFamily: 'Helvetica-Bold', color: GREEN, marginRight: 4, flexShrink: 0 },
  linea: { flexGrow: 1, flexBasis: 0, borderBottomWidth: 0.6, borderBottomColor: GRAY, minWidth: 10, marginBottom: 1 },
  valor: { fontSize: 7.5, color: BLACK, paddingBottom: 1 },
})

// Anchos de columna compartidos por todas las filas (pt).
const COL = { factura: 120, monto: 80, emision: 95 }

/** "ETIQUETA ____" con la línea en blanco o con el valor ya escrito encima. */
function Campo({ label, valor, width, ultimo }: { label: string; valor?: string | null; width?: number; ultimo?: boolean }) {
  return (
    <View style={[ultimo ? pagosStyles.campoUltimo : pagosStyles.campo, width ? { width } : { flexGrow: 1, flexBasis: 0 }]}>
      <Text style={pagosStyles.label}>{label}</Text>
      <View style={pagosStyles.linea}>
        {valor ? <Text style={pagosStyles.valor}>{valor}</Text> : null}
      </View>
    </View>
  )
}

function ControlDePagos({ cotizacion, fecha, atencion }: { cotizacion: string | null; fecha: string | null; atencion: string | null }) {
  return (
    <View style={pagosStyles.box} wrap={false}>
      <View style={pagosStyles.tag}>
        <Text style={pagosStyles.tagTxt1}>CONTROL DE</Text>
        <Text style={pagosStyles.tagTxt2}>PAGOS</Text>
      </View>
      <View style={pagosStyles.cuerpo}>
        <View style={[pagosStyles.fila, { backgroundColor: SHADE }]}>
          <Campo label="N° DE COTIZACIÓN" valor={cotizacion} width={COL.factura + COL.monto} />
          <Campo label="FECHA" valor={fecha} width={COL.emision} />
          <Campo label="ATENCIÓN" valor={atencion} ultimo />
        </View>
        {[1, 2].map(n => (
          <View key={n} style={[n === 2 ? pagosStyles.filaUltima : pagosStyles.fila, n === 2 ? { backgroundColor: SHADE } : {}]}>
            <Campo label={`FACTURA N° ${n}`} width={COL.factura} />
            <Campo label="MONTO" width={COL.monto} />
            <Campo label="F. EMISIÓN" width={COL.emision} />
            <Campo label="F. PAGO" ultimo />
          </View>
        ))}
      </View>
    </View>
  )
}

const CUENTAS: [string, string, string][] = [
  ['Dólares', '194-1427241-1-85', '00219400142724118592'],
  ['Soles', '194-1778268-0-01', '00219400177826800195'],
]

function EntregaYFirmas({ firmaRegistrador, pagos }: {
  firmaRegistrador: string
  pagos: { cotizacion: string | null; fecha: string | null; atencion: string | null }
}) {
  return (
    <View wrap={false}>
      <Badge n="4" titulo="ENTREGA DE INFORMES EN OFICINA CETOX" />
      <View style={entregaStyles.box}>
        <Text style={entregaStyles.linea}>Hora de entrega: a partir de las 3:00 pm del día indicado.</Text>
        <Text style={entregaStyles.linea}>Lima/Callao: se recoge en la oficina de CETOX.</Text>
        <Text style={entregaStyles.linea}>Provincia/Exterior: envío por courier vía collect o previa cancelación del envío por el cliente.</Text>
        <View style={entregaStyles.importante}>
          <Text style={entregaStyles.importanteTxt}>
            IMPORTANTE: Corrobore todos los datos. Al firmar este documento da conformidad de TODOS los datos de la
            empresa y de la muestra indicados en el SET, y declara conocer las condiciones contractuales.
          </Text>
        </View>
      </View>
      <View style={entregaStyles.firmas}>
        <View style={entregaStyles.firmaCol}>
          <View style={entregaStyles.firmaLinea} />
          <Text style={entregaStyles.firmaTxt}>Cliente</Text>
          <View style={entregaStyles.firmaDato}>
            <Text style={entregaStyles.firmaDatoLabel}>Nombre:</Text>
            <View style={entregaStyles.firmaDatoLinea} />
          </View>
          <View style={entregaStyles.firmaDato}>
            <Text style={entregaStyles.firmaDatoLabel}>DNI:</Text>
            <View style={entregaStyles.firmaDatoLinea} />
          </View>
        </View>
        <View style={entregaStyles.firmaCol}>
          <View style={entregaStyles.firmaLinea} />
          <Text style={entregaStyles.firmaTxt}>Centro Toxicológico S.A.C. &quot;CETOX&quot;</Text>
          <Text style={entregaStyles.firmaSub}>{firmaRegistrador}</Text>
        </View>
      </View>
      <View style={[entregaStyles.banco, { marginTop: 18, borderTopWidth: 0.7 }]}>
        <View style={entregaStyles.bancoTag}>
          <Text style={entregaStyles.bancoTagTxt1}>CUENTA CORRIENTE</Text>
          <Text style={entregaStyles.bancoTagTxt2}>BCP</Text>
        </View>
        <View style={entregaStyles.bancoFilas}>
          {CUENTAS.map(([mon, cta, cci]) => (
            <View key={mon} style={entregaStyles.bancoFila}>
              <Text style={entregaStyles.bancoCta}>Cta. {mon}</Text>
              <Text style={entregaStyles.bancoNum}>{cta}</Text>
              <Text style={entregaStyles.bancoCciLabel}>CCI</Text>
              <Text style={entregaStyles.bancoCci}>{cci}</Text>
            </View>
          ))}
        </View>
      </View>
      <ControlDePagos cotizacion={pagos.cotizacion} fecha={pagos.fecha} atencion={pagos.atencion} />
    </View>
  )
}

export function SetDocumento({ set, numSET }: { set: SetPdfData; numSET: string }) {
  const moneda = (set.cotizacion?.moneda ?? 'USD') as 'USD' | 'PEN'
  const cot = set.cotizacion

  const contactos = [cot?.contactoNombre, cot?.contactoNombre2, cot?.contactoNombre3]
  const telefonos = [cot?.contactoTelefono, cot?.contactoTelefono2, cot?.contactoTelefono3]
  const emails = [cot?.contactoEmail, cot?.contactoEmail2, cot?.contactoEmail3]

  const filasCliente: CeldaGrid[][] = [
    [
      { label: 'SOLICITANTE', values: set.cliente.razonSocial, span: 2 },
      { label: 'R.U.C.', values: set.cliente.ruc },
    ],
    [{ label: 'DIRECCIÓN', values: set.cliente.direccion, span: 3 }],
    [
      { label: 'CONTACTO', values: contactos },
      { label: 'TELÉFONO', values: telefonos },
      { label: 'EMAIL', values: emails, size: 7 },
    ],
    [{ label: 'CÓDIGO DE MUESTRA', values: set.codigoMuestra, span: 3 }],
  ]

  const ingreso = set.ingresoMuestra === 'Otro' ? `Otro: ${set.ingresoMuestraOtro ?? ''}` : set.ingresoMuestra
  const filasMuestra: CeldaGrid[][] = [
    [{ label: 'NOMBRE COMERCIAL', values: set.nombreComercial, span: 3 }],
    [{ label: 'INGREDIENTE ACTIVO', values: set.ingredienteActivo, span: 3 }],
    [
      { label: 'FORMULACIÓN', values: set.formulacion },
      { label: 'N° DE LOTE', values: set.numeroLote, span: 2 },
    ],
    [
      { label: 'FECHA DE FABRICACIÓN', values: set.fechaFabricacion ? formatFechaMuestra(set.fechaFabricacion, set.fechaFabricacionSoloMes) : null },
      { label: 'FECHA DE VENCIMIENTO', values: set.fechaVencimiento ? formatFechaMuestra(set.fechaVencimiento, set.fechaVencimientoSoloMes) : null },
      { label: 'PESO / VOLUMEN', values: set.pesoVolumen },
    ],
    [
      { label: 'N° DE MUESTRAS', values: set.numeroMuestras },
      { label: 'TIPO DE MUESTRA', values: set.tipoMuestra },
      { label: 'DEVOLUCIÓN DE SOBRANTE', values: set.devolucionMuestra },
    ],
    [
      { label: 'CONDICIONES AMBIENTALES', values: set.condicionesAmbientales },
      { label: 'PROCEDENCIA', values: set.procedenciaDescripcion },
      { label: 'INGRESO DE MUESTRA', values: ingreso },
    ],
  ]
  if (set.nombrePaciente || set.edadPaciente) {
    filasMuestra.push([
      { label: 'PACIENTE', values: set.nombrePaciente, span: 2 },
      { label: 'EDAD', values: set.edadPaciente },
    ])
  }
  if (set.tipoEnvase || set.materialEnvase || set.etiquetaEnvase || set.seguridadEnvase) {
    filasMuestra.push([
      { label: 'ENVASE', values: [set.tipoEnvase, set.materialEnvase].filter(Boolean).join(' · ') || null },
      { label: 'ETIQUETA', values: set.etiquetaEnvase },
      { label: 'SEGURIDAD', values: set.seguridadEnvase },
    ])
  }
  const indicaciones = [
    set.otraIndicacionQ && `Química: ${suavizarMayusculas(set.otraIndicacionQ)}`,
    set.otraIndicacionB && `Biología: ${suavizarMayusculas(set.otraIndicacionB)}`,
    set.otraIndicacionM && `Microbiología: ${suavizarMayusculas(set.otraIndicacionM)}`,
    !set.otraIndicacionQ && !set.otraIndicacionB && !set.otraIndicacionM ? set.otraIndicacion : null,
  ].filter(Boolean) as string[]
  if (indicaciones.length) filasMuestra.push([{ label: 'INDICACIONES', values: indicaciones, span: 3 }])
  if (set.observaciones) filasMuestra.push([{ label: 'OBSERVACIONES', values: set.observaciones, span: 3 }])

  // La parte del correo antes de la arroba, capitalizada por partes:
  // a.cadillo@… → A.Cadillo
  const firmaRegistrador = set.creadoPor.email.split('@')[0]
    .split('.').map(t => t.charAt(0).toUpperCase() + t.slice(1)).join('.')

  return (
    <DocumentoMembrete title={`SET-${numSET}`}>
      <Membrete numeroFormato={NUM_FORMATO} versionFormato={VERSION_FORMATO}>
        <Encabezado
          titulo="SOLICITUD DE ENSAYO TOXICOLÓGICO"
          numero={numSET}
          subtitulo="Registro de ingreso de muestra (SET)"
          fechas={`Ingreso: ${formatFecha(set.fechaIngreso)}`}
        />

        <Badge n="1" titulo="DATOS DEL CLIENTE" />
        <Cuadro filas={filasCliente} />

        <Badge n="2" titulo="DATOS DE LA MUESTRA" />
        <Cuadro filas={filasMuestra} />

        <Badge n="3" titulo={`ENSAYOS SOLICITADOS (${set.odas.length})`} />
        {set.odas.length === 0 ? (
          <Text style={{ fontSize: 9, color: GRAY, marginBottom: 14 }}>No hay ensayos asociados a este SET.</Text>
        ) : (
          <TablaEnsayos odas={set.odas} moneda={moneda} />
        )}

        <EntregaYFirmas
          firmaRegistrador={firmaRegistrador}
          pagos={{
            cotizacion: cot ? formatNumCotizacion(cot.numero, cot.anio, cot.sufijo ?? undefined) : null,
            fecha: cot ? formatFecha(cot.fechaEmision) : null,
            atencion: cot?.contactoNombre ?? null,
          }}
        />
      </Membrete>
    </DocumentoMembrete>
  )
}
