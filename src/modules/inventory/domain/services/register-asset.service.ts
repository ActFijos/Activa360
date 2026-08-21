import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  RegisterAssetUseCase,
  RegisterAssetCommand,
} from '../ports/in/register-asset.use-case.js';
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

    // 2. Validar consistencia de fechas e inicialización de estado
    if (
      command.status === AssetStatus.DANADO ||
      command.status === AssetStatus.DADO_DE_BAJA ||
      command.status === AssetStatus.EN_PROCESO_BAJA ||
      command.status === AssetStatus.OBSOLETO
    ) {
      throw new BadRequestException(
        `No está permitido registrar un activo directamente en estado: ${command.status}. Debe registrarse como Nuevo o Asignado.`,
      );
    }

    const now = new Date();
    if (command.purchaseDate > now) {
      throw new BadRequestException(
        'La fecha de compra no puede ser una fecha futura.',
      );
    }
    if (command.entryDate > now) {
      throw new BadRequestException(
        'La fecha de ingreso no puede ser una fecha futura.',
      );
    }
    if (command.entryDate < command.purchaseDate) {
      throw new BadRequestException(
        'La fecha de ingreso no puede ser anterior a la fecha de compra.',
      );
    }

    // 3. Instanciar el modelo de dominio con todos los nuevos parámetros
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

    // 4. Guardar en persistencia
    return this.assetRepository.save(asset);
  }
}
