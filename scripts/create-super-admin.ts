import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hashSync } from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  const passwordHash = hashSync('cetox2026', 10)

  const user = await prisma.usuario.upsert({
    where: { email: 'daniel@cetox.com.pe' },
    update: {
      rol: 'SUPER_ADMIN',
      passwordHash,
      nombre: 'Daniel (Super Admin)',
    },
    create: {
      email: 'daniel@cetox.com.pe',
      passwordHash,
      nombre: 'Daniel (Super Admin)',
      rol: 'SUPER_ADMIN',
    },
  })

  console.log('✅ Usuario creado/actualizado:', user.email, '| rol:', user.rol)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
