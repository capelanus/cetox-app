-- CreateTable ODAItem
CREATE TABLE "ODAItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "odaId" TEXT NOT NULL,
    "ensayoId" TEXT NOT NULL,
    "costo" REAL NOT NULL DEFAULT 0,
    "tiempoEntregaDias" INTEGER NOT NULL DEFAULT 0,
    "fechaEntregaCompromiso" DATETIME NOT NULL,
    CONSTRAINT "ODAItem_odaId_fkey" FOREIGN KEY ("odaId") REFERENCES "ODA" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ODAItem_ensayoId_fkey" FOREIGN KEY ("ensayoId") REFERENCES "Ensayo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- MigrateData: copy each ODA's ensayo into an ODAItem (1:1 for existing data)
INSERT INTO "ODAItem" ("id", "odaId", "ensayoId", "costo", "tiempoEntregaDias", "fechaEntregaCompromiso")
SELECT
    'item-' || "id",
    "id",
    "ensayoId",
    "costo",
    0,
    "fechaEntregaCompromiso"
FROM "ODA"
WHERE "ensayoId" IS NOT NULL;

-- RedefineTables: recreate ODA without ensayoId and costo
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_ODA" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "setId" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "fechaRecepcion" DATETIME,
    "fechaEntregaCompromiso" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'EMITIDA',
    "revisado" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "new_ODA_setId_fkey" FOREIGN KEY ("setId") REFERENCES "SET" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_ODA" ("id", "numero", "anio", "setId", "area", "fechaRecepcion", "fechaEntregaCompromiso", "estado", "revisado")
SELECT "id", "numero", "anio", "setId", "area", "fechaRecepcion", "fechaEntregaCompromiso", "estado", "revisado"
FROM "ODA";

DROP TABLE "ODA";
ALTER TABLE "new_ODA" RENAME TO "ODA";

CREATE UNIQUE INDEX "ODA_numero_anio_key" ON "ODA"("numero", "anio");

PRAGMA foreign_keys=ON;
