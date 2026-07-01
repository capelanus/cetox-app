CREATE TABLE IF NOT EXISTS "DocumentoCalidadAcceso" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "documentoId"  TEXT NOT NULL,
  "departamento" TEXT NOT NULL,

  CONSTRAINT "DocumentoCalidadAcceso_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DocumentoCalidadAcceso_documentoId_departamento_key"
    UNIQUE ("documentoId", "departamento"),
  CONSTRAINT "DocumentoCalidadAcceso_documentoId_fkey"
    FOREIGN KEY ("documentoId") REFERENCES "DocumentoCalidad"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "DocumentoCalidadAcceso_departamento_idx"
  ON "DocumentoCalidadAcceso"("departamento");
