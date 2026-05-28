/**
 * Seed script for Equipment Maintenance Module (2026 Program)
 * Run with: npx tsx prisma/seed-equipos.ts
 *
 * Data source: "2026 Programac Mant Calib Verif Operac ok.pdf"
 */

import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any)

// ── Types ─────────────────────────────────────────────────────────────────────

interface TareaInput {
  tipo: 'PREVENTIVO' | 'CALIBRACION' | 'VERIFICACION'
  mes:  number  // 1-12
  anio: number
}

interface EquipoInput {
  codigo:    string
  nombre:    string
  area:      string | null   // B=Biología Q=Química M=Microbiología AD CAL
  categoria: string          // GENERAL | TERMOHIGROMETRO | VIDRIO | BALANZA | INCUBADORA | BIOSEGURIDAD
  notas?:    string
  tareas:    TareaInput[]
}

// ── Equipment data (from the 2026 maintenance program PDF) ────────────────────

const EQUIPOS: EquipoInput[] = [
  // ─── BIOLOGÍA ─────────────────────────────────────────────────────────────
  {
    codigo:    'EQ-002',
    nombre:    'Autoclave vertical 50L',
    area:      'B',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'CALIBRACION', mes: 6, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-003',
    nombre:    'Autoclave horizontal 100L',
    area:      'B',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'CALIBRACION', mes: 6, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-005',
    nombre:    'Centrífuga refrigerada',
    area:      'B',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'PREVENTIVO', mes: 2, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-008',
    nombre:    'Incubadora bacteriológica 37°C',
    area:      'B',
    categoria: 'INCUBADORA',
    tareas: [
      { tipo: 'CALIBRACION', mes: 3, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 9, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-012',
    nombre:    'Microscopio binocular Olimpus CX23',
    area:      'B',
    categoria: 'GENERAL',
    notas:     'Limpieza óptica y ajuste mecánico',
    tareas: [
      { tipo: 'PREVENTIVO', mes: 4, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-015',
    nombre:    'Balanza analítica 0.1 mg',
    area:      'B',
    categoria: 'BALANZA',
    tareas: [
      { tipo: 'CALIBRACION', mes: 2, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 8, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-018',
    nombre:    'pHmetro con electrodo',
    area:      'B',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'CALIBRACION', mes: 5, anio: 2026 },
      { tipo: 'CALIBRACION', mes: 11, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-020',
    nombre:    'Refrigeradora 4°C bioreactivos',
    area:      'B',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'VERIFICACION', mes: 3, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 6, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 9, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 12, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-022',
    nombre:    'Freezer -20°C muestras',
    area:      'B',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'VERIFICACION', mes: 6, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 12, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-025',
    nombre:    'Baño María termostático',
    area:      'B',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'CALIBRACION', mes: 5, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-028',
    nombre:    'Agitador vórtex',
    area:      'B',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'PREVENTIVO', mes: 8, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-032',
    nombre:    'Centrífuga de microhematocrito',
    area:      'B',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'PREVENTIVO', mes: 2, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-041',
    nombre:    'Cabina de bioseguridad clase II',
    area:      'B',
    categoria: 'BIOSEGURIDAD',
    notas:     'Cambio de filtros HEPA cada 6 meses',
    tareas: [
      { tipo: 'PREVENTIVO', mes: 6, anio: 2026 },
      { tipo: 'CALIBRACION', mes: 6, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-055',
    nombre:    'Termohigrómetro datalogger Biotario',
    area:      'B',
    categoria: 'TERMOHIGROMETRO',
    tareas: [
      { tipo: 'CALIBRACION', mes: 1, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 7, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-058',
    nombre:    'Estufa de esterilización 180°C',
    area:      'B',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'CALIBRACION', mes: 9, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-060',
    nombre:    'Contador de colonias',
    area:      'B',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'PREVENTIVO', mes: 11, anio: 2026 },
    ],
  },

  // ─── QUÍMICA ──────────────────────────────────────────────────────────────
  {
    codigo:    'EQ-046',
    nombre:    'Espectrofotómetro UV-Vis',
    area:      'Q',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'CALIBRACION', mes: 3, anio: 2026 },
      { tipo: 'CALIBRACION', mes: 9, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-048',
    nombre:    'Cromatógrafo líquido HPLC',
    area:      'Q',
    categoria: 'GENERAL',
    notas:     'Incluye limpieza de columna y cambio de solventes',
    tareas: [
      { tipo: 'PREVENTIVO', mes: 4, anio: 2026 },
      { tipo: 'CALIBRACION', mes: 10, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-050',
    nombre:    'Balanza semi-analítica 0.01 g',
    area:      'Q',
    categoria: 'BALANZA',
    tareas: [
      { tipo: 'CALIBRACION', mes: 3, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 9, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-052',
    nombre:    'Balanza de precisión 0.001 g',
    area:      'Q',
    categoria: 'BALANZA',
    tareas: [
      { tipo: 'CALIBRACION', mes: 3, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 9, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-075',
    nombre:    'Mufla 1200°C',
    area:      'Q',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'CALIBRACION', mes: 6, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-078',
    nombre:    'Plancha de calentamiento magnética',
    area:      'Q',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'PREVENTIVO', mes: 10, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-080',
    nombre:    'Campana extractora de gases',
    area:      'Q',
    categoria: 'BIOSEGURIDAD',
    notas:     'Verificar velocidad de extracción y cambio de filtros activos',
    tareas: [
      { tipo: 'PREVENTIVO', mes: 2, anio: 2026 },
      { tipo: 'PREVENTIVO', mes: 8, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-083',
    nombre:    'Pipeta automática 100-1000 µL (x5)',
    area:      'Q',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'CALIBRACION', mes: 4, anio: 2026 },
      { tipo: 'CALIBRACION', mes: 10, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-085',
    nombre:    'Refractómetro ABBE',
    area:      'Q',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'CALIBRACION', mes: 7, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-088',
    nombre:    'Conductímetro',
    area:      'Q',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'CALIBRACION', mes: 5, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-092',
    nombre:    'Agitador de mesa orbital',
    area:      'Q',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'PREVENTIVO', mes: 2, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-095',
    nombre:    'Espectrofotómetro AAS (absorción atómica)',
    area:      'Q',
    categoria: 'GENERAL',
    notas:     'Incluye alineación de lámparas y revisión de quemador',
    tareas: [
      { tipo: 'PREVENTIVO', mes: 4, anio: 2026 },
      { tipo: 'CALIBRACION', mes: 8, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-099',
    nombre:    'Titulador automático potenciométrico',
    area:      'Q',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'CALIBRACION', mes: 2, anio: 2026 },
      { tipo: 'CALIBRACION', mes: 8, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-158',
    nombre:    'Destilador de agua tipo II',
    area:      'Q',
    categoria: 'GENERAL',
    notas:     'Limpieza de resistencias y cambio de filtros',
    tareas: [
      { tipo: 'PREVENTIVO', mes: 6, anio: 2026 },
      { tipo: 'CALIBRACION', mes: 6, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-159',
    nombre:    'Turbidímetro de laboratorio',
    area:      'Q',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'CALIBRACION', mes: 3, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-163',
    nombre:    'Termómetro de referencia certificado',
    area:      'Q',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'CALIBRACION', mes: 1, anio: 2026 },
    ],
  },

  // ─── MICROBIOLOGÍA ────────────────────────────────────────────────────────
  {
    codigo:    'EQ-100',
    nombre:    'Incubadora de CO₂ 37°C',
    area:      'M',
    categoria: 'INCUBADORA',
    tareas: [
      { tipo: 'CALIBRACION', mes: 3, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 9, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-110',
    nombre:    'Sistema de filtración de agua ultrapura',
    area:      'M',
    categoria: 'GENERAL',
    notas:     'Cambio de membranas y cartuchos',
    tareas: [
      { tipo: 'PREVENTIVO', mes: 3, anio: 2026 },
      { tipo: 'CALIBRACION', mes: 7, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-112',
    nombre:    'Contador de colonias automático',
    area:      'M',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'VERIFICACION', mes: 4, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 10, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-115',
    nombre:    'Homogeneizador peristáltico stomacher',
    area:      'M',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'PREVENTIVO', mes: 9, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-118',
    nombre:    'Incubadora de agitación',
    area:      'M',
    categoria: 'INCUBADORA',
    tareas: [
      { tipo: 'CALIBRACION', mes: 5, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-120',
    nombre:    'Cabina de bioseguridad clase II tipo B2',
    area:      'M',
    categoria: 'BIOSEGURIDAD',
    tareas: [
      { tipo: 'PREVENTIVO', mes: 6, anio: 2026 },
      { tipo: 'CALIBRACION', mes: 6, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-123',
    nombre:    'Autoclave de bolsas 134°C',
    area:      'M',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'CALIBRACION', mes: 4, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-125',
    nombre:    'Microscopio de fluorescencia',
    area:      'M',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'PREVENTIVO', mes: 7, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-128',
    nombre:    'Termohigrómetro zona de cultivos',
    area:      'M',
    categoria: 'TERMOHIGROMETRO',
    tareas: [
      { tipo: 'CALIBRACION', mes: 2, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 8, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-130',
    nombre:    'Refrigeradora 4°C medios de cultivo',
    area:      'M',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'VERIFICACION', mes: 3, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 6, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 9, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 12, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-135',
    nombre:    'Balanza granataria 0.1g',
    area:      'M',
    categoria: 'BALANZA',
    tareas: [
      { tipo: 'CALIBRACION', mes: 5, anio: 2026 },
    ],
  },

  // ─── TERMOHIGRÓMETROS ─────────────────────────────────────────────────────
  {
    codigo:    'EQ-145',
    nombre:    'Termohigrómetro sala Biología 1',
    area:      'B',
    categoria: 'TERMOHIGROMETRO',
    tareas: [
      { tipo: 'CALIBRACION', mes: 6, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-146',
    nombre:    'Termohigrómetro sala Química',
    area:      'Q',
    categoria: 'TERMOHIGROMETRO',
    tareas: [
      { tipo: 'CALIBRACION', mes: 1, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 8, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-148',
    nombre:    'Termohigrómetro sala Microbiología',
    area:      'M',
    categoria: 'TERMOHIGROMETRO',
    tareas: [
      { tipo: 'CALIBRACION', mes: 2, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 8, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-150',
    nombre:    'Termohigrómetro pasillo principal',
    area:      'AD',
    categoria: 'TERMOHIGROMETRO',
    tareas: [
      { tipo: 'CALIBRACION', mes: 3, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 9, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-152',
    nombre:    'Termohigrómetro archivo documentos',
    area:      'AD',
    categoria: 'TERMOHIGROMETRO',
    tareas: [
      { tipo: 'CALIBRACION', mes: 4, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 10, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-154',
    nombre:    'Termohigrómetro almacén reactivos',
    area:      'Q',
    categoria: 'TERMOHIGROMETRO',
    tareas: [
      { tipo: 'CALIBRACION', mes: 5, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 11, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-156',
    nombre:    'Termohigrómetro cuarto de equipos',
    area:      'AD',
    categoria: 'TERMOHIGROMETRO',
    tareas: [
      { tipo: 'CALIBRACION', mes: 6, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 12, anio: 2026 },
    ],
  },

  // ─── MATERIAL DE VIDRIO VERIFICADO ────────────────────────────────────────
  {
    codigo:    'EQ-170',
    nombre:    'Buretas 50 mL clase A (juego)',
    area:      'Q',
    categoria: 'VIDRIO',
    tareas: [
      { tipo: 'VERIFICACION', mes: 2, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 8, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-171',
    nombre:    'Pipetas volumétricas 10 mL clase A',
    area:      'Q',
    categoria: 'VIDRIO',
    tareas: [
      { tipo: 'VERIFICACION', mes: 2, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 8, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-172',
    nombre:    'Matraces aforados 100 mL clase A',
    area:      'Q',
    categoria: 'VIDRIO',
    tareas: [
      { tipo: 'VERIFICACION', mes: 3, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 9, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-173',
    nombre:    'Matraces aforados 250 mL clase A',
    area:      'Q',
    categoria: 'VIDRIO',
    tareas: [
      { tipo: 'VERIFICACION', mes: 3, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 9, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-174',
    nombre:    'Matraces aforados 1000 mL clase A',
    area:      'Q',
    categoria: 'VIDRIO',
    tareas: [
      { tipo: 'VERIFICACION', mes: 4, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 10, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-175',
    nombre:    'Probetas 500 mL clase B',
    area:      'Q',
    categoria: 'VIDRIO',
    tareas: [
      { tipo: 'VERIFICACION', mes: 5, anio: 2026 },
    ],
  },

  // ─── CALIBRACIÓN ─────────────────────────────────────────────────────────
  {
    codigo:    'EQ-181',
    nombre:    'Pesas patrón clase E2 (juego)',
    area:      'CAL',
    categoria: 'GENERAL',
    notas:     'Enviadas a laboratorio externo acreditado',
    tareas: [
      { tipo: 'CALIBRACION', mes: 3, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-182',
    nombre:    'Pesas patrón clase M1 (juego)',
    area:      'CAL',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'CALIBRACION', mes: 3, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-183',
    nombre:    'Termómetro patrón Pt-100',
    area:      'CAL',
    categoria: 'GENERAL',
    notas:     'Patrón para calibración interna',
    tareas: [
      { tipo: 'CALIBRACION', mes: 6, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-185',
    nombre:    'Multímetro de referencia Fluke 87V',
    area:      'CAL',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'CALIBRACION', mes: 9, anio: 2026 },
    ],
  },

  // ─── ADMINISTRACIÓN / GENERAL ─────────────────────────────────────────────
  {
    codigo:    'EQ-190',
    nombre:    'Refrigeradora muestras recepción',
    area:      'AD',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'VERIFICACION', mes: 3, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 6, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 9, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 12, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-192',
    nombre:    'Congelador ultrabajo -80°C',
    area:      'B',
    categoria: 'GENERAL',
    notas:     'Crítico - verificar temperatura diariamente',
    tareas: [
      { tipo: 'PREVENTIVO', mes: 4, anio: 2026 },
      { tipo: 'CALIBRACION', mes: 10, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-195',
    nombre:    'UPS laboratorio (banco de baterías)',
    area:      'AD',
    categoria: 'GENERAL',
    notas:     'Revisión de autonomía y reemplazo de baterías si necesario',
    tareas: [
      { tipo: 'PREVENTIVO', mes: 6, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-197',
    nombre:    'Generador de nitrógeno',
    area:      'Q',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'PREVENTIVO', mes: 8, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-200',
    nombre:    'Lector de microplacas ELISA',
    area:      'M',
    categoria: 'GENERAL',
    tareas: [
      { tipo: 'CALIBRACION', mes: 7, anio: 2026 },
    ],
  },
  {
    codigo:    'EQ-203',
    nombre:    'Sistema PCR tiempo real',
    area:      'M',
    categoria: 'GENERAL',
    notas:     'Verificar eficiencia y calibrar curvas',
    tareas: [
      { tipo: 'CALIBRACION', mes: 5, anio: 2026 },
      { tipo: 'VERIFICACION', mes: 11, anio: 2026 },
    ],
  },
]

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔧 Seeding equipment maintenance data...\n')

  let equiposCreados = 0
  let tareasCreadas  = 0
  let equiposSaltados = 0

  for (const eq of EQUIPOS) {
    const existing = await prisma.equipo.findUnique({ where: { codigo: eq.codigo } })

    if (existing) {
      console.log(`  ⚠ Skipping ${eq.codigo} (already exists)`)
      equiposSaltados++
      continue
    }

    const equipo = await prisma.equipo.create({
      data: {
        codigo:    eq.codigo,
        nombre:    eq.nombre,
        area:      eq.area,
        categoria: eq.categoria,
        notas:     eq.notas ?? null,
        activo:    true,
        tareas: {
          create: eq.tareas.map(t => ({
            tipo:       t.tipo,
            mes:        t.mes,
            anio:       t.anio,
            completado: false,
          })),
        },
      },
      include: { tareas: true },
    })

    console.log(`  ✓ ${equipo.codigo} — ${equipo.nombre} (${equipo.tareas.length} tareas)`)
    equiposCreados++
    tareasCreadas += equipo.tareas.length
  }

  console.log(`\n✅ Done!`)
  console.log(`   Equipos creados: ${equiposCreados}`)
  console.log(`   Equipos saltados (ya existían): ${equiposSaltados}`)
  console.log(`   Tareas creadas: ${tareasCreadas}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
