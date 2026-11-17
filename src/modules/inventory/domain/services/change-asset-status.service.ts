import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ChangeAssetStatusUseCase,
  ChangeAssetStatusCommand,
} from '../ports/in/change-asset-status.use-case.js';
import { AssetRepositoryPort } from '../ports/out/asset-repository.port.js';
import { Asset, AssetStatus } from '../models/asset.model.js';
import { AssetStatusHistory } from '../models/asset-status-history.model.js';

@Injectable()
export class ChangeAssetStatusService implements ChangeAssetStatusUseCase {
  constructor(
    @Inject(AssetRepositoryPort)
    private readonly assetRepository: AssetRepositoryPort,
  ) {}

  // Matriz normativa de transiciones de estado SABS permitidas
  private static readonly ALLOWED_TRANSITIONS: Record<string, string[]> = {
    NUEVO: [
      'DISPONIBLE',
      'ACTIVO',
      'ASIGNADO',
      'EN_MANTENIMIENTO',
      'EN_DIAGNOSTICO',
    ],
    DISPONIBLE: [
      'ACTIVO',
      'ASIGNADO',
      'EN_MANTENIMIENTO',
      'EN_DIAGNOSTICO',
      'APTO_PARA_BAJA',
    ],
    ACTIVO: [
      'DISPONIBLE',
      'ASIGNADO',
      'EN_MANTENIMIENTO',
      'EN_DIAGNOSTICO',
      'APTO_PARA_BAJA',
    ],
    ASIGNADO: [
      'DISPONIBLE',
      'EN_TRASPASO',
      'EN_MANTENIMIENTO',
      'EN_DIAGNOSTICO',
    ],
    EN_TRASPASO: ['ASIGNADO', 'DISPONIBLE'],
    EN_MANTENIMIENTO: [
      'DISPONIBLE',
      'ACTIVO',
      'ASIGNADO',
      'EN_DIAGNOSTICO',
      'DANADO',
      'OBSOLETO',
      'APTO_PARA_BAJA',
    ],
    EN_DIAGNOSTICO: [
      'DISPONIBLE',
      'ACTIVO',
      'EN_MANTENIMIENTO',
      'APTO_PARA_BAJA',
      'DANADO',
      'OBSOLETO',
    ],
    DANADO: ['EN_DIAGNOSTICO', 'APTO_PARA_BAJA', 'EN_PROCESO_BAJA', 'DISPONIBLE'],
    OBSOLETO: ['EN_DIAGNOSTICO', 'APTO_PARA_BAJA', 'EN_PROCESO_BAJA', 'DISPONIBLE'],
    APTO_PARA_BAJA: [
      'EN_PROCESO_BAJA',
      'EN_DIAGNOSTICO',
      'DISPONIBLE',
      'DANADO',
      'OBSOLETO',
    ],
    EN_PROCESO_BAJA: [
      'DADO_DE_BAJA',
      'APTO_PARA_BAJA',
      'EN_DIAGNOSTICO',
      'DANADO',
      'OBSOLETO',
      'DISPONIBLE',
    ],
    DADO_DE_BAJA: [], // Estado terminal normativo
  };

  private normalizeStatusKey(status: string): string {
    const s = status.toUpperCase().replace(/\s+/g, '_');
    if (s === 'DAÑADO' || s === 'DANADO') return 'DANADO';
    if (s === 'DADO_DE_BAJA') return 'DADO_DE_BAJA';
    if (s === 'EN_PROCESO_BAJA') return 'EN_PROCESO_BAJA';
    if (s === 'APTO_PARA_BAJA') return 'APTO_PARA_BAJA';
    if (s === 'EN_DIAGNOSTICO') return 'EN_DIAGNOSTICO';
    if (s === 'EN_MANTENIMIENTO') return 'EN_MANTENIMIENTO';
    if (s === 'EN_TRASPASO') return 'EN_TRASPASO';
    return s;
  }

  async execute(command: ChangeAssetStatusCommand): Promise<Asset> {
    const { assetId, nuevoEstado, motivo, responsable } = command;

    if (!motivo || motivo.trim().length < 5) {
      throw new BadRequestException(
        'El motivo de la transición debe tener al menos 5 caracteres.',
      );
    }

    const asset = await this.assetRepository.findById(assetId);
    if (!asset) {
      throw new NotFoundException(`El activo con ID ${assetId} no existe.`);
    }

    const currentKey = this.normalizeStatusKey(asset.status);
    const targetKey = this.normalizeStatusKey(nuevoEstado);

    // 1. Validar si ya está en estado terminal DADO_DE_BAJA
    if (currentKey === 'DADO_DE_BAJA') {
      throw new ConflictException(
        'Operación denegada por normativa SABS: Un activo en estado Dado_De_Baja es terminal y no admite transiciones.',
      );
    }

    // 2. Si el estado es el mismo, no requiere transición
    if (currentKey === targetKey) {
      return asset;
    }

    // 3. Validar si la transición está permitida en la matriz
    const allowed = ChangeAssetStatusService.ALLOWED_TRANSITIONS[currentKey] || [];
    if (!allowed.includes(targetKey)) {
      throw new ConflictException(
        `Transición no permitida por normativa SABS: No se puede cambiar el estado de ${asset.status} a ${nuevoEstado}.`,
      );
    }

    // 4. Registrar trazabilidad histórica del cambio de estado
    const previousStatus = asset.status;
    asset.status = nuevoEstado as AssetStatus;
    asset.updatedAt = new Date();

    const historyRecord = new AssetStatusHistory(
      randomUUID(),
      assetId,
      previousStatus,
      nuevoEstado,
      motivo.trim(),
      responsable || 'Sistema',
      new Date(),
    );

    await this.assetRepository.recordStatusChange(historyRecord);
    const updatedAsset = await this.assetRepository.save(asset);

    // Adjuntar el historial actualizado para la respuesta
    const assetWithHistory = await this.assetRepository.findByIdWithHistory(assetId);
    return assetWithHistory || updatedAsset;
  }
}
