import { Injectable, ConflictException } from '@nestjs/common';
import { InventoryRecordRepositoryPort } from '../../../domain/ports/out/inventory-record-repository.port.js';
import { InventoryRecord } from '../../../domain/models/inventory-record.model.js';
import { PrismaService } from '../../../../compliance/adapters/out/db/prisma.service.js';
import { Prisma } from '@prisma/client';

/**
 * Adaptador Prisma para el repositorio de registros de inventario QR.
 *
 * El control de concurrencia se delega a PostgreSQL mediante la restricción
 * UNIQUE(campaignId, assetId) declarada en schema.prisma (@@unique).
 *
 * Cuando dos solicitudes simultáneas intentan registrar el mismo activo
 * en la misma campaña, PostgreSQL rechaza la segunda con un error P2002
 * (unique constraint violation), que aquí convertimos en un 409 Conflict
 * comprensible para el cliente.
 *
 * Factor VI — 12-Factor App: el estado persiste en PostgreSQL, no en memoria.
 * Factor VIII — 12-Factor App: la integridad se mantiene sin coordinación
 * entre instancias de la aplicación.
 */
@Injectable()
export class PrismaInventoryRecordAdapter
  implements InventoryRecordRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async register(
    campaignId: string,
    assetId: string,
    userId: string,
  ): Promise<InventoryRecord> {
    try {
      const record = await this.prisma.inventoryRecord.create({
        data: {
          campaignId,
          assetId,
          userId,
        },
      });

      return new InventoryRecord(
        record.id,
        record.campaignId,
        record.assetId,
        record.userId,
        record.createdAt,
      );
    } catch (error) {
      // Error P2002: violación de restricción UNIQUE en PostgreSQL.
      // Ocurre cuando dos solicitudes concurrentes intentan registrar
      // el mismo activo en la misma campaña.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `El activo ${assetId} ya fue registrado en la campaña ${campaignId}.`,
        );
      }
      throw error;
    }
  }

  async existsRecord(campaignId: string, assetId: string): Promise<boolean> {
    const count = await this.prisma.inventoryRecord.count({
      where: { campaignId, assetId },
    });
    return count > 0;
  }
}
