import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  TransferAssetUseCase,
  TransferAssetCommand,
} from '../ports/in/transfer-asset.use-case.js';
import { Transfer } from '../models/transfer.model.js';
import { AssetStatus } from '../models/asset.model.js';
import { PrismaService } from '../../../compliance/adapters/out/db/prisma.service.js';
import { randomUUID } from 'crypto';

@Injectable()
export class TransferAssetService implements TransferAssetUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: TransferAssetCommand): Promise<Transfer> {
    return this.prisma.$transaction(async (tx) => {
      // ── 1. Bloqueo pesimista: SELECT FOR UPDATE ────────────────────────
      // Impide que dos transferencias concurrentes lean el mismo estado
      // "DISPONIBLE" y ambas procedan. Solo una instancia avanza; la otra
      // esperará hasta que la transacción activa haga commit o rollback.
      const [lockedAsset] = await tx.$queryRaw<{ id: string; name: string; status: string; location: string }[]>`
        SELECT id, name, status, location
        FROM "Asset"
        WHERE id = ${command.assetId}
        FOR UPDATE
      `;

      if (!lockedAsset) {
        throw new NotFoundException(
          `El activo con ID ${command.assetId} no existe`,
        );
      }

      // ── 2. Validar estado del activo ───────────────────────────────────
      if (
        lockedAsset.status === AssetStatus.DADO_DE_BAJA ||
        lockedAsset.status === AssetStatus.EN_PROCESO_BAJA
      ) {
        throw new ConflictException(
          `No se puede transferir el activo "${lockedAsset.name}" porque se encuentra en estado: ${lockedAsset.status.replace('_', ' ')}`,
        );
      }

      // ── 3. Determinar fromUnit y fromResponsible ───────────────────────
      const fromUnit = lockedAsset.location || 'Almacén Central';
      let fromResponsible = 'Almacén';

      const lastAssignment = await tx.assignment.findFirst({
        where: { assetId: command.assetId },
        orderBy: { date: 'desc' },
      });
      if (lastAssignment) {
        fromResponsible = lastAssignment.responsible;
      }

      // ── 4. Crear la transferencia y actualizar estado del activo ───────
      // Ambas escrituras ocurren dentro de la misma transacción.
      // Si una falla, la BD hace rollback automáticamente.
      const created = await tx.transfer.create({
        data: {
          id: randomUUID(),
          assetId: command.assetId,
          fromUnit,
          fromResponsible,
          toUnit: command.toUnit,
          toResponsible: command.toResponsible,
          date: command.date,
          status: 'Pendiente',
          reason: command.reason,
        },
      });

      await tx.asset.update({
        where: { id: command.assetId },
        data: { status: 'En_Transferencia' },
      });

      return new Transfer(
        created.id,
        created.assetId,
        created.fromUnit,
        created.fromResponsible,
        created.toUnit,
        created.toResponsible,
        created.date,
        created.status,
        created.reason,
      );
    });
  }
}

