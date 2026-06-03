import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

try {
  const result = await prisma.informe.updateMany({
    where: { estado: 'FIRMADO' },
    data: { estado: 'EN_FIRMA_GERENCIA' }
  });
  console.log(`Updated ${result.count} informes to EN_FIRMA_GERENCIA`);
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
