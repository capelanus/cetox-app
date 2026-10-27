-- CreateTable
CREATE TABLE "BlogArticulo" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "revisorNombre" TEXT,
    "revisorCargo" TEXT,
    "revisorColegiatura" TEXT,
    "fechaRevision" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "notaInterna" TEXT,
    "actualizadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogArticulo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlogArticulo_slug_key" ON "BlogArticulo"("slug");

-- CreateIndex
CREATE INDEX "BlogArticulo_estado_idx" ON "BlogArticulo"("estado");
