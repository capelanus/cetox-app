-- CreateTable
CREATE TABLE "CentroCosto" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "departamento" TEXT,
    "responsableId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CentroCosto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartidaPresupuestal" (
    "id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "centroCostoId" TEXT,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartidaPresupuestal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineaPresupuesto" (
    "id" TEXT NOT NULL,
    "partidaId" TEXT NOT NULL,
    "periodo" INTEGER NOT NULL,
    "planificado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ejecutado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LineaPresupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroRentabilidad" (
    "id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "periodo" INTEGER NOT NULL,
    "clienteId" TEXT,
    "clienteNombre" TEXT NOT NULL,
    "servicio" TEXT NOT NULL,
    "ingreso" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoDirecto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoIndirecto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistroRentabilidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoFinanciero" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT,
    "url" TEXT NOT NULL,
    "tamano" INTEGER,
    "centroCostoId" TEXT,
    "anio" INTEGER,
    "periodo" INTEGER,
    "subidoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoFinanciero_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartidaPresupuestal_anio_tipo_idx" ON "PartidaPresupuestal"("anio", "tipo");

-- CreateIndex
CREATE INDEX "PartidaPresupuestal_centroCostoId_idx" ON "PartidaPresupuestal"("centroCostoId");

-- CreateIndex
CREATE UNIQUE INDEX "LineaPresupuesto_partidaId_periodo_key" ON "LineaPresupuesto"("partidaId", "periodo");

-- CreateIndex
CREATE INDEX "RegistroRentabilidad_anio_idx" ON "RegistroRentabilidad"("anio");

-- CreateIndex
CREATE INDEX "DocumentoFinanciero_createdAt_idx" ON "DocumentoFinanciero"("createdAt");

-- AddForeignKey
ALTER TABLE "PartidaPresupuestal" ADD CONSTRAINT "PartidaPresupuestal_centroCostoId_fkey" FOREIGN KEY ("centroCostoId") REFERENCES "CentroCosto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaPresupuesto" ADD CONSTRAINT "LineaPresupuesto_partidaId_fkey" FOREIGN KEY ("partidaId") REFERENCES "PartidaPresupuestal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
