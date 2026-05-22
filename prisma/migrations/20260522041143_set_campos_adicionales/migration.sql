-- AlterTable
ALTER TABLE "SET" ADD COLUMN "condicionesAmbientales" TEXT;
ALTER TABLE "SET" ADD COLUMN "devolucionMuestra" TEXT;
ALTER TABLE "SET" ADD COLUMN "etiquetaEnvase" TEXT;
ALTER TABLE "SET" ADD COLUMN "ingresoMuestra" TEXT;
ALTER TABLE "SET" ADD COLUMN "ingresoMuestraOtro" TEXT;
ALTER TABLE "SET" ADD COLUMN "materialEnvase" TEXT;
ALTER TABLE "SET" ADD COLUMN "nombrePaciente" TEXT;
ALTER TABLE "SET" ADD COLUMN "numeroMuestras" INTEGER;
ALTER TABLE "SET" ADD COLUMN "otraIndicacion" TEXT;
ALTER TABLE "SET" ADD COLUMN "procedenciaDescripcion" TEXT;
ALTER TABLE "SET" ADD COLUMN "seguridadEnvase" TEXT;
ALTER TABLE "SET" ADD COLUMN "tipoEnvase" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ODA" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "setId" TEXT NOT NULL,
    "ensayoId" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "costo" REAL NOT NULL DEFAULT 0,
    "fechaRecepcion" DATETIME,
    "fechaEntregaCompromiso" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'EMITIDA',
    "revisado" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ODA_setId_fkey" FOREIGN KEY ("setId") REFERENCES "SET" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ODA_ensayoId_fkey" FOREIGN KEY ("ensayoId") REFERENCES "Ensayo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ODA" ("anio", "area", "ensayoId", "estado", "fechaEntregaCompromiso", "fechaRecepcion", "id", "numero", "setId") SELECT "anio", "area", "ensayoId", "estado", "fechaEntregaCompromiso", "fechaRecepcion", "id", "numero", "setId" FROM "ODA";
DROP TABLE "ODA";
ALTER TABLE "new_ODA" RENAME TO "ODA";
CREATE UNIQUE INDEX "ODA_numero_anio_key" ON "ODA"("numero", "anio");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
