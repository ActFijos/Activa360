import { Injectable } from '@nestjs/common';
import { BajaRepositoryPort } from '../../../domain/ports/out/baja-repository.port.js';
import { Baja, BajaStatus } from '../../../domain/models/baja.model.js';
import { PrismaService } from './prisma.service.js';

@Injectable()
export class PrismaBajaAdapter implements BajaRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(baja: Baja): Promise<Baja> {
    const data = {
      id: baja.id,
      assetId: baja.assetId,
      jefeId: baja.jefeId,
      justification: baja.justification,
      evidence: baja.evidence,
      initiatedAt: baja.initiatedAt,
      status: baja.status,
    };

    const record = await this.prisma.baja.upsert({
      where: { id: baja.id || '' },
      update: data,
      create: data,
    });

    return new Baja(
      record.id,
      record.assetId,
      record.jefeId,
      record.justification,
      record.evidence,
      record.initiatedAt,
      record.status as BajaStatus,
    );
  }

  async findByAssetId(assetId: string): Promise<Baja | null> {
    const record = await this.prisma.baja.findUnique({
      where: { assetId },
    });

    if (!record) {
      return null;
    }

    return new Baja(
      record.id,
      record.assetId,
      record.jefeId,
      record.justification,
      record.evidence,
      record.initiatedAt,
      record.status as BajaStatus,
    );
  }
}
