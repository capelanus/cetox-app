-- Cotizaciones ya vinculadas a SETs o facturas → APROBADA
UPDATE "Cotizacion" c
SET "estado" = 'APROBADA'
WHERE "estado" = 'ACEPTADA'
  AND (
    EXISTS (SELECT 1 FROM "SET" s WHERE s."cotizacionId" = c.id)
    OR EXISTS (SELECT 1 FROM "FacturaCliente" f WHERE f."cotizacionId" = c.id AND f."estado" != 'ANULADA')
  );

-- Cotizaciones solo revisadas por Calidad pero aún sin SET/factura → REVISADO
UPDATE "Cotizacion"
SET "estado" = 'REVISADO'
WHERE "estado" = 'ACEPTADA';
