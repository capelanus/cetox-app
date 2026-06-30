export const ROL_LABELS: Record<string, string> = {
  GERENTE_GENERAL:        'Gerente General',
  GERENTE_TECNICO:        'Gerente Técnico',
  DIRECTOR_CALIDAD:       'Dirección Lab. y Calidad',
  DIRECTOR_ADMINISTRACION:'Dirección Adm. y Finanzas',
  ADMINISTRACION:         'Administración',
  COORDINADOR_CALIDAD:    'Coordinación de Calidad',
  ANALISTA:               'Analista',
  SUPER_ADMIN:            'Super Admin',
  JEFE_OPERACIONES:       'Jefe de Operaciones',
  ASISTENTE_LOGISTICA:    'Asistente de Logística',
}

export const AREA_LABELS: Record<string, string> = {
  Q: 'Química',
  B: 'Biología',
  M: 'Microbiología',
}

export const MODALIDAD_LABELS: Record<string, string> = {
  ANTICIPO_50_50: 'Anticipo 50/50',
  ANTICIPO_100: 'Anticipo 100%',
  CREDITO_100: 'Crédito 100%',
  CREDITO_50_50: 'Crédito 50/50',
  CREDITO_MENSUAL: 'Crédito mensual',
  CREDITO_QUINCENAL: 'Crédito quincenal',
  AL_CULMINAR: 'Al culminar',
}

export const AREA_SOLICITANTE_LABELS: Record<string, string> = {
  QUIMICA: 'Química',
  BIOLOGIA: 'Biología',
  MICROBIOLOGIA: 'Microbiología',
  CALIDAD: 'Calidad',
  GERENCIA: 'Gerencia',
  ADMINISTRACION: 'Administración',
  OPERACIONES: 'Operaciones',
  OTRA: 'Otra',
}

export const URGENCIA_LABELS: Record<string, string> = {
  NORMAL: 'Normal',
  URGENTE: 'Urgente',
  MUY_URGENTE: 'Muy urgente',
}

export const ESTADO_REQUERIMIENTO_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador',
  ENVIADO: 'Enviado',
  EN_COTIZACION: 'En cotización',
  ENVIADO_CALIDAD: 'Enviado a Calidad',
  COTIZACION_APROBADA: 'Cotización aprobada',
  OC_EMITIDA: 'OC emitida',
  EN_TRANSITO: 'En tránsito',
  RECEPCIONADO: 'Recepcionado',
  CERRADO: 'Cerrado',
  CANCELADO: 'Cancelado',
}

export const ESTADO_COT_PROVEEDOR_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador',
  ENVIADA_CALIDAD: 'Enviada a Calidad',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
}

export const ESTADO_OC_LABELS: Record<string, string> = {
  EMITIDA: 'Emitida',
  CONFIRMADA_PROVEEDOR: 'Confirmada por proveedor',
  EN_TRANSITO: 'En tránsito',
  RECIBIDA: 'Recibida',
  PENDIENTE_PAGO: 'Pendiente de pago',
  CERRADA: 'Cerrada',
  CANCELADA: 'Cancelada',
}

export const ESTADO_RECEPCION_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFORME: 'Conforme',
  NO_CONFORME: 'No conforme',
  ENTREGADO_AREA: 'Entregado al área',
}

export const ESTADO_FACTURA_LABELS: Record<string, string> = {
  REGISTRADA: 'Registrada',
  EN_PROVISION: 'En provisión',
  PAGADA: 'Pagada',
}

export const ESTADO_PAGO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  PAGADO: 'Pagado',
  CONFIRMADO_PROVEEDOR: 'Confirmado al proveedor',
}

export const CONDICION_PAGO_LABELS: Record<string, string> = {
  ANTICIPO: 'Anticipo',
  CREDITO_15: 'Crédito 15 días',
  CREDITO_30: 'Crédito 30 días',
  CONTRA_ENTREGA: 'Contra entrega',
}

export const MEDIO_PAGO_LABELS: Record<string, string> = {
  TRANSFERENCIA: 'Transferencia bancaria',
  YAPE: 'Yape',
  CHEQUE: 'Cheque',
  EFECTIVO: 'Efectivo',
  OTRO: 'Otro',
}
