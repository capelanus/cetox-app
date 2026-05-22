export interface Pais {
  nombre: string
  codigo: string  // ISO 3166-1 alpha-2
  prefijo: string // phone prefix with +
}

export const PAISES: Pais[] = [
  { nombre: 'Perú',              codigo: 'PE', prefijo: '+51'  },
  { nombre: 'Argentina',        codigo: 'AR', prefijo: '+54'  },
  { nombre: 'Bolivia',          codigo: 'BO', prefijo: '+591' },
  { nombre: 'Brasil',           codigo: 'BR', prefijo: '+55'  },
  { nombre: 'Chile',            codigo: 'CL', prefijo: '+56'  },
  { nombre: 'Colombia',         codigo: 'CO', prefijo: '+57'  },
  { nombre: 'Costa Rica',       codigo: 'CR', prefijo: '+506' },
  { nombre: 'Cuba',             codigo: 'CU', prefijo: '+53'  },
  { nombre: 'Ecuador',          codigo: 'EC', prefijo: '+593' },
  { nombre: 'El Salvador',      codigo: 'SV', prefijo: '+503' },
  { nombre: 'España',           codigo: 'ES', prefijo: '+34'  },
  { nombre: 'Estados Unidos',   codigo: 'US', prefijo: '+1'   },
  { nombre: 'Guatemala',        codigo: 'GT', prefijo: '+502' },
  { nombre: 'Honduras',         codigo: 'HN', prefijo: '+504' },
  { nombre: 'México',           codigo: 'MX', prefijo: '+52'  },
  { nombre: 'Nicaragua',        codigo: 'NI', prefijo: '+505' },
  { nombre: 'Panamá',           codigo: 'PA', prefijo: '+507' },
  { nombre: 'Paraguay',         codigo: 'PY', prefijo: '+595' },
  { nombre: 'Reino Unido',      codigo: 'GB', prefijo: '+44'  },
  { nombre: 'República Dominicana', codigo: 'DO', prefijo: '+1-809' },
  { nombre: 'Uruguay',          codigo: 'UY', prefijo: '+598' },
  { nombre: 'Venezuela',        codigo: 'VE', prefijo: '+58'  },
  { nombre: 'Alemania',         codigo: 'DE', prefijo: '+49'  },
  { nombre: 'Canada',           codigo: 'CA', prefijo: '+1'   },
  { nombre: 'China',            codigo: 'CN', prefijo: '+86'  },
  { nombre: 'Francia',          codigo: 'FR', prefijo: '+33'  },
  { nombre: 'Italia',           codigo: 'IT', prefijo: '+39'  },
  { nombre: 'Japón',            codigo: 'JP', prefijo: '+81'  },
  { nombre: 'Otro',             codigo: 'XX', prefijo: '+'    },
]
