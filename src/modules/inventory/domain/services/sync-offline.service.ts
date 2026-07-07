import { Injectable, NotFoundException } from '@nestjs/common';
import { SyncItem, SyncOfflineUseCase, SyncResult } from '../ports/in/sync-offline.use-case';
import { AssetRepositoryPort } from '../ports/out/asset-repository.port';
import { MovementRepositoryPort } from '../ports/out/movement-repository.port';
import { Asset } from '../models/asset.model';
import { Movement } from '../models/movement.model';
import { randomUUID } from 'crypto';

@Injectable()
export class SyncOfflineService implements SyncOfflineUseCase {
  constructor(
    private readonly assetRepository: AssetRepositoryPort,
    private readonly movementRepository: MovementRepositoryPort,
  ) {}

  async execute(items: SyncItem[]): Promise<SyncResult> {
    // 1. Pre-validar existencia de todos los activos en el lote.
    // Si alguno no existe, se arroja NotFoundException y se aborta toda la operación (Transaccionalidad).
    const assetsMap = new Map<string, Asset>();

    for (const item of items) {
      const asset = await this.assetRepository.findByQrCode(item.qrCode);
      if (!asset) {
        throw new NotFoundException(
          `Activo con código QR ${item.qrCode} no encontrado. Sincronización abortada.`,
        );
      }
      assetsMap.set(item.qrCode, asset);
    }

    let processedCount = 0;
    let ignoredCount = 0;

    // 2. Procesar el lote de sincronización
    for (const item of items) {
      const asset = assetsMap.get(item.qrCode)!;

      const itemDate = new Date(item.updatedAt);
      const assetDate = new Date(asset.updatedAt);

      if (itemDate.getTime() > assetDate.getTime()) {
        // Conflicto resuelto: El lote es más reciente, por lo tanto actualizamos el activo
        const locationString = `Lat: ${item.latitude}, Long: ${item.longitude}`;
        asset.location = locationString;
        if (item.status) {
          asset.status = item.status;
        }
        asset.updatedAt = itemDate;

        // Crear el registro de movimiento
        const movement = new Movement(
          randomUUID(),
          asset.id,
          item.latitude,
          item.longitude,
          itemDate,
        );

        await this.assetRepository.save(asset);
        await this.movementRepository.save(movement);
        processedCount++;
      } else {
        // El timestamp del servidor es más reciente o igual. Ignoramos la actualización.
        ignoredCount++;
      }
    }

    return { processedCount, ignoredCount };
  }
}
