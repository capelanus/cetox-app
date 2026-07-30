-- AlterTable: marca de jefe/subdirector de laboratorio
ALTER TABLE "Usuario" ADD COLUMN "esJefeLab" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: científico asignado a la ODA por el jefe de laboratorio
ALTER TABLE "ODA" ADD COLUMN "asignadoAId" TEXT;

-- CreateIndex
CREATE INDEX "ODA_asignadoAId_idx" ON "ODA"("asignadoAId");
