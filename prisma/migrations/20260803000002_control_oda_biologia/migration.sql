-- CreateTable
CREATE TABLE "ControlOdaBiologia" (
    "id" TEXT NOT NULL,
    "formulacion" TEXT,
    "setNumero" TEXT,
    "odaNumero" TEXT,
    "prueba" TEXT,
    "entregado" BOOLEAN NOT NULL DEFAULT false,
    "fechaEntrega" TIMESTAMP(3),
    "observacion" TEXT,
    "formato" TEXT,
    "fechaRecepcion" TIMESTAMP(3),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ControlOdaBiologia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ControlOdaBiologia_setNumero_idx" ON "ControlOdaBiologia"("setNumero");
