import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RejectBajaUseCase } from '../ports/in/reject-baja.use-case.js';
import { BajaRepositoryPort } from '../ports/out/baja-repository.port.js';
import { AssetServicePort } from '../ports/out/asset-service.port.js';
import { Baja, BajaStatus } from '../models/baja.model.js';
import { PrismaService } from '../../adapters/out/db/prisma.service.js';

@Injectable()
export class RejectBajaService implements RejectBajaUseCase {
  constructor(
    @Inject(BajaRepositoryPort)
    private readonly bajaRepository: BajaRepositoryPort,
    @Inject(AssetServicePort)
    private readonly assetService: AssetServicePort,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async execute(id: string, motivoRechazo: string): Promise<Baja> {
    // 1. Validar que el motivo sea provisto y tenga al menos 5 caracteres
    if (!motivoRechazo || typeof motivoRechazo !== 'string' || motivoRechazo.trim().length < 5) {
      throw new BadRequestException(
        'El motivo de rechazo es obligatorio y debe contener al menos 5 caracteres.',
      );
    }

    // 2. Buscar la baja por ID
    const baja = await this.bajaRepository.findById(id);
    if (!baja) {
      throw new NotFoundException(`La baja con ID ${id} no existe`);
    }

    // 3. Validar que la baja se encuentre en estado INICIADA
    if (baja.status.toUpperCase() !== 'INICIADA' && baja.status.toLowerCase() !== 'iniciada') {
      throw new BadRequestException(
        `Solo se pueden rechazar solicitudes de baja en estado INICIADA (Estado actual: ${baja.status})`,
      );
    }

    // 4. Determinar estado destino del activo (Dañado u Obsoleto según último diagnóstico)
    let targetStatus = 'Dañado';
    try {
      const lastInspection = await this.prisma.maintenanceReport.findFirst({
        where: { assetId: baja.assetId },
        orderBy: { inspectedAt: 'desc' },
      });
      if (lastInspection && lastInspection.diagnosis.toLowerCase().includes('obsole')) {
        targetStatus = 'Obsoleto';
      }
    } catch {
      // Si la consulta de inspección falla o no aplica, se mantiene Dañado
    }

    // 5. Restaurar estado del activo a revisión técnica
    await this.assetService.updateAssetStatus(baja.assetId, targetStatus);

    // 6. Crear entidad actualizada con estado RECHAZADA y motivo guardado
    const updatedBaja = new Baja(
      baja.id,
      baja.assetId,
      baja.jefeId,
      baja.justification,
      baja.evidence,
      baja.initiatedAt,
      BajaStatus.RECHAZADA,
      motivoRechazo.trim(),
    );

    // 7. Persistir y retornar
    return this.bajaRepository.save(updatedBaja);
  }
}
