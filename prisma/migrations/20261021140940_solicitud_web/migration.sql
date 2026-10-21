-- CreateTable
CREATE TABLE "SolicitudWeb" (
    "id" TEXT NOT NULL,
    "formulario" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "empresa" TEXT,
    "correo" TEXT NOT NULL,
    "telefono" TEXT,
    "ubicacion" TEXT,
    "sector" TEXT,
    "matriz" TEXT,
    "analisis" TEXT,
    "objetivo" TEXT,
    "norma" TEXT,
    "cantidad" TEXT,
    "acreditado" TEXT,
    "fechaRequerida" TEXT,
    "detalle" TEXT,
    "mensaje" TEXT,
    "pagina" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'NUEVA',
    "notaInterna" TEXT,
    "atendidoPor" TEXT,
    "fechaAtencion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolicitudWeb_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SolicitudWeb_createdAt_idx" ON "SolicitudWeb"("createdAt");

-- CreateIndex
CREATE INDEX "SolicitudWeb_estado_idx" ON "SolicitudWeb"("estado");
