-- CreateTable
CREATE TABLE "CotizacionMuestra" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cotizacionId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CotizacionMuestra_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CotizacionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cotizacionId" TEXT NOT NULL,
    "muestraId" TEXT,
    "ensayoId" TEXT NOT NULL,
    "costo" REAL NOT NULL,
    "tiempoEntregaDias" INTEGER NOT NULL,
    CONSTRAINT "CotizacionItem_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CotizacionItem_muestraId_fkey" FOREIGN KEY ("muestraId") REFERENCES "CotizacionMuestra" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CotizacionItem_ensayoId_fkey" FOREIGN KEY ("ensayoId") REFERENCES "Ensayo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CotizacionItem" ("costo", "cotizacionId", "ensayoId", "id", "tiempoEntregaDias") SELECT "costo", "cotizacionId", "ensayoId", "id", "tiempoEntregaDias" FROM "CotizacionItem";
DROP TABLE "CotizacionItem";
ALTER TABLE "new_CotizacionItem" RENAME TO "CotizacionItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
