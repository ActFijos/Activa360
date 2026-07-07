import { Injectable } from '@nestjs/common';
import { AssetRepositoryPort } from '../../../domain/ports/out/asset-repository.port.js';
import { Asset, AssetStatus } from '../../../domain/models/asset.model.js';
import { PrismaService } from '../../../../compliance/adapters/out/db/prisma.service.js';

@Injectable()
export class PrismaAssetAdapter implements AssetRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private mapRecordToDomain(record: any): Asset {
    return new Asset(
      record.id,
      record.qrCode,
      record.name,
      record.status as AssetStatus,
      record.location,
      record.updatedAt,
      record.category,
      record.usefulLife,
      record.origin,
      record.purchaseDate,
      record.entryDate,
      record.purchaseValue,
      record.warrantyMonths,
      record.providerName,
      record.providerNit,
      record.providerPhone,
    );
  }

  async findById(id: string): Promise<Asset | null> {
    const record = await this.prisma.asset.findUnique({
      where: { id },
    });
    if (!record) return null;
    return this.mapRecordToDomain(record);
  }

  async findByQrCode(qrCode: string): Promise<Asset | null> {
    const record = await this.prisma.asset.findUnique({
      where: { qrCode },
    });
    if (!record) return null;
    return this.mapRecordToDomain(record);
  }

  async save(asset: Asset): Promise<Asset> {
    const data = {
      id: asset.id,
      qrCode: asset.qrCode,
      name: asset.name,
      status: asset.status,
      location: asset.location,
      updatedAt: asset.updatedAt,
      category: asset.category || 'Otros',
      usefulLife: asset.usefulLife || 5,
      origin: asset.origin || 'Compra',
      purchaseDate: asset.purchaseDate || new Date(),
      entryDate: asset.entryDate || new Date(),
      purchaseValue: asset.purchaseValue || 0.0,
      warrantyMonths: asset.warrantyMonths || 12,
      providerName: asset.providerName || null,
      providerNit: asset.providerNit || null,
      providerPhone: asset.providerPhone || null,
    };

    const record = await this.prisma.asset.upsert({
      where: { id: asset.id || '' },
      update: data,
      create: data,
    });

    return this.mapRecordToDomain(record);
  }

  async findAll(): Promise<Asset[]> {
    const records = await this.prisma.asset.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return records.map((record) => this.mapRecordToDomain(record));
  }
}
