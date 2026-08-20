-- AlterTable: hasta 3 contactos / correos / teléfonos por cotización
ALTER TABLE "Cotizacion" ADD COLUMN "contactoNombre2" TEXT;
ALTER TABLE "Cotizacion" ADD COLUMN "contactoNombre3" TEXT;
ALTER TABLE "Cotizacion" ADD COLUMN "contactoEmail2" TEXT;
ALTER TABLE "Cotizacion" ADD COLUMN "contactoEmail3" TEXT;
ALTER TABLE "Cotizacion" ADD COLUMN "contactoTelefono2" TEXT;
ALTER TABLE "Cotizacion" ADD COLUMN "contactoTelefono3" TEXT;
