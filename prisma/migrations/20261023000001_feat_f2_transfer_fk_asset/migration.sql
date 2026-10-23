-- Migration: feat-f2-transfer-fk-asset
-- Feature 2: Transferencias concurrentes con integridad transaccional
-- Agrega FK Transfer.assetId → Asset.id para garantizar integridad referencial
-- a nivel de base de datos y habilitar SELECT FOR UPDATE en $transaction.

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_assetId_fkey"
  FOREIGN KEY ("assetId")
  REFERENCES "Asset"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
