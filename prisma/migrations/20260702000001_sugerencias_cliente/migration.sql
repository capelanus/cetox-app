CREATE TABLE "SugerenciaCliente" (
    "id"                 TEXT NOT NULL,
    "medioContacto"      TEXT[],
    "ratingAtencion"     TEXT,
    "ratingRapidez"      TEXT,
    "ratingInformacion"  TEXT,
    "ratingAmbiente"     TEXT,
    "ratingCumplimiento" TEXT,
    "ratingTiempoEspera" TEXT,
    "satisfecho"         BOOLEAN,
    "tuvoQuejaAntes"     BOOLEAN,
    "quejaCuando"        TEXT,
    "quejaSobre"         TEXT,
    "quejaManejo"        TEXT,
    "sugerencias"        TEXT,
    "empresa"            TEXT,
    "contacto"           TEXT,
    "fechaCliente"       TEXT,
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SugerenciaCliente_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SugerenciaCliente_createdAt_idx" ON "SugerenciaCliente"("createdAt");
