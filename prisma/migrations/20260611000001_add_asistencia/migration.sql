-- CreateTable
CREATE TABLE "Asistencia" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT,
    "zkUserId" TEXT NOT NULL,
    "zkNombre" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "tipo" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asistencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asistencia_zkUserId_timestamp_key" ON "Asistencia"("zkUserId", "timestamp");

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE SET NULL ON UPDATE CASCADE;
