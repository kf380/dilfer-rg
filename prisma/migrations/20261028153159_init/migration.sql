-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "cuit" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "ultimoNumero" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "rol" TEXT NOT NULL DEFAULT 'Usuario',
    "area" TEXT NOT NULL,
    "empresaId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "cuit" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "cbu" TEXT,
    "alias" TEXT,
    "titularCuenta" TEXT,
    "mailContacto" TEXT,
    "whatsapp" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CuentaContable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "areasHabilitadas" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CuentaContable_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CentroCosto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CentroCosto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RG" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nroRG" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "responsableId" TEXT NOT NULL,
    "area" TEXT,
    "fechaRegistro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RG_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RG_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RGLinea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rgId" TEXT NOT NULL,
    "linea" INTEGER NOT NULL,
    "proveedorId" TEXT,
    "proveedorTexto" TEXT,
    "comprobante" TEXT,
    "fechaComprobante" DATETIME,
    "detalleGasto" TEXT NOT NULL,
    "cuentaId" TEXT,
    "cuentaTexto" TEXT,
    "centroCostoId" TEXT,
    "centroCostoTexto" TEXT,
    "monto" REAL NOT NULL,
    "formaPago" TEXT NOT NULL,
    "cbu" TEXT,
    "alias" TEXT,
    "titular" TEXT,
    "mail" TEXT,
    "whatsapp" TEXT,
    "compraMercaderia" BOOLEAN NOT NULL DEFAULT false,
    "fechaPagoSolicitada" DATETIME,
    "notas" TEXT,
    "fechaEstimadaPago" DATETIME,
    CONSTRAINT "RGLinea_rgId_fkey" FOREIGN KEY ("rgId") REFERENCES "RG" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RGLinea_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RGLinea_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "CuentaContable" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RGLinea_centroCostoId_fkey" FOREIGN KEY ("centroCostoId") REFERENCES "CentroCosto" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_codigo_key" ON "Empresa"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Area_nombre_key" ON "Area"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_codigo_key" ON "Proveedor"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "CuentaContable_empresaId_codigo_key" ON "CuentaContable"("empresaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "RG_nroRG_key" ON "RG"("nroRG");
