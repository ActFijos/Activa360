import { Injectable, ConflictException } from '@nestjs/common';
import { RegisterAssetUseCase, RegisterAssetCommand } from '../ports/in/register-asset.use-case.js';
import { AssetRepositoryPort } from '../ports/out/asset-repository.port.js';
import { Asset, AssetStatus } from '../models/asset.model.js';
import { randomUUID } from 'crypto';

@Injectable()
export class RegisterAssetService implements RegisterAssetUseCase {
  constructor(private readonly assetRepository: AssetRepositoryPort) {}

  async execute(command: RegisterAssetCommand): Promise<Asset> {
    // 1. Validar unicidad del código QR
    const existing = await this.assetRepository.findByQrCode(command.qrCode);
    if (existing) {
      throw new ConflictException(
        `Ya existe un activo registrado con el código QR: ${command.qrCode}`,
      );
    }

    // 2. Instanciar el modelo de dominio con todos los nuevos parámetros
    const asset = new Asset(
      randomUUID(),
      command.qrCode,
      command.name,
      command.status as AssetStatus,
      command.location,
      new Date(),
      command.category,
      command.usefulLife,
      command.origin,
      command.purchaseDate,
      command.entryDate,
      command.purchaseValue,
      command.warrantyMonths,
      command.providerName,
      command.providerNit,
      command.providerPhone,
    );

    // 3. Guardar en persistencia
    return this.assetRepository.save(asset);
  }
}
