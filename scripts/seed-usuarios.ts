/**
 * Script para crear/actualizar todos los usuarios del directorio CETOX 2026.
 * Contraseña temporal por defecto: Cetox2026!
 *
 * Ejecutar con:
 *   npx tsx --tsconfig tsconfig.json scripts/seed-usuarios.ts
 */

import { PrismaClient }  from '../src/generated/prisma/client'
import { PrismaPg }      from '@prisma/adapter-pg'
import bcrypt            from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma  = new PrismaClient({ adapter } as any)

const PASS_DEFAULT = 'Cetox2026!'

interface UserSeed { email: string; nombre: string; rol: string; area?: string }

const usuarios: UserSeed[] = [
  // ── Gerencia ───────────────────────────────────────────────────────────────
  { email: 'lafa@cetox.com.pe',          nombre: 'Luis Alberto Fernández Anaya',         rol: 'GERENTE_TECNICO' },
  { email: 'ranaya@cetox.com.pe',        nombre: 'Rosalía Anaya Pajuelo',                rol: 'GERENTE_TECNICO' },

  // ── Dirección de Laboratorios y Calidad ────────────────────────────────────
  { email: 'gabrielarisco@cetox.com.pe', nombre: 'Gabriela Magaly Risco Tutaya',         rol: 'DIRECTOR_CALIDAD' },
  { email: 'a.alban@cetox.com.pe',       nombre: 'Ana Lucía Mirella Alban Vargas',       rol: 'DIRECTOR_CALIDAD' },

  // ── Dirección de Administración y Finanzas ─────────────────────────────────
  { email: 'a.castillo@cetox.com.pe',    nombre: 'Andrea Castillo Blanco',               rol: 'DIRECTOR_ADMINISTRACION' },

  // ── Administración ─────────────────────────────────────────────────────────
  { email: 'a.cadillo@cetox.com.pe',     nombre: 'Angie Daniela Cadillo Ramírez',        rol: 'ADMINISTRACION' },
  { email: 'y.valeriano@cetox.com.pe',   nombre: 'Yahaida Milagros Valeriano Machacuay', rol: 'ADMINISTRACION' },
  { email: 'admyfin@cetox.com.pe',       nombre: 'William Paul Ramírez Espinoza',        rol: 'ADMINISTRACION' },
  { email: 'contabilidad@cetox.com.pe',  nombre: 'Erika Navarro Herrera',                rol: 'ADMINISTRACION' },

  // ── Operaciones ────────────────────────────────────────────────────────────
  { email: 'r.campos@cetox.com.pe',      nombre: 'Reddy Fortunato Campos Soto',          rol: 'JEFE_OPERACIONES' },
  { email: 'operaciones2@cetox.com.pe',  nombre: 'Sandro Cahuana',                       rol: 'ASISTENTE_LOGISTICA' },

  // ── Química ───────────────────────────────────────────────────────────────
  { email: 'luisortega@cetox.com.pe',    nombre: 'Luis Alberto Ortega Pernia',           rol: 'ANALISTA', area: 'Q' },
  { email: 'm.chavez@cetox.com.pe',      nombre: 'Michael Heberth Chávez Benites',      rol: 'ANALISTA', area: 'Q' },
  { email: 'quimicalab@cetox.com.pe',    nombre: 'Katiuska Milena Castro Mio',           rol: 'ANALISTA', area: 'Q' },
  { email: 'quimicalab3@cetox.com.pe',   nombre: 'Gloria Ximena Avalos Munayco',         rol: 'ANALISTA', area: 'Q' },
  { email: 'quimicalab2@cetox.com.pe',   nombre: 'Álvaro Carlos Aguado Mallqui',         rol: 'ANALISTA', area: 'Q' },

  // ── Biología ──────────────────────────────────────────────────────────────
  { email: 'cgarrido@cetox.com.pe',      nombre: 'Claudia Garrido Cortelezzi',           rol: 'ANALISTA', area: 'B' },
  { email: 'f.espinoza@cetox.com.pe',    nombre: 'Flavia Espinoza Chávez',               rol: 'ANALISTA', area: 'B' },
  { email: 'm.perezreyes@cetox.com.pe',  nombre: 'María Paula Perez-Reyes de Fina',      rol: 'ANALISTA', area: 'B' },

  // ── Microbiología ─────────────────────────────────────────────────────────
  { email: 'p.verano@cetox.com.pe',      nombre: 'Pierina Verano Tello',                 rol: 'ANALISTA', area: 'M' },
]

async function main() {
  console.log('🔐 Hasheando contraseña por defecto…')
  const hash = await bcrypt.hash(PASS_DEFAULT, 12)

  let created = 0, updated = 0, skipped = 0

  for (const u of usuarios) {
    const existing = await prisma.usuario.findUnique({ where: { email: u.email } })

    if (!existing) {
      await prisma.usuario.create({
        data: { email: u.email, nombre: u.nombre, rol: u.rol, area: u.area ?? null, passwordHash: hash, activo: true },
      })
      console.log(`  ✅ Creado:      ${u.nombre} <${u.email}> [${u.rol}]`)
      created++
    } else {
      const needsUpdate = existing.nombre !== u.nombre || existing.rol !== u.rol || (existing.area ?? null) !== (u.area ?? null)
      if (needsUpdate) {
        await prisma.usuario.update({ where: { email: u.email }, data: { nombre: u.nombre, rol: u.rol, area: u.area ?? null } })
        console.log(`  🔄 Actualizado: ${u.nombre} <${u.email}> [${u.rol}]`)
        updated++
      } else {
        console.log(`  ⏭️  Sin cambios: ${u.nombre} <${u.email}>`)
        skipped++
      }
    }
  }

  console.log(`\n✨ Listo: ${created} creados · ${updated} actualizados · ${skipped} sin cambios`)
  console.log(`🔑 Contraseña temporal para cuentas nuevas: ${PASS_DEFAULT}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
