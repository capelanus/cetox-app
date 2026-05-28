// ── Contract field definitions ────────────────────────────────────────────────

export type TipoContrato =
  | 'INDETERMINADO'
  | 'INDETERMINADO_ALTA_DIR'
  | 'PLAZO_FIJO'
  | 'LOCACION_SERVICIOS'

export interface CamposIndeterminado {
  // Trabajador
  trabajadorNombre:    string
  trabajadorDni:       string
  trabajadorDomicilio: string
  trabajadorDistrito:  string
  // Laboral
  cargo:               string
  fechaIngresoServicios: string   // DD/MM/YYYY — fecha de inicio real
  remuneracionNum:     number
  // Antigüedad (cláusula 11a)
  fechaAntiguedadTexto: string    // e.g. "01/10/2017"
  // Firma
  diaFirma:   string
  mesFirma:   string
  anioFirma:  string
}

export interface CamposPlazoFijo {
  // Trabajador
  trabajadorNombre:    string
  trabajadorDni:       string
  trabajadorDomicilio: string
  trabajadorDistrito:  string
  trabajadorProfesion: string
  // Laboral
  cargo:               string
  causaObjetiva:       string    // actividades/descripción específica
  remuneracionNum:     number
  // Vigencia
  duracionTexto:       string    // e.g. "tres (03) meses"
  fechaInicio:         string    // DD/MM/YYYY
  fechaFin:            string    // DD/MM/YYYY
  // Firma
  diaFirma:   string
  mesFirma:   string
  anioFirma:  string
}

export interface PagoLocacion {
  id:          string   // e.g. "01"
  entregable:  string
  fechaPago:   string
  monto:       number
}

export interface CamposLocacion {
  // Prestador
  prestadorNombre:    string
  prestadorDni:       string
  prestadorDomicilio: string
  prestadorDistrito:  string
  // Objeto
  descripcionServicios: string
  // Honorarios
  honorariosTotal: number
  pagos:           PagoLocacion[]   // 1–4 pagos
  // Vigencia
  duracionMeses:   number           // e.g. 3
  fechaInicio:     string
  fechaFin:        string
  // Firma
  diaFirma:   string
  mesFirma:   string
  anioFirma:  string
}
