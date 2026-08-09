import { Injectable } from '@nestjs/common';
import {
  AssetServicePort,
  ExternalAsset,
} from '../../../domain/ports/out/asset-service.port';
import { AssetRepositoryPort } from '../../../../inventory/domain/ports/out/asset-repository.port';
import { AssetStatus } from '../../../../inventory/domain/models/asset.model';

@Injectable()
export class InventoryAdapter implements AssetServicePort {
  constructor(private readonly assetRepository: AssetRepositoryPort) {}

  async getAsset(id: string): Promise<ExternalAsset | null> {
    const asset = await this.assetRepository.findById(id);
    if (!asset) {
      return null;
    }
    return {
      id: asset.id,
      status: asset.status,
      location: asset.location,
    };
  }

  async updateAssetStatus(id: string, status: string): Promise<void> {
    const asset = await this.assetRepository.findById(id);
    if (asset) {
      asset.status = status as AssetStatus;
      await this.assetRepository.save(asset);
    }
  }
}
