
-- CreateTable (missing from prior migration)
CREATE TABLE IF NOT EXISTS "ConversacionDM" (
    "id" TEXT NOT NULL,
    "usuarioAId" TEXT NOT NULL,
    "usuarioBId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversacionDM_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ConversacionDM_usuarioAId_usuarioBId_key" ON "ConversacionDM"("usuarioAId", "usuarioBId");

ALTER TABLE "ConversacionDM" ADD CONSTRAINT "ConversacionDM_usuarioAId_fkey" FOREIGN KEY ("usuarioAId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversacionDM" ADD CONSTRAINT "ConversacionDM_usuarioBId_fkey" FOREIGN KEY ("usuarioBId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "MensajeDM" (
    "id" TEXT NOT NULL,
    "conversacionId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "archivoUrl" TEXT,
    "archivoNombre" TEXT,
    "archivoTipo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MensajeDM_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MensajeDM" ADD CONSTRAINT "MensajeDM_conversacionId_fkey" FOREIGN KEY ("conversacionId") REFERENCES "ConversacionDM"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MensajeDM" ADD CONSTRAINT "MensajeDM_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropForeignKey (re-create constraint after table exists)
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

