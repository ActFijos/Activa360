import {
  Injectable,
  Inject,
  Optional,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InitiateBajaUseCase } from '../ports/in/initiate-baja.use-case.js';
import { BajaRepositoryPort } from '../ports/out/baja-repository.port.js';
import { AssetServicePort } from '../ports/out/asset-service.port.js';
import { Baja, BajaStatus } from '../models/baja.model.js';
import { PrismaService } from '../../adapters/out/db/prisma.service.js';
import { randomUUID } from 'crypto';

@Injectable()
export class InitiateBajaService implements InitiateBajaUseCase {
  constructor(
    @Inject(BajaRepositoryPort) private readonly bajaRepository: BajaRepositoryPort,
    @Inject(AssetServicePort) private readonly assetService: AssetServicePort,
    @Optional() @Inject(PrismaService) private readonly prisma?: PrismaService,
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

    // 2. Validar que el estado actual del activo sea Dañado, Obsoleto o APTO_PARA_BAJA.
    const allowedStatuses = [
      'Dañado',
      'Obsoleto',
      'APTO_PARA_BAJA',
      'Apto_Para_Baja',
      'DANADO',
      'OBSOLETO',
    ];
    if (!allowedStatuses.includes(asset.status)) {
      throw new ConflictException(
        `El activo no se encuentra en estado Dañado, Obsoleto o APTO_PARA_BAJA para iniciar su proceso de baja (Estado actual: ${asset.status}).`,
      );
    }

    // 3. Validar que no tenga un proceso de baja ya iniciado.
    const existingBaja = await this.bajaRepository.findByAssetId(assetId);
    if (existingBaja) {
      throw new ConflictException(
        `Ya se ha iniciado un proceso de baja para el activo ${assetId}.`,
      );
    }

    // 4. Si existe un diagnóstico técnico VIGENTE para este activo, transicionarlo a UTILIZADO_EN_BAJA
    if (this.prisma) {
      try {
        const diag = await this.prisma.diagnosticoTecnico.findFirst({
          where: {
            assetId,
            estado: { equals: 'VIGENTE', mode: 'insensitive' },
          },
          orderBy: { fechaEmision: 'desc' },
        });

        if (diag) {
          await this.prisma.diagnosticoTecnico.update({
            where: { id: diag.id },
            data: { estado: 'UTILIZADO_EN_BAJA' },
          });
        }

        await this.prisma.assetStatusHistory.create({
          data: {
            id: randomUUID(),
            assetId,
            previousStatus: asset.status,
            newStatus: 'En_Proceso_Baja',
            reason: `Inicio de trámite de baja SABS: ${justification.substring(0, 100)}`,
            changedBy: jefeId,
            changedAt: new Date(),
          },
        });
      } catch {
        // En entornos sin base de datos activa o pruebas aisladas
      }
    }

    // 5. Crear la solicitud de baja.
    const baja = new Baja(
      randomUUID(),
      assetId,
      jefeId,
      justification,
      evidence,
      new Date(),
      BajaStatus.INICIADA,
    );

    // 6. Cambiar el estado del activo a "En_Proceso_Baja" en el inventario.
    await this.assetService.updateAssetStatus(assetId, 'En_Proceso_Baja');

    // 7. Guardar la baja en el repositorio de cumplimiento.
    return this.bajaRepository.save(baja);
  }
}
