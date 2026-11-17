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
import { randomUUID } from 'crypto';

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

    // 4. Determinar estado destino del activo y restaurar diagnóstico técnico condicionalmente
    let targetStatus = 'Dañado';
    try {
      if (this.prisma && (this.prisma as any).diagnosticoTecnico) {
        const diag = await (this.prisma as any).diagnosticoTecnico.findFirst({
          where: {
            assetId: baja.assetId,
            estado: { equals: 'UTILIZADO_EN_BAJA', mode: 'insensitive' },
          },
          orderBy: { fechaEmision: 'desc' },
        });

        if (diag) {
          await (this.prisma as any).diagnosticoTecnico.update({
            where: { id: diag.id },
            data: { estado: 'RESTAURADO' },
          });

          if (
            diag.causalSabs === 'OBSOLESCENCIA' ||
            diag.diagnosticoDetalle?.toLowerCase().includes('obsole')
          ) {
            targetStatus = 'Obsoleto';
          } else if (diag.dictaminaBaja) {
            targetStatus = 'APTO_PARA_BAJA';
          }
        }
      }

      if (targetStatus === 'Dañado' && this.prisma && (this.prisma as any).maintenanceReport) {
        const lastInspection = await (this.prisma as any).maintenanceReport.findFirst({
          where: { assetId: baja.assetId },
          orderBy: { inspectedAt: 'desc' },
        });
        if (lastInspection && lastInspection.diagnosis?.toLowerCase().includes('obsole')) {
          targetStatus = 'Obsoleto';
        }
      }

      if (this.prisma && (this.prisma as any).assetStatusHistory) {
        await (this.prisma as any).assetStatusHistory.create({
          data: {
            id: randomUUID(),
            assetId: baja.assetId,
            previousStatus: 'En_Proceso_Baja',
            newStatus: targetStatus,
            reason: `Rechazo normativo de baja SABS: ${motivoRechazo.trim()}`,
            changedBy: 'Supervisor SABS',
            changedAt: new Date(),
          },
        });
      }
    } catch {
      // Si la consulta de inspección/diagnóstico falla, se mantiene Dañado
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
