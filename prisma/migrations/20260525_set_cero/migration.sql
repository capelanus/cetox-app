-- Make cotizacionId nullable in SET
ALTER TABLE "SET" ALTER COLUMN "cotizacionId" DROP NOT NULL;

-- Add motivoCero field to SET
ALTER TABLE "SET" ADD COLUMN IF NOT EXISTS "motivoCero" TEXT;
