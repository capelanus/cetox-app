-- CreateTable
CREATE TABLE "CapacitacionNota" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "actividad" TEXT NOT NULL,
    "aciertos" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "nota" DOUBLE PRECISION NOT NULL,
    "respuestas" TEXT[],
    "intentos" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapacitacionNota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CapacitacionNota_usuarioId_actividad_key" ON "CapacitacionNota"("usuarioId", "actividad");

-- AddForeignKey
ALTER TABLE "CapacitacionNota" ADD CONSTRAINT "CapacitacionNota_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
