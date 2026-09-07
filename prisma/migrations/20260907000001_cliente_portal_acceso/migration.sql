-- Portal del cliente: acceso externo de solo lectura a sus muestras/informes
ALTER TABLE "Cliente" ADD COLUMN "portalPasswordHash" TEXT;
ALTER TABLE "Cliente" ADD COLUMN "portalActivo" BOOLEAN NOT NULL DEFAULT false;
