-- CreateTable
CREATE TABLE "PlanEstrategico" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "vision" TEXT,
    "mision" TEXT,
    "anioInicio" INTEGER NOT NULL,
    "anioFin" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanEstrategico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObjetivoEstrategico" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "departamento" TEXT,
    "responsableId" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObjetivoEstrategico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccionEstrategica" (
    "id" TEXT NOT NULL,
    "objetivoId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "departamento" TEXT,
    "responsableId" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccionEstrategica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActividadOperativa" (
    "id" TEXT NOT NULL,
    "accionId" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "codigo" TEXT,
    "nombre" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "responsableId" TEXT,
    "unidadMedida" TEXT,
    "metaAnual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "presupuesto" DOUBLE PRECISION,
    "estado" TEXT NOT NULL DEFAULT 'EN_CURSO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActividadOperativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeguimientoActividad" (
    "id" TEXT NOT NULL,
    "actividadId" TEXT NOT NULL,
    "periodo" INTEGER NOT NULL,
    "metaProgramada" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ejecutado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeguimientoActividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Indicador" (
    "id" TEXT NOT NULL,
    "objetivoId" TEXT,
    "accionId" TEXT,
    "nombre" TEXT NOT NULL,
    "formula" TEXT,
    "unidad" TEXT,
    "sentido" TEXT NOT NULL DEFAULT 'ASCENDENTE',
    "frecuencia" TEXT NOT NULL DEFAULT 'MENSUAL',
    "lineaBase" DOUBLE PRECISION,
    "meta" DOUBLE PRECISION,
    "departamento" TEXT,
    "responsableId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Indicador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicionIndicador" (
    "id" TEXT NOT NULL,
    "indicadorId" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "periodo" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicionIndicador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Riesgo" (
    "id" TEXT NOT NULL,
    "objetivoId" TEXT,
    "codigo" TEXT,
    "descripcion" TEXT NOT NULL,
    "causa" TEXT,
    "categoria" TEXT,
    "probabilidad" INTEGER NOT NULL DEFAULT 1,
    "impacto" INTEGER NOT NULL DEFAULT 1,
    "departamento" TEXT,
    "responsableId" TEXT,
    "planMitigacion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'IDENTIFICADO',
    "fechaRevision" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Riesgo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProyectoEstrategico" (
    "id" TEXT NOT NULL,
    "objetivoId" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "sponsorId" TEXT,
    "gerenteId" TEXT,
    "departamento" TEXT,
    "fechaInicioPlan" TIMESTAMP(3),
    "fechaFinPlan" TIMESTAMP(3),
    "fechaInicioReal" TIMESTAMP(3),
    "fechaFinReal" TIMESTAMP(3),
    "presupuesto" DOUBLE PRECISION,
    "avance" INTEGER NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'PLANIFICADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProyectoEstrategico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HitoProyecto" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fechaPlan" TIMESTAMP(3),
    "fechaReal" TIMESTAMP(3),
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HitoProyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccionMejora" (
    "id" TEXT NOT NULL,
    "codigo" TEXT,
    "origen" TEXT NOT NULL,
    "auditoriaId" TEXT,
    "descripcion" TEXT NOT NULL,
    "causaRaiz" TEXT,
    "accion" TEXT,
    "departamento" TEXT,
    "responsableId" TEXT,
    "fechaCompromiso" TIMESTAMP(3),
    "fechaCierre" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'ABIERTA',
    "eficaciaVerificada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccionMejora_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ObjetivoEstrategico_planId_idx" ON "ObjetivoEstrategico"("planId");

-- CreateIndex
CREATE INDEX "AccionEstrategica_objetivoId_idx" ON "AccionEstrategica"("objetivoId");

-- CreateIndex
CREATE INDEX "ActividadOperativa_accionId_idx" ON "ActividadOperativa"("accionId");

-- CreateIndex
CREATE INDEX "ActividadOperativa_anio_departamento_idx" ON "ActividadOperativa"("anio", "departamento");

-- CreateIndex
CREATE UNIQUE INDEX "SeguimientoActividad_actividadId_periodo_key" ON "SeguimientoActividad"("actividadId", "periodo");

-- CreateIndex
CREATE INDEX "Indicador_objetivoId_idx" ON "Indicador"("objetivoId");

-- CreateIndex
CREATE UNIQUE INDEX "MedicionIndicador_indicadorId_anio_periodo_key" ON "MedicionIndicador"("indicadorId", "anio", "periodo");

-- CreateIndex
CREATE INDEX "Riesgo_estado_idx" ON "Riesgo"("estado");

-- CreateIndex
CREATE INDEX "ProyectoEstrategico_estado_idx" ON "ProyectoEstrategico"("estado");

-- CreateIndex
CREATE INDEX "HitoProyecto_proyectoId_idx" ON "HitoProyecto"("proyectoId");

-- CreateIndex
CREATE INDEX "AccionMejora_estado_idx" ON "AccionMejora"("estado");

-- AddForeignKey
ALTER TABLE "ObjetivoEstrategico" ADD CONSTRAINT "ObjetivoEstrategico_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PlanEstrategico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccionEstrategica" ADD CONSTRAINT "AccionEstrategica_objetivoId_fkey" FOREIGN KEY ("objetivoId") REFERENCES "ObjetivoEstrategico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActividadOperativa" ADD CONSTRAINT "ActividadOperativa_accionId_fkey" FOREIGN KEY ("accionId") REFERENCES "AccionEstrategica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeguimientoActividad" ADD CONSTRAINT "SeguimientoActividad_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "ActividadOperativa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Indicador" ADD CONSTRAINT "Indicador_objetivoId_fkey" FOREIGN KEY ("objetivoId") REFERENCES "ObjetivoEstrategico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Indicador" ADD CONSTRAINT "Indicador_accionId_fkey" FOREIGN KEY ("accionId") REFERENCES "AccionEstrategica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicionIndicador" ADD CONSTRAINT "MedicionIndicador_indicadorId_fkey" FOREIGN KEY ("indicadorId") REFERENCES "Indicador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Riesgo" ADD CONSTRAINT "Riesgo_objetivoId_fkey" FOREIGN KEY ("objetivoId") REFERENCES "ObjetivoEstrategico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProyectoEstrategico" ADD CONSTRAINT "ProyectoEstrategico_objetivoId_fkey" FOREIGN KEY ("objetivoId") REFERENCES "ObjetivoEstrategico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HitoProyecto" ADD CONSTRAINT "HitoProyecto_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "ProyectoEstrategico"("id") ON DELETE CASCADE ON UPDATE CASCADE;
