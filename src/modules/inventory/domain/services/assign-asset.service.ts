import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  AssignAssetUseCase,
  AssignAssetCommand,
} from '../ports/in/assign-asset.use-case.js';
import { AssignmentRepositoryPort } from '../ports/out/assignment-repository.port.js';
import { AssetRepositoryPort } from '../ports/out/asset-repository.port.js';
import { Assignment } from '../models/assignment.model.js';
import { AssetStatus } from '../models/asset.model.js';
import { randomUUID } from 'crypto';

@Injectable()
export class AssignAssetService implements AssignAssetUseCase {
  constructor(
    private readonly assetRepository: AssetRepositoryPort,
    private readonly assignmentRepository: AssignmentRepositoryPort,
  ) {}

  async execute(command: AssignAssetCommand): Promise<Assignment> {
    // 1. Buscar el activo fijo
    const asset = await this.assetRepository.findById(command.assetId);
    if (!asset) {
      throw new NotFoundException(
        `El activo con ID ${command.assetId} no existe`,
      );
    }

    // 2. Validar que no esté dado de baja ni en proceso de baja
    if (
      asset.status === AssetStatus.DADO_DE_BAJA ||
      asset.status === AssetStatus.EN_PROCESO_BAJA
    ) {
      throw new ConflictException(
        `No se puede asignar el activo "${asset.name}" porque se encuentra en estado: ${asset.status.replace('_', ' ')}`,
      );
    }

    // 3. Crear el registro de asignación
    const assignment = new Assignment(
      randomUUID(),
      command.assetId,
      command.responsible,
      command.date,
      command.destination,
      command.observations || null,
    );

    // 4. Actualizar el activo (estado = Asignado, ubicación = ubicación de destino)
    asset.status = AssetStatus.ASIGNADO;
    asset.location = command.destination;
    asset.updatedAt = new Date();

    // 5. Persistir cambios
    await this.assetRepository.save(asset);
    return this.assignmentRepository.save(assignment);
  }
}
