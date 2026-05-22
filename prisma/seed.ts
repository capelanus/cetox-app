import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { hashSync } from 'bcryptjs'
import { addDays } from 'date-fns'
import path from 'path'

const dbPath = path.resolve(process.cwd(), 'dev.db')
const adapter = new PrismaBetterSqlite3({ url: dbPath })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  const password = hashSync('cetox2026', 10)

  // Usuarios
  const anaya = await prisma.usuario.upsert({
    where: { email: 'anaya@cetox.com.pe' },
    update: {},
    create: {
      email: 'anaya@cetox.com.pe',
      passwordHash: password,
      nombre: 'Dra. Rosalía Anaya',
      rol: 'GERENTE_TECNICO',
    },
  })

  const risco = await prisma.usuario.upsert({
    where: { email: 'risco@cetox.com.pe' },
    update: {},
    create: {
      email: 'risco@cetox.com.pe',
      passwordHash: password,
      nombre: 'Dra. Gabriela Risco',
      rol: 'DIRECTOR_CALIDAD',
    },
  })

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@cetox.com.pe' },
    update: {},
    create: {
      email: 'admin@cetox.com.pe',
      passwordHash: password,
      nombre: 'Andrea Castillo',
      rol: 'ADMINISTRACION',
    },
  })

  await prisma.usuario.upsert({
    where: { email: 'analista.q@cetox.com.pe' },
    update: {},
    create: {
      email: 'analista.q@cetox.com.pe',
      passwordHash: password,
      nombre: 'Katiuska Castro',
      rol: 'ANALISTA',
      area: 'Q',
    },
  })

  await prisma.usuario.upsert({
    where: { email: 'analista.b@cetox.com.pe' },
    update: {},
    create: {
      email: 'analista.b@cetox.com.pe',
      passwordHash: password,
      nombre: 'Flavia Espinoza',
      rol: 'ANALISTA',
      area: 'B',
    },
  })

  await prisma.usuario.upsert({
    where: { email: 'analista.m@cetox.com.pe' },
    update: {},
    create: {
      email: 'analista.m@cetox.com.pe',
      passwordHash: password,
      nombre: 'Pierina Verano',
      rol: 'ANALISTA',
      area: 'M',
    },
  })

  // Ensayos
  const oct = await prisma.ensayo.upsert({
    where: { codigo: 'OECD-423-OCT' },
    update: {},
    create: {
      codigo: 'OECD-423-OCT',
      nombre: 'Toxicidad oral aguda',
      prefijoInforme: 'OCT',
      area: 'B',
      metodoNorma: 'OECD 423 (2001)',
      costoUSD: 150,
      tiempoEntregaDias: 30,
      acreditadoINACAL: true,
      plantillaWord: 'PLANTILLA OCT ACREDITADO.docx',
    },
  })

  const dar = await prisma.ensayo.upsert({
    where: { codigo: 'OECD-402-DAR' },
    update: {},
    create: {
      codigo: 'OECD-402-DAR',
      nombre: 'Toxicidad dérmica aguda',
      prefijoInforme: 'DAR',
      area: 'B',
      metodoNorma: 'OECD 402 (1987)',
      costoUSD: 230,
      tiempoEntregaDias: 47,
      acreditadoINACAL: true,
      plantillaWord: 'PLANTILLA DAR ACREDITADO.docx',
    },
  })

  await prisma.ensayo.upsert({
    where: { codigo: 'OECD-403-IA' },
    update: {},
    create: {
      codigo: 'OECD-403-IA',
      nombre: 'Toxicidad inhalatoria aguda',
      prefijoInforme: 'IA',
      area: 'B',
      metodoNorma: 'OECD 403 (2009)',
      costoUSD: 200,
      tiempoEntregaDias: 25,
      acreditadoINACAL: false,
      plantillaWord: 'IA PLANTILLA.docx',
    },
  })

  const pq = await prisma.ensayo.upsert({
    where: { codigo: 'OECD-122-PQ' },
    update: {},
    create: {
      codigo: 'OECD-122-PQ',
      nombre: 'pH, acidez y alcalinidad',
      prefijoInforme: 'PQ',
      area: 'Q',
      metodoNorma: 'OECD 122 (2000)',
      costoUSD: 85,
      tiempoEntregaDias: 2,
      acreditadoINACAL: true,
      plantillaWord: 'PLANTILLA PQ.docx',
    },
  })

  await prisma.ensayo.upsert({
    where: { codigo: 'CIPAC-L-MT191-PQ' },
    update: {},
    create: {
      codigo: 'CIPAC-L-MT191-PQ',
      nombre: 'Acidez en fertilizantes',
      prefijoInforme: 'PQ',
      area: 'Q',
      metodoNorma: 'CIPAC L MT 191',
      costoUSD: 100,
      tiempoEntregaDias: 5,
      acreditadoINACAL: true,
      plantillaWord: 'PLANTILLA PQ.docx',
    },
  })

  await prisma.ensayo.upsert({
    where: { codigo: 'MTA-MB-011-MET' },
    update: {},
    create: {
      codigo: 'MTA-MB-011-MET',
      nombre: 'Plomo en sangre',
      prefijoInforme: 'MET',
      area: 'Q',
      metodoNorma: 'MTA/MB-011/R92',
      costoUSD: 120,
      tiempoEntregaDias: 7,
      acreditadoINACAL: true,
      plantillaWord: 'PLANTILLA  METALES.docx',
    },
  })

  await prisma.ensayo.upsert({
    where: { codigo: 'KS-EM' },
    update: {},
    create: {
      codigo: 'KS-EM',
      nombre: 'Enfrentamiento microbiano (Kelsey-Sykes mod.)',
      prefijoInforme: 'EM',
      area: 'M',
      metodoNorma: 'Kelsey-Sykes modificado',
      costoUSD: 430,
      tiempoEntregaDias: 30,
      acreditadoINACAL: false,
      plantillaWord: 'PLANTILA  EM.docx',
    },
  })

  await prisma.ensayo.upsert({
    where: { codigo: 'MICRO-PM' },
    update: {},
    create: {
      codigo: 'MICRO-PM',
      nombre: 'Recuento microbiológico',
      prefijoInforme: 'PM',
      area: 'M',
      metodoNorma: 'Método interno',
      costoUSD: 180,
      tiempoEntregaDias: 14,
      acreditadoINACAL: false,
      plantillaWord: 'PLANTILLA PM.docx',
    },
  })

  // Clientes
  const quimpac = await prisma.cliente.upsert({
    where: { ruc: '20330791501' },
    update: {},
    create: {
      razonSocial: 'QUIMPAC S.A.',
      ruc: '20330791501',
      direccion: 'Av. Néstor Gambetta 8583, Callao',
      contacto: 'Área de Aseguramiento de Calidad',
      modalidadPago: 'ANTICIPO_50_50',
    },
  })

  await prisma.cliente.upsert({
    where: { ruc: '20123456789' },
    update: {},
    create: {
      razonSocial: 'MEPLAB SAC',
      ruc: '20123456789',
      direccion: 'Lima',
      modalidadPago: 'CREDITO_MENSUAL',
    },
  })

  await prisma.cliente.upsert({
    where: { ruc: '10404743983' },
    update: {},
    create: {
      razonSocial: 'ACUAPET ARIHATZU',
      ruc: '10404743983',
      direccion: 'Jr. Ayacucho 550, Lima',
      modalidadPago: 'ANTICIPO_100',
    },
  })

  // Cotización aceptada de ejemplo
  const existingCot = await prisma.cotizacion.findFirst({
    where: { clienteId: quimpac.id, estado: 'ACEPTADA' },
  })

  if (!existingCot) {
    const subtotal = 150 + 85
    const igv = subtotal * 0.18
    const total = subtotal + igv

    await prisma.cotizacion.create({
      data: {
        numero: 1,
        anio: 2026,
        moneda: 'USD',
        clienteId: quimpac.id,
        estado: 'ACEPTADA',
        vigenciaHasta: addDays(new Date(), 30),
        creadoPorId: admin.id,
        subtotal,
        igv,
        total,
        observaciones: 'Cotización de ejemplo para demo',
        items: {
          create: [
            {
              ensayoId: oct.id,
              costo: 150,
              tiempoEntregaDias: 30,
            },
            {
              ensayoId: pq.id,
              costo: 85,
              tiempoEntregaDias: 2,
            },
          ],
        },
      },
    })
  }

  console.log('✅ Seed completado exitosamente')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
