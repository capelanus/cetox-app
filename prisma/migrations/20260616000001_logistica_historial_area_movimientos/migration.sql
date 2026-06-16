-- 1. Tabla junction OC ↔ CotizacionProveedor (M2M)
CREATE TABLE "OrdenCompraCotizacion" (
    "ordenCompraId" TEXT NOT NULL,
    "cotizacionProveedorId" TEXT NOT NULL,
    CONSTRAINT "OrdenCompraCotizacion_pkey" PRIMARY KEY ("ordenCompraId", "cotizacionProveedorId")
);

-- Migrar datos existentes de cotizacionProveedorId a la tabla junction
INSERT INTO "OrdenCompraCotizacion" ("ordenCompraId", "cotizacionProveedorId")
SELECT "id", "cotizacionProveedorId"
FROM "OrdenCompra"
WHERE "cotizacionProveedorId" IS NOT NULL;

-- Eliminar FK y columna antigua
ALTER TABLE "OrdenCompra" DROP CONSTRAINT IF EXISTS "OrdenCompra_cotizacionProveedorId_fkey";
ALTER TABLE "OrdenCompra" DROP COLUMN IF EXISTS "cotizacionProveedorId";

-- FKs de la tabla junction
ALTER TABLE "OrdenCompraCotizacion"
    ADD CONSTRAINT "OrdenCompraCotizacion_ordenCompraId_fkey"
    FOREIGN KEY ("ordenCompraId") REFERENCES "OrdenCompra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrdenCompraCotizacion"
    ADD CONSTRAINT "OrdenCompraCotizacion_cotizacionProveedorId_fkey"
    FOREIGN KEY ("cotizacionProveedorId") REFERENCES "CotizacionProveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 2. Historial de modificaciones de OC
CREATE TABLE "OrdenCompraHistorial" (
    "id" TEXT NOT NULL,
    "ordenCompraId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrdenCompraHistorial_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "OrdenCompraHistorial"
    ADD CONSTRAINT "OrdenCompraHistorial_ordenCompraId_fkey"
    FOREIGN KEY ("ordenCompraId") REFERENCES "OrdenCompra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrdenCompraHistorial"
    ADD CONSTRAINT "OrdenCompraHistorial_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3. Campo área destino en Recepcion
ALTER TABLE "Recepcion" ADD COLUMN IF NOT EXISTS "areaDestino" TEXT;

-- 4. Historial de movimientos de inventario
CREATE TABLE "InventarioMovimiento" (
    "id" TEXT NOT NULL,
    "inventarioItemId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "stockAnterior" DOUBLE PRECISION NOT NULL,
    "stockNuevo" DOUBLE PRECISION NOT NULL,
    "areaDestino" TEXT,
    "descripcion" TEXT,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventarioMovimiento_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "InventarioMovimiento"
    ADD CONSTRAINT "InventarioMovimiento_inventarioItemId_fkey"
    FOREIGN KEY ("inventarioItemId") REFERENCES "InventarioItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InventarioMovimiento"
    ADD CONSTRAINT "InventarioMovimiento_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
