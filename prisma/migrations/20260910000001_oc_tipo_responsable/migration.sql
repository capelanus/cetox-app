-- AlterTable
ALTER TABLE "OrdenCompra" ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'PRODUCTO',
ADD COLUMN     "responsableActualId" TEXT;

-- AddForeignKey
ALTER TABLE "OrdenCompra" ADD CONSTRAINT "OrdenCompra_responsableActualId_fkey" FOREIGN KEY ("responsableActualId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
