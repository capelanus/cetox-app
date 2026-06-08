
-- DropForeignKey
ALTER TABLE "MensajeDM" DROP CONSTRAINT "MensajeDM_autorId_fkey";

-- AlterTable
ALTER TABLE "Empleado" ADD COLUMN     "usuarioId" TEXT;

-- AlterTable
ALTER TABLE "SolicitudVacaciones" ADD COLUMN     "aprobadoPorId" TEXT,
ADD COLUMN     "comunicadoPorId" TEXT,
ADD COLUMN     "fechaComunicacion" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UsuarioAprobadorVacaciones" (
    "id" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "aprobadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsuarioAprobadorVacaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UsuarioAprobadorVacaciones_aprobadorId_idx" ON "UsuarioAprobadorVacaciones"("aprobadorId");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioAprobadorVacaciones_solicitanteId_aprobadorId_key" ON "UsuarioAprobadorVacaciones"("solicitanteId", "aprobadorId");

-- CreateIndex
CREATE UNIQUE INDEX "Empleado_usuarioId_key" ON "Empleado"("usuarioId");

-- AddForeignKey
ALTER TABLE "UsuarioAprobadorVacaciones" ADD CONSTRAINT "UsuarioAprobadorVacaciones_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioAprobadorVacaciones" ADD CONSTRAINT "UsuarioAprobadorVacaciones_aprobadorId_fkey" FOREIGN KEY ("aprobadorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensajeDM" ADD CONSTRAINT "MensajeDM_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudVacaciones" ADD CONSTRAINT "SolicitudVacaciones_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudVacaciones" ADD CONSTRAINT "SolicitudVacaciones_comunicadoPorId_fkey" FOREIGN KEY ("comunicadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

