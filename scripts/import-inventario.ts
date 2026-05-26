/**
 * Script para importar el inventario desde Excel.
 * Uso: npx tsx scripts/import-inventario.ts <ruta-al-excel>
 *
 * Importa desde la hoja PRODUCTOS (COD-ORDEN + DESCRIPCIÓN)
 * y enriquece con stock desde REPORTE DE ROTACIÓN.
 */

import * as XLSX from 'xlsx'
import { Client } from 'pg'
import { randomUUID } from 'crypto'

const DATABASE_URL = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('❌  Usa: npx tsx scripts/import-inventario.ts <ruta-al-excel>')
    process.exit(1)
  }

  console.log(`📂  Leyendo archivo: ${filePath}`)
  const wb = XLSX.readFile(filePath)

  // ── Hoja PRODUCTOS ─────────────────────────────────────────────
  const wsProd = wb.Sheets['PRODUCTOS']
  if (!wsProd) {
    console.error('❌  No se encontró la hoja "PRODUCTOS" en el archivo.')
    process.exit(1)
  }

  const rowsProd: (string | number)[][] = XLSX.utils.sheet_to_json(wsProd, {
    header: 1,
    defval: '',
  }) as (string | number)[][]

  // La cabecera está en la fila 3 (índice 2), datos desde fila 4 (índice 3)
  const productos: { codOrden: string | null; descripcion: string }[] = rowsProd
    .slice(3)
    .filter(r => r[0] !== '' || r[1] !== '')
    .map(r => ({
      codOrden: String(r[0] ?? '').trim() || null,
      descripcion: String(r[1] ?? '').trim().replace(/\n/g, ' '),
    }))
    .filter(p => p.descripcion.length > 0)

  console.log(`📦  Productos en hoja PRODUCTOS: ${productos.length}`)

  // ── Hoja REPORTE DE ROTACIÓN ───────────────────────────────────
  const wsRot = wb.Sheets['REPORTE DE ROTACIÓN']
  const stockMap: Record<string, number> = {}

  if (wsRot) {
    const rowsRot: (string | number)[][] = XLSX.utils.sheet_to_json(wsRot, {
      header: 1,
      defval: '',
    }) as (string | number)[][]

    rowsRot.slice(1).forEach(r => {
      const cod = String(r[0] ?? '').trim()
      const stockActual = typeof r[5] === 'number' ? r[5] : 0
      if (cod) stockMap[cod] = stockActual
    })

    console.log(`📊  Productos con stock en REPORTE DE ROTACIÓN: ${Object.keys(stockMap).length}`)
  }

  // ── Conectar a BD ───────────────────────────────────────────────
  const client = new Client({ connectionString: DATABASE_URL })
  await client.connect()
  console.log('🔌  Conectado a la base de datos.')

  let created = 0
  let updated = 0
  let skipped = 0

  const now = new Date().toISOString()

  for (const prod of productos) {
    const stock = stockMap[prod.codOrden ?? ''] ?? 0

    try {
      if (prod.codOrden) {
        // Check if exists
        const res = await client.query(
          'SELECT id FROM "InventarioItem" WHERE "codOrden" = $1',
          [prod.codOrden]
        )
        if (res.rows.length > 0) {
          await client.query(
            'UPDATE "InventarioItem" SET descripcion = $1, stock = $2, "updatedAt" = $3 WHERE "codOrden" = $4',
            [prod.descripcion, stock, now, prod.codOrden]
          )
          updated++
        } else {
          await client.query(
            'INSERT INTO "InventarioItem" (id, "codOrden", descripcion, stock, activo, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, true, $5, $5)',
            [randomUUID(), prod.codOrden, prod.descripcion, stock, now]
          )
          created++
        }
      } else {
        // Check by description
        const res = await client.query(
          'SELECT id FROM "InventarioItem" WHERE descripcion = $1 AND "codOrden" IS NULL',
          [prod.descripcion]
        )
        if (res.rows.length === 0) {
          await client.query(
            'INSERT INTO "InventarioItem" (id, "codOrden", descripcion, stock, activo, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, true, $5, $5)',
            [randomUUID(), null, prod.descripcion, stock, now]
          )
          created++
        } else {
          skipped++
        }
      }
    } catch (e) {
      console.error(`  ⚠️  Error en "${prod.codOrden}" / "${prod.descripcion.slice(0, 40)}":`, e)
      skipped++
    }
  }

  await client.end()

  console.log('\n✅  Importación completa:')
  console.log(`   Creados:      ${created}`)
  console.log(`   Actualizados: ${updated}`)
  console.log(`   Omitidos:     ${skipped}`)
}

main().catch(e => { console.error(e); process.exit(1) })
