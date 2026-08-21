import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ScanQrUseCase } from '../ports/in/scan-qr.use-case';
import { AssetRepositoryPort } from '../ports/out/asset-repository.port';
import { MovementRepositoryPort } from '../ports/out/movement-repository.port';
import { Asset } from '../models/asset.model';
import { Movement } from '../models/movement.model';
import { randomUUID } from 'crypto';

@Injectable()
export class ScanQrService implements ScanQrUseCase {
  constructor(
    private readonly assetRepository: AssetRepositoryPort,
    private readonly movementRepository: MovementRepositoryPort,
  ) {}

  async execute(
    qrCode: string,
    latitude: number,
    longitude: number,
  ): Promise<Asset> {
    // 1. Verificar existencia del activo por código QR
    const asset = await this.assetRepository.findByQrCode(qrCode);
    if (!asset) {
      throw new NotFoundException(
        `Activo con código QR ${qrCode} no encontrado.`,
      );
    }

    const now = new Date();

    // 2. Rechazar duplicados (mismo activo, mismas coordenadas y timestamp en el mismo minuto)
    const isDuplicate = await this.movementRepository.existsDuplicate(
      asset.id,
      latitude,
      longitude,
      now,
    );
    if (isDuplicate) {
      throw new ConflictException(
        `Escaneo duplicado detectado para el activo ${asset.id}.`,
      );
    }

    // 3. Crear y registrar el movimiento
    const movement = new Movement(
      randomUUID(),
      asset.id,
      latitude,
      longitude,
      now,
    );
    await this.movementRepository.save(movement);

    // 4. Actualizar la ubicación del activo y registrar la fecha de actualización
    const locationString = `Lat: ${latitude}, Long: ${longitude}`;
    asset.updateLocationAndStatus(locationString);
    await this.assetRepository.save(asset);

    return asset;
  }
}
