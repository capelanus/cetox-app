import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  const cert    = await prisma.certificado.deleteMany()
  const cargo   = await prisma.cargoEntrega.deleteMany()
  const informe = await prisma.informe.deleteMany()
  const odaItem = await prisma.oDAItem.deleteMany()
  const oda     = await prisma.oDA.deleteMany()
  const set     = await prisma.sET.deleteMany()
  const cotItem = await prisma.cotizacionItem.deleteMany()
  const cotMue  = await prisma.cotizacionMuestra.deleteMany()
  const cot     = await prisma.cotizacion.deleteMany()

  console.log('✅ Datos eliminados:')
  console.log(`   Certificados:  ${cert.count}`)
  console.log(`   Cargos:        ${cargo.count}`)
  console.log(`   Informes:      ${informe.count}`)
  console.log(`   ODA Items:     ${odaItem.count}`)
  console.log(`   ODAs:          ${oda.count}`)
  console.log(`   SETs:          ${set.count}`)
  console.log(`   Cot. Items:    ${cotItem.count}`)
  console.log(`   Cot. Muestras: ${cotMue.count}`)
  console.log(`   Cotizaciones:  ${cot.count}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
