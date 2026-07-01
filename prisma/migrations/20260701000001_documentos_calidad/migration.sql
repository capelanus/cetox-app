CREATE TABLE IF NOT EXISTS "DocumentoCalidad" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "nombre"      TEXT NOT NULL,
  "archivoUrl"  TEXT NOT NULL,
  "categoria"   TEXT NOT NULL,
  "subidoPorId" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DocumentoCalidad_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DocumentoCalidad_subidoPorId_fkey"
    FOREIGN KEY ("subidoPorId") REFERENCES "Usuario"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "DocumentoCalidad_categoria_idx" ON "DocumentoCalidad"("categoria");
