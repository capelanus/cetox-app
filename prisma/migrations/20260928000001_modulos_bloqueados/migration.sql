-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN "modulosBloqueados" TEXT[] DEFAULT ARRAY[]::TEXT[];
