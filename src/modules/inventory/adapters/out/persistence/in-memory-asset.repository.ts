import { Injectable } from '@nestjs/common';
import { AssetRepositoryPort } from '../../../domain/ports/out/asset-repository.port';
import { Asset, AssetStatus } from '../../../domain/models/asset.model';

@Injectable()
export class InMemoryAssetRepository implements AssetRepositoryPort {
  public readonly assets = new Map<string, Asset>();

  constructor() {
    this.assets.set(
      'seed-asset-uuid-123',
      new Asset(
        'seed-asset-uuid-123',
        'QR-XYZ-123',
        'Computadora Portatil HP',
        AssetStatus.NUEVO,
        'Oficina de Inventarios',
        new Date(),
      ),
    );
    this.assets.set(
      'seed-asset-uuid-danado',
      new Asset(
        'seed-asset-uuid-danado',
        'QR-DANADO-001',
        'Impresora Laser Kyocera (Dañada)',
        AssetStatus.DANADO,
        'Soporte Técnico',
        new Date(),
      ),
    );
    this.assets.set(
      'seed-asset-uuid-obsoleto',
      new Asset(
        'seed-asset-uuid-obsoleto',
        'QR-OBSOLETO-001',
        'Proyector Epson obsoleto',
        AssetStatus.OBSOLETO,
        'Almacén A',
        new Date(),
      ),
    );
  }

  async findById(id: string): Promise<Asset | null> {
    return this.assets.get(id) || null;
  }

  async findByQrCode(qrCode: string): Promise<Asset | null> {
    for (const asset of this.assets.values()) {
      if (asset.qrCode === qrCode) {
        return asset;
      }
    }
    return null;
  }

  async save(asset: Asset): Promise<Asset> {
    this.assets.set(asset.id, asset);
    return asset;
  }

  async findAll(): Promise<Asset[]> {
    return Array.from(this.assets.values());
  }

  async findByIdWithHistory(id: string): Promise<Asset | null> {
    return this.findById(id);
  }

  async findAllWithFilters(filters: {
    estado?: string;
    codigo?: string;
    unidad?: string;
  }): Promise<Asset[]> {
    let list = Array.from(this.assets.values());
    if (filters.estado) {
      list = list.filter((a) => a.status.toLowerCase() === filters.estado!.toLowerCase());
    }
    if (filters.codigo) {
      list = list.filter((a) => a.qrCode.toLowerCase().includes(filters.codigo!.toLowerCase()));
    }
    if (filters.unidad) {
      list = list.filter((a) => a.location.toLowerCase().includes(filters.unidad!.toLowerCase()));
    }
    return list;
  }

  async recordStatusChange(history: any): Promise<any> {
    return history;
  }

  async saveMaintenanceReport(report: {
    assetId: string;
    diagnosis: string;
    estimatedCost: number;
    action: string;
  }): Promise<void> {
    // mock operation
  }
}
