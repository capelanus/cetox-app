-- AlterTable: clasificación OPEX/CAPEX en partidas presupuestales
ALTER TABLE "PartidaPresupuestal" ADD COLUMN "clasificacion" TEXT;

-- CreateTable: tareas estilo Asana dentro de proyectos estratégicos
CREATE TABLE "TareaProyecto" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "responsableId" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'POR_HACER',
    "prioridad" TEXT,
    "fechaVencimiento" TIMESTAMP(3),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TareaProyecto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TareaProyecto_proyectoId_idx" ON "TareaProyecto"("proyectoId");

-- AddForeignKey
ALTER TABLE "TareaProyecto" ADD CONSTRAINT "TareaProyecto_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "ProyectoEstrategico"("id") ON DELETE CASCADE ON UPDATE CASCADE;
