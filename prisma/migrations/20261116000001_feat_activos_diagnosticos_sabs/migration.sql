-- Migration: feat_activos_diagnosticos_sabs
-- Feature 1 & 2: Gestión de Activos Fijos Patrimoniales, Control de Estados SABS y Diagnóstico Técnico Previo a Bajas
-- Josefina Rojas - Release 8.2.0

-- 1. Agregar columna diagnosticoId a tabla Baja
ALTER TABLE "Baja" ADD COLUMN IF NOT EXISTS "diagnosticoId" TEXT;

-- 2. Crear tabla diagnosticos_tecnicos
CREATE TABLE IF NOT EXISTS "diagnosticos_tecnicos" (
    "id" TEXT NOT NULL,
    "numeroInforme" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "tecnicoId" TEXT,
    "tecnicoNombre" TEXT,
    "causalSabs" TEXT NOT NULL,
    "diagnosticoDetalle" TEXT NOT NULL,
    "recomendacion" TEXT NOT NULL,
    "dictaminaBaja" BOOLEAN NOT NULL DEFAULT true,
    "evidenciaDocumento" TEXT,
    "costoEstimadoReparacion" DOUBLE PRECISION DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'VIGENTE',
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,

    CONSTRAINT "diagnosticos_tecnicos_pkey" PRIMARY KEY ("id")
);

-- Indices y restricción UNIQUE para diagnosticos_tecnicos
CREATE UNIQUE INDEX IF NOT EXISTS "diagnosticos_tecnicos_numeroInforme_key" ON "diagnosticos_tecnicos"("numeroInforme");
CREATE INDEX IF NOT EXISTS "diagnosticos_tecnicos_assetId_idx" ON "diagnosticos_tecnicos"("assetId");
CREATE INDEX IF NOT EXISTS "diagnosticos_tecnicos_estado_idx" ON "diagnosticos_tecnicos"("estado");

-- Foreign key para diagnosticos_tecnicos -> Asset
ALTER TABLE "diagnosticos_tecnicos" ADD CONSTRAINT "diagnosticos_tecnicos_assetId_fkey"
    FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Crear tabla asset_status_history
CREATE TABLE IF NOT EXISTS "asset_status_history" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "previousStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,
    "reason" TEXT,
    "changedBy" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_status_history_pkey" PRIMARY KEY ("id")
);

-- Indices para asset_status_history
CREATE INDEX IF NOT EXISTS "asset_status_history_assetId_idx" ON "asset_status_history"("assetId");

-- Foreign key para asset_status_history -> Asset
ALTER TABLE "asset_status_history" ADD CONSTRAINT "asset_status_history_assetId_fkey"
    FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
