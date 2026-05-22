-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "area" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "contacto" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "modalidadPago" TEXT NOT NULL DEFAULT 'ANTICIPO_50_50',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ensayo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "prefijoInforme" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "metodoNorma" TEXT NOT NULL,
    "costoUSD" DOUBLE PRECISION,
    "costoPEN" DOUBLE PRECISION,
    "tiempoEntregaDias" INTEGER NOT NULL,
    "acreditadoINACAL" BOOLEAN NOT NULL DEFAULT false,
    "tercerizado" BOOLEAN NOT NULL DEFAULT false,
    "tipoMuestra" TEXT,
    "plantillaWord" TEXT,
    "alias" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Ensayo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cotizacion" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "sufijo" TEXT NOT NULL DEFAULT '',
    "cotizacionPadre" TEXT,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigenciaHasta" TIMESTAMP(3) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "clienteId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "observaciones" TEXT,
    "contactoNombre" TEXT,
    "contactoEmail" TEXT,
    "contactoTelefono" TEXT,
    "contactoRuc" TEXT,
    "formaContacto" TEXT,
    "fechaContacto" TEXT,
    "horaContacto" TEXT,
    "paisOrigen" TEXT,
    "creadoPorId" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "igv" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CotizacionMuestra" (
    "id" TEXT NOT NULL,
    "cotizacionId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CotizacionMuestra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CotizacionItem" (
    "id" TEXT NOT NULL,
    "cotizacionId" TEXT NOT NULL,
    "muestraId" TEXT,
    "ensayoId" TEXT NOT NULL,
    "costo" DOUBLE PRECISION NOT NULL,
    "tiempoEntregaDias" INTEGER NOT NULL,

    CONSTRAINT "CotizacionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SET" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "cotizacionId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "fechaIngreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nombreComercial" TEXT NOT NULL,
    "ingredienteActivo" TEXT,
    "formulacion" TEXT,
    "numeroLote" TEXT,
    "fechaFabricacion" TIMESTAMP(3),
    "fechaVencimiento" TIMESTAMP(3),
    "pesoVolumen" TEXT,
    "tipoMuestra" TEXT,
    "codigoMuestra" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "observaciones" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'EMITIDA',
    "creadoPorId" TEXT NOT NULL,
    "nombrePaciente" TEXT,
    "ingresoMuestra" TEXT,
    "ingresoMuestraOtro" TEXT,
    "numeroMuestras" INTEGER,
    "devolucionMuestra" TEXT,
    "condicionesAmbientales" TEXT,
    "procedenciaDescripcion" TEXT,
    "otraIndicacion" TEXT,
    "tipoEnvase" TEXT,
    "materialEnvase" TEXT,
    "etiquetaEnvase" TEXT,
    "seguridadEnvase" TEXT,

    CONSTRAINT "SET_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ODA" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "setId" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "fechaRecepcion" TIMESTAMP(3),
    "fechaEntregaCompromiso" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'EMITIDA',
    "revisado" BOOLEAN NOT NULL DEFAULT false,
    "edadPaciente" TEXT,

    CONSTRAINT "ODA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ODAItem" (
    "id" TEXT NOT NULL,
    "odaId" TEXT NOT NULL,
    "ensayoId" TEXT NOT NULL,
    "costo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tiempoEntregaDias" INTEGER NOT NULL DEFAULT 0,
    "fechaEntregaCompromiso" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ODAItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Informe" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "prefijo" TEXT NOT NULL,
    "odaId" TEXT NOT NULL,
    "analistaId" TEXT NOT NULL,
    "resultadoTexto" TEXT,
    "resultadoImagenes" TEXT NOT NULL DEFAULT '[]',
    "archivoDocx" TEXT,
    "archivoPdf" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "firmaCalidad" TIMESTAMP(3),
    "firmaGerencia" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Informe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificado" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "informeId" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "qrUrl" TEXT NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CargoEntrega" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "setId" TEXT NOT NULL,
    "recibidoPor" TEXT,
    "dniRecibe" TEXT,
    "fechaRecepcion" TIMESTAMP(3),
    "firmaUrl" TEXT,

    CONSTRAINT "CargoEntrega_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_ruc_key" ON "Cliente"("ruc");

-- CreateIndex
CREATE UNIQUE INDEX "Ensayo_codigo_key" ON "Ensayo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Cotizacion_numero_anio_sufijo_key" ON "Cotizacion"("numero", "anio", "sufijo");

-- CreateIndex
CREATE UNIQUE INDEX "SET_codigoMuestra_key" ON "SET"("codigoMuestra");

-- CreateIndex
CREATE UNIQUE INDEX "SET_numero_anio_key" ON "SET"("numero", "anio");

-- CreateIndex
CREATE UNIQUE INDEX "ODA_numero_anio_key" ON "ODA"("numero", "anio");

-- CreateIndex
CREATE UNIQUE INDEX "Informe_odaId_key" ON "Informe"("odaId");

-- CreateIndex
CREATE UNIQUE INDEX "Informe_numero_anio_prefijo_key" ON "Informe"("numero", "anio", "prefijo");

-- CreateIndex
CREATE UNIQUE INDEX "Certificado_codigo_key" ON "Certificado"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Certificado_informeId_key" ON "Certificado"("informeId");

-- CreateIndex
CREATE UNIQUE INDEX "CargoEntrega_setId_key" ON "CargoEntrega"("setId");

-- CreateIndex
CREATE UNIQUE INDEX "CargoEntrega_numero_anio_key" ON "CargoEntrega"("numero", "anio");

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotizacionMuestra" ADD CONSTRAINT "CotizacionMuestra_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotizacionItem" ADD CONSTRAINT "CotizacionItem_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotizacionItem" ADD CONSTRAINT "CotizacionItem_muestraId_fkey" FOREIGN KEY ("muestraId") REFERENCES "CotizacionMuestra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotizacionItem" ADD CONSTRAINT "CotizacionItem_ensayoId_fkey" FOREIGN KEY ("ensayoId") REFERENCES "Ensayo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SET" ADD CONSTRAINT "SET_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SET" ADD CONSTRAINT "SET_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SET" ADD CONSTRAINT "SET_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ODA" ADD CONSTRAINT "ODA_setId_fkey" FOREIGN KEY ("setId") REFERENCES "SET"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ODAItem" ADD CONSTRAINT "ODAItem_odaId_fkey" FOREIGN KEY ("odaId") REFERENCES "ODA"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ODAItem" ADD CONSTRAINT "ODAItem_ensayoId_fkey" FOREIGN KEY ("ensayoId") REFERENCES "Ensayo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Informe" ADD CONSTRAINT "Informe_odaId_fkey" FOREIGN KEY ("odaId") REFERENCES "ODA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Informe" ADD CONSTRAINT "Informe_analistaId_fkey" FOREIGN KEY ("analistaId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificado" ADD CONSTRAINT "Certificado_informeId_fkey" FOREIGN KEY ("informeId") REFERENCES "Informe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargoEntrega" ADD CONSTRAINT "CargoEntrega_setId_fkey" FOREIGN KEY ("setId") REFERENCES "SET"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

