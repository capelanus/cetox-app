-- AlterTable
ALTER TABLE "Cotizacion" ADD COLUMN "revisadoPorId" TEXT;
ALTER TABLE "Cotizacion" ADD COLUMN "fechaRevision" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_revisadoPorId_fkey" FOREIGN KEY ("revisadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
