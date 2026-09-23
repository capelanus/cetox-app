-- AlterTable
ALTER TABLE "OrdenCompra" ADD COLUMN "observacionesSeguimiento" TEXT;

-- AlterTable
ALTER TABLE "OrdenCompraItem" ADD COLUMN "fechaEntregado" TIMESTAMP(3);
ALTER TABLE "OrdenCompraItem" ADD COLUMN "fechaProgramada" TIMESTAMP(3);
ALTER TABLE "OrdenCompraItem" ADD COLUMN "fechaRealizada" TIMESTAMP(3);
ALTER TABLE "OrdenCompraItem" ADD COLUMN "observaciones" TEXT;
