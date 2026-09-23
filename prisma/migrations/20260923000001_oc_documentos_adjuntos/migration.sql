-- CreateTable
CREATE TABLE "OrdenCompraDocumento" (
    "id" TEXT NOT NULL,
    "ordenCompraId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'OTRO',
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "subidoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrdenCompraDocumento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrdenCompraDocumento" ADD CONSTRAINT "OrdenCompraDocumento_ordenCompraId_fkey" FOREIGN KEY ("ordenCompraId") REFERENCES "OrdenCompra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenCompraDocumento" ADD CONSTRAINT "OrdenCompraDocumento_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
