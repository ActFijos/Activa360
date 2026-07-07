import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InitiateBajaUseCase } from '../ports/in/initiate-baja.use-case';
import { BajaRepositoryPort } from '../ports/out/baja-repository.port';
import { AssetServicePort } from '../ports/out/asset-service.port';
import { Baja, BajaStatus } from '../models/baja.model';
import { randomUUID } from 'crypto';

@Injectable()
export class InitiateBajaService implements InitiateBajaUseCase {
  constructor(
    private readonly bajaRepository: BajaRepositoryPort,
    private readonly assetService: AssetServicePort,
  ) {}

  async execute(
    assetId: string,
    jefeId: string,
    justification: string,
    evidence: string,
  ): Promise<Baja> {
    // 1. Validar que el activo existe en el inventario.
    const asset = await this.assetService.getAsset(assetId);
    if (!asset) {
      throw new NotFoundException(
        `No se puede dar de baja un activo que no existe (ID: ${assetId}).`,
      );
    }

    // 2. Validar que el estado actual del activo sea "Dañado" u "Obsoleto".
    const allowedStatuses = ['Dañado', 'Obsoleto'];
    if (!allowedStatuses.includes(asset.status)) {
      throw new ConflictException(
        `El activo no se encuentra en estado Dañado u Obsoleto para iniciar su proceso de baja (Estado actual: ${asset.status}).`,
      );
    }

    // 3. Validar que no tenga un proceso de baja ya iniciado.
    const existingBaja = await this.bajaRepository.findByAssetId(assetId);
    if (existingBaja) {
      throw new ConflictException(
        `Ya se ha iniciado un proceso de baja para el activo ${assetId}.`,
      );
    }

    // 4. Crear la solicitud de baja.
    const baja = new Baja(
      randomUUID(),
      assetId,
      jefeId,
      justification,
      evidence,
      new Date(),
      BajaStatus.INICIADA,
    );

    // 5. Cambiar el estado del activo a "En_Proceso_Baja" en el inventario.
    await this.assetService.updateAssetStatus(assetId, 'En_Proceso_Baja');

    // 6. Guardar la baja en el repositorio de cumplimiento.
    return this.bajaRepository.save(baja);
  }
}
