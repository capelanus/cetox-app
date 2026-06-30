-- Add facturaOcUrl to OrdenCompra (invoice attachment for the whole OC)
ALTER TABLE "OrdenCompra" ADD COLUMN IF NOT EXISTS "facturaOcUrl" TEXT;

-- Add facturaUrl to OrdenCompraItem (per-item invoice attachment)
ALTER TABLE "OrdenCompraItem" ADD COLUMN IF NOT EXISTS "facturaUrl" TEXT;
