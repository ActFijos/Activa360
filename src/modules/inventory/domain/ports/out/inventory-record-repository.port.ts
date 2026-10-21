import { InventoryRecord } from '../../models/inventory-record.model';

/**
 * Puerto de salida para el repositorio de registros de inventario QR.
 * La implementación concreta (Prisma) garantiza unicidad a nivel de BD.
 */
export abstract class InventoryRecordRepositoryPort {
  /**
   * Registra el escaneo de un activo en una campaña de inventario.
   * Lanza ConflictException si ya existe un registro para la misma
   * combinación (campaignId, assetId) — garantía de unicidad PostgreSQL.
   */
  abstract register(
    campaignId: string,
    assetId: string,
    userId: string,
  ): Promise<InventoryRecord>;

  /**
   * Verifica si ya existe un registro para la combinación campaignId + assetId.
   */
  abstract existsRecord(
    campaignId: string,
    assetId: string,
  ): Promise<boolean>;
}
