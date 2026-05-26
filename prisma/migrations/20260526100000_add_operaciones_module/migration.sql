-- Migration: add_operaciones_module
-- Applied directly via db push; this file documents the applied changes.

-- CreateTable Proveedor
CREATE TABLE IF NOT EXISTS "Proveedor" (
    "id" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "direccion" TEXT,
    "contacto" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "rubro" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable Requerimiento
CREATE TABLE IF NOT EXISTS "Requerimiento" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "areaSolicitante" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "justificacion" TEXT,
    "urgencia" TEXT NOT NULL DEFAULT 'NORMAL',
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "fechaRequerida" TIMESTAMP(3),
    "creadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Requerimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable RequerimientoItem
CREATE TABLE IF NOT EXISTS "RequerimientoItem" (
    "id" TEXT NOT NULL,
    "requerimientoId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "unidad" TEXT NOT NULL,
    "especificaciones" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "RequerimientoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable CotizacionProveedor
CREATE TABLE IF NOT EXISTS "CotizacionProveedor" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "requerimientoId" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'PEN',
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "igv" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "plazoEntregaDias" INTEGER,
    "condicionesPago" TEXT,
    "validezDias" INTEGER,
    "archivoUrl" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "observaciones" TEXT,
    "aprobadoPorId" TEXT,
    "fechaAprobacion" TIMESTAMP(3),
    "motivoRechazo" TEXT,
    "creadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CotizacionProveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable CotizacionProveedorItem
CREATE TABLE IF NOT EXISTS "CotizacionProveedorItem" (
    "id" TEXT NOT NULL,
    "cotizacionProveedorId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "unidad" TEXT NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CotizacionProveedorItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable OrdenCompra
CREATE TABLE IF NOT EXISTS "OrdenCompra" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "requerimientoId" TEXT NOT NULL,
    "cotizacionProveedorId" TEXT,
    "proveedorId" TEXT NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'PEN',
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "igv" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "condicionesPago" TEXT,
    "lugarEntrega" TEXT,
    "fechaEntregaEstimada" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'EMITIDA',
    "observaciones" TEXT,
    "archivoPdfUrl" TEXT,
    "fechaConfirmacionProveedor" TIMESTAMP(3),
    "emitidoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrdenCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable OrdenCompraItem
CREATE TABLE IF NOT EXISTS "OrdenCompraItem" (
    "id" TEXT NOT NULL,
    "ordenCompraId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "cantidadRecibida" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unidad" TEXT NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "OrdenCompraItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable Recepcion
CREATE TABLE IF NOT EXISTS "Recepcion" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "ordenCompraId" TEXT NOT NULL,
    "fechaRecepcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recibidoPorId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "entregadoAlAreaFecha" TIMESTAMP(3),
    "entregadoAlAreaPor" TEXT,
    "conformeArea" BOOLEAN,
    "observacionesArea" TEXT,
    "documentoUrl" TEXT,
    CONSTRAINT "Recepcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable RecepcionItem
CREATE TABLE IF NOT EXISTS "RecepcionItem" (
    "id" TEXT NOT NULL,
    "recepcionId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidadEsperada" DOUBLE PRECISION NOT NULL,
    "cantidadRecibida" DOUBLE PRECISION NOT NULL,
    "unidad" TEXT NOT NULL,
    "conforme" BOOLEAN NOT NULL DEFAULT true,
    "observacion" TEXT,
    CONSTRAINT "RecepcionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable Devolucion
CREATE TABLE IF NOT EXISTS "Devolucion" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "recepcionId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'TOTAL',
    "motivo" TEXT NOT NULL,
    "fechaDevolucion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gestionadoPorId" TEXT NOT NULL,
    "documentoUrl" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    CONSTRAINT "Devolucion_pkey" PRIMARY KEY ("id")
);

-- CreateTable DevolucionItem
CREATE TABLE IF NOT EXISTS "DevolucionItem" (
    "id" TEXT NOT NULL,
    "devolucionId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "unidad" TEXT NOT NULL,
    "motivo" TEXT,
    CONSTRAINT "DevolucionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable Factura
CREATE TABLE IF NOT EXISTS "Factura" (
    "id" TEXT NOT NULL,
    "serie" TEXT,
    "numero" TEXT NOT NULL,
    "ordenCompraId" TEXT NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'PEN',
    "subtotal" DOUBLE PRECISION NOT NULL,
    "igv" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'REGISTRADA',
    "archivoUrl" TEXT,
    "registradoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable ProvisionPago
CREATE TABLE IF NOT EXISTS "ProvisionPago" (
    "id" TEXT NOT NULL,
    "facturaId" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "concepto" TEXT,
    "condicionPago" TEXT NOT NULL DEFAULT 'CREDITO_30',
    "aprobadoPorId" TEXT NOT NULL,
    "fechaAprobacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,
    CONSTRAINT "ProvisionPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable Pago
CREATE TABLE IF NOT EXISTS "Pago" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "provisionId" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'PEN',
    "medioPago" TEXT NOT NULL DEFAULT 'TRANSFERENCIA',
    "fechaPago" TIMESTAMP(3) NOT NULL,
    "referencia" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "aprobadoPorId" TEXT NOT NULL,
    "confirmadoProveedor" BOOLEAN NOT NULL DEFAULT false,
    "fechaConfirmacion" TIMESTAMP(3),
    "voucherUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Proveedor_ruc_key" ON "Proveedor"("ruc");
CREATE UNIQUE INDEX IF NOT EXISTS "Requerimiento_numero_anio_key" ON "Requerimiento"("numero", "anio");
CREATE UNIQUE INDEX IF NOT EXISTS "CotizacionProveedor_numero_anio_key" ON "CotizacionProveedor"("numero", "anio");
CREATE UNIQUE INDEX IF NOT EXISTS "OrdenCompra_numero_anio_key" ON "OrdenCompra"("numero", "anio");
CREATE UNIQUE INDEX IF NOT EXISTS "Recepcion_numero_anio_key" ON "Recepcion"("numero", "anio");
CREATE UNIQUE INDEX IF NOT EXISTS "Devolucion_numero_anio_key" ON "Devolucion"("numero", "anio");
CREATE UNIQUE INDEX IF NOT EXISTS "ProvisionPago_facturaId_key" ON "ProvisionPago"("facturaId");
CREATE UNIQUE INDEX IF NOT EXISTS "Pago_numero_anio_key" ON "Pago"("numero", "anio");
CREATE UNIQUE INDEX IF NOT EXISTS "Pago_provisionId_key" ON "Pago"("provisionId");
