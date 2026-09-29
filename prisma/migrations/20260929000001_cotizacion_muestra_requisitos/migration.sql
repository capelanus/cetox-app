-- AlterTable
ALTER TABLE "Cotizacion" ADD COLUMN "cantidadMuestra" TEXT;
ALTER TABLE "Cotizacion" ADD COLUMN "requisitos" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Las cotizaciones existentes se imprimían siempre con los cinco requisitos;
-- se les deja marcados los cinco para que su PDF no cambie.
UPDATE "Cotizacion"
SET "requisitos" = ARRAY['MUESTRA_CERRADA','NOMBRE_COMERCIAL','INGREDIENTE_ACTIVO','TIPO_FORMULACION','FECHAS_LOTE']::TEXT[];
