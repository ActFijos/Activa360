import { Injectable } from '@nestjs/common';
import { TransferRepositoryPort } from '../../../domain/ports/out/transfer-repository.port.js';
import { Transfer } from '../../../domain/models/transfer.model.js';
import { PrismaService } from '../../../../compliance/adapters/out/db/prisma.service.js';

@Injectable()
export class PrismaTransferAdapter implements TransferRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private mapRecordToDomain(record: any): Transfer {
    return new Transfer(
      record.id,
      record.assetId,
      record.fromUnit,
      record.fromResponsible,
      record.toUnit,
      record.toResponsible,
      record.date,
      record.status,
      record.reason,
    );
  }

  async save(transfer: Transfer): Promise<Transfer> {
    const data = {
      id: transfer.id,
      assetId: transfer.assetId,
      fromUnit: transfer.fromUnit,
      fromResponsible: transfer.fromResponsible,
      toUnit: transfer.toUnit,
      toResponsible: transfer.toResponsible,
      date: transfer.date,
      status: transfer.status,
      reason: transfer.reason,
    };

    const record = await this.prisma.transfer.upsert({
      where: { id: transfer.id || '' },
      update: data,
      create: data,
    });

    return this.mapRecordToDomain(record);
  }

  async findAll(): Promise<Transfer[]> {
    const records = await this.prisma.transfer.findMany({
      orderBy: { date: 'desc' },
    });
    return records.map((record) => this.mapRecordToDomain(record));
  }
}
