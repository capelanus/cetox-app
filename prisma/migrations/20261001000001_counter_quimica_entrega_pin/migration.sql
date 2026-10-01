-- AlterTable: PIN de firma para la tablet del counter
ALTER TABLE "Usuario" ADD COLUMN "pinHash" TEXT;

-- AlterTable: Registro 1 (entrega de muestras al laboratorio)
ALTER TABLE "ODA" ADD COLUMN "fechaEntregaLab" TIMESTAMP(3);
ALTER TABLE "ODA" ADD COLUMN "entregadaPorId" TEXT;
ALTER TABLE "ODA" ADD COLUMN "recibidaPorId" TEXT;
