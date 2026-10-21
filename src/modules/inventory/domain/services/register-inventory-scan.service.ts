import { Injectable, NotFoundException } from '@nestjs/common';
import {
  RegisterInventoryScanUseCase,
  RegisterInventoryScanCommand,
} from '../ports/in/register-inventory-scan.use-case';
import { InventoryRecordRepositoryPort } from '../ports/out/inventory-record-repository.port';
import { AssetRepositoryPort } from '../ports/out/asset-repository.port';
import { InventoryRecord } from '../models/inventory-record.model';

/**
 * Servicio de dominio para registrar el escaneo de un activo en una
 * campaña de inventario físico.
 *
 * La unicidad del registro (un solo escaneo por activo por campaña)
 * se garantiza a nivel de base de datos mediante la restricción UNIQUE
 * del modelo InventoryRecord en Prisma/PostgreSQL.
 *
 * Este servicio NO necesita lógica de deduplicación en memoria
 * (a diferencia de InMemoryMovementRepository), cumpliendo así el
 * Factor VI de 12-Factor App: los datos persisten en un backing service,
 * no en el proceso.
 */
@Injectable()
export class RegisterInventoryScanService
  implements RegisterInventoryScanUseCase
{
  constructor(
    private readonly inventoryRecordRepository: InventoryRecordRepositoryPort,
    private readonly assetRepository: AssetRepositoryPort,
  ) {}

  async execute(command: RegisterInventoryScanCommand): Promise<InventoryRecord> {
    // 1. Verificar que el activo existe antes de registrar el escaneo
    const asset = await this.assetRepository.findById(command.assetId);
    if (!asset) {
      throw new NotFoundException(
        `El activo con ID ${command.assetId} no existe.`,
      );
    }

    // 2. Registrar el escaneo — PostgreSQL garantiza unicidad por (campaignId, assetId).
    //    Si ya existe, el adaptador lanza ConflictException (error P2002).
    return this.inventoryRecordRepository.register(
      command.campaignId,
      command.assetId,
      command.userId,
    );
  }
}
