-- AlterTable
ALTER TABLE "Ensayo" ADD COLUMN "alias" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Cotizacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "sufijo" TEXT NOT NULL DEFAULT '',
    "cotizacionPadre" TEXT,
    "fechaEmision" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigenciaHasta" DATETIME NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "clienteId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "observaciones" TEXT,
    "contactoNombre" TEXT,
    "contactoEmail" TEXT,
    "contactoTelefono" TEXT,
    "formaContacto" TEXT,
    "horaContacto" TEXT,
    "paisOrigen" TEXT,
    "creadoPorId" TEXT NOT NULL,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "igv" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "Cotizacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cotizacion_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Cotizacion" ("anio", "clienteId", "cotizacionPadre", "creadoPorId", "estado", "fechaEmision", "id", "igv", "moneda", "numero", "observaciones", "subtotal", "total", "vigenciaHasta") SELECT "anio", "clienteId", "cotizacionPadre", "creadoPorId", "estado", "fechaEmision", "id", "igv", "moneda", "numero", "observaciones", "subtotal", "total", "vigenciaHasta" FROM "Cotizacion";
DROP TABLE "Cotizacion";
ALTER TABLE "new_Cotizacion" RENAME TO "Cotizacion";
CREATE UNIQUE INDEX "Cotizacion_numero_anio_sufijo_key" ON "Cotizacion"("numero", "anio", "sufijo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
