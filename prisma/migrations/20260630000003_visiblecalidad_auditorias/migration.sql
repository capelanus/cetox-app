-- Add visibleCalidad to DocumentoEmpleado
ALTER TABLE "DocumentoEmpleado" ADD COLUMN IF NOT EXISTS "visibleCalidad" BOOLEAN NOT NULL DEFAULT false;

-- Competencias técnicas y fichas de ingreso son siempre visibles para calidad
UPDATE "DocumentoEmpleado" SET "visibleCalidad" = true
WHERE "tipo" IN ('Competencia técnica', 'Ficha de ingreso');

-- Create Auditoria table
CREATE TABLE IF NOT EXISTS "Auditoria" (
  "id"          TEXT NOT NULL,
  "codigo"      TEXT NOT NULL,
  "fecha"       TIMESTAMP(3) NOT NULL,
  "descripcion" TEXT,
  "creadoPorId" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Auditoria_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Auditoria_codigo_key" ON "Auditoria"("codigo");

-- Create AuditoriaDocumento table
CREATE TABLE IF NOT EXISTS "AuditoriaDocumento" (
  "id"          TEXT NOT NULL,
  "auditoriaId" TEXT NOT NULL,
  "nombre"      TEXT NOT NULL,
  "archivoUrl"  TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditoriaDocumento_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuditoriaDocumento_auditoriaId_fkey" FOREIGN KEY ("auditoriaId") REFERENCES "Auditoria"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
