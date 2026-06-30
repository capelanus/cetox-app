-- Add comprobantePagoUrl to OrdenCompra (payment receipt upload by calidad)
ALTER TABLE "OrdenCompra" ADD COLUMN IF NOT EXISTS "comprobantePagoUrl" TEXT;
