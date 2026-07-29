import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { TransferAssetUseCase, TransferAssetCommand } from '../ports/in/transfer-asset.use-case.js';
import { TransferRepositoryPort } from '../ports/out/transfer-repository.port.js';
import { AssetRepositoryPort } from '../ports/out/asset-repository.port.js';
import { AssignmentRepositoryPort } from '../ports/out/assignment-repository.port.js';
import { Transfer } from '../models/transfer.model.js';
import { Assignment } from '../models/assignment.model.js';
import { AssetStatus } from '../models/asset.model.js';
import { randomUUID } from 'crypto';

@Injectable()
export class TransferAssetService implements TransferAssetUseCase {
  constructor(
    private readonly assetRepository: AssetRepositoryPort,
    private readonly transferRepository: TransferRepositoryPort,
    private readonly assignmentRepository: AssignmentRepositoryPort,
  ) {}

  async execute(command: TransferAssetCommand): Promise<Transfer> {
    // 1. Buscar el activo fijo
    const asset = await this.assetRepository.findById(command.assetId);
    if (!asset) {
      throw new NotFoundException(`El activo con ID ${command.assetId} no existe`);
    }

    // 2. Validar que no esté dado de baja ni en proceso de baja
    if (asset.status === AssetStatus.DADO_DE_BAJA || asset.status === AssetStatus.EN_PROCESO_BAJA) {
      throw new ConflictException(
        `No se puede transferir el activo "${asset.name}" porque se encuentra en estado: ${asset.status.replace('_', ' ')}`,
      );
    }

    // 3. Determinar ubicación origen (fromUnit) y responsable origen (fromResponsible)
    const fromUnit = asset.location || 'Almacén Central';
    let fromResponsible = 'Almacén';

    const assignments = await this.assignmentRepository.findAll();
    const assetAssignments = assignments.filter(a => a.assetId === command.assetId);
    if (assetAssignments.length > 0) {
      fromResponsible = assetAssignments[0].responsible;
    }

    // 4. Registrar la transferencia en estado "Pendiente"
    const transfer = new Transfer(
      randomUUID(),
      command.assetId,
      fromUnit,
      fromResponsible,
      command.toUnit,
      command.toResponsible,
      command.date,
      'Pendiente',
      command.reason,
    );

    // 5. Guardar cambios en persistencia (solo se guarda la solicitud)
    return this.transferRepository.save(transfer);
  }
}
