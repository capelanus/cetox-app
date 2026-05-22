-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "area" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "razonSocial" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "contacto" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "modalidadPago" TEXT NOT NULL DEFAULT 'ANTICIPO_50_50',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Ensayo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "prefijoInforme" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "metodoNorma" TEXT NOT NULL,
    "costoUSD" REAL,
    "costoPEN" REAL,
    "tiempoEntregaDias" INTEGER NOT NULL,
    "acreditadoINACAL" BOOLEAN NOT NULL DEFAULT false,
    "tercerizado" BOOLEAN NOT NULL DEFAULT false,
    "tipoMuestra" TEXT,
    "plantillaWord" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Cotizacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "cotizacionPadre" TEXT,
    "fechaEmision" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigenciaHasta" DATETIME NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "clienteId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "observaciones" TEXT,
    "creadoPorId" TEXT NOT NULL,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "igv" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "Cotizacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cotizacion_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CotizacionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cotizacionId" TEXT NOT NULL,
    "ensayoId" TEXT NOT NULL,
    "costo" REAL NOT NULL,
    "tiempoEntregaDias" INTEGER NOT NULL,
    CONSTRAINT "CotizacionItem_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CotizacionItem_ensayoId_fkey" FOREIGN KEY ("ensayoId") REFERENCES "Ensayo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SET" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "cotizacionId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "fechaIngreso" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nombreComercial" TEXT NOT NULL,
    "ingredienteActivo" TEXT,
    "formulacion" TEXT,
    "numeroLote" TEXT,
    "fechaFabricacion" DATETIME,
    "fechaVencimiento" DATETIME,
    "pesoVolumen" TEXT,
    "tipoMuestra" TEXT,
    "codigoMuestra" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "observaciones" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'EMITIDA',
    "creadoPorId" TEXT NOT NULL,
    CONSTRAINT "SET_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SET_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SET_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ODA" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "setId" TEXT NOT NULL,
    "ensayoId" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "fechaRecepcion" DATETIME,
    "fechaEntregaCompromiso" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'EMITIDA',
    CONSTRAINT "ODA_setId_fkey" FOREIGN KEY ("setId") REFERENCES "SET" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ODA_ensayoId_fkey" FOREIGN KEY ("ensayoId") REFERENCES "Ensayo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Informe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "prefijo" TEXT NOT NULL,
    "odaId" TEXT NOT NULL,
    "analistaId" TEXT NOT NULL,
    "resultadoTexto" TEXT,
    "archivoDocx" TEXT,
    "archivoPdf" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "firmaCalidad" DATETIME,
    "firmaGerencia" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Informe_odaId_fkey" FOREIGN KEY ("odaId") REFERENCES "ODA" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Informe_analistaId_fkey" FOREIGN KEY ("analistaId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Certificado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "informeId" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "qrUrl" TEXT NOT NULL,
    "fechaEmision" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Certificado_informeId_fkey" FOREIGN KEY ("informeId") REFERENCES "Informe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CargoEntrega" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "setId" TEXT NOT NULL,
    "recibidoPor" TEXT,
    "dniRecibe" TEXT,
    "fechaRecepcion" DATETIME,
    "firmaUrl" TEXT,
    CONSTRAINT "CargoEntrega_setId_fkey" FOREIGN KEY ("setId") REFERENCES "SET" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_ruc_key" ON "Cliente"("ruc");

-- CreateIndex
CREATE UNIQUE INDEX "Ensayo_codigo_key" ON "Ensayo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Cotizacion_numero_anio_key" ON "Cotizacion"("numero", "anio");

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
