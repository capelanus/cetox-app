-- CreateTable
CREATE TABLE "AseguramientoItem" (
    "id" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "muestra" TEXT NOT NULL,
    "ensayoId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "dias" INTEGER NOT NULL,
    "fechaEntrega" TIMESTAMP(3) NOT NULL,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AseguramientoItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AseguramientoItem" ADD CONSTRAINT "AseguramientoItem_ensayoId_fkey" FOREIGN KEY ("ensayoId") REFERENCES "Ensayo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
