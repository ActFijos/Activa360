import { Asset } from '../../models/asset.model.js';
import { AssetStatusHistory } from '../../models/asset-status-history.model.js';

export abstract class AssetRepositoryPort {
  abstract findById(id: string): Promise<Asset | null>;
  abstract findByIdWithHistory(id: string): Promise<Asset | null>;
  abstract findByQrCode(qrCode: string): Promise<Asset | null>;
  abstract save(asset: Asset): Promise<Asset>;
  abstract findAll(): Promise<Asset[]>;
  abstract findAllWithFilters(filters: {
    estado?: string;
    codigo?: string;
    unidad?: string;
  }): Promise<Asset[]>;
  abstract recordStatusChange(history: AssetStatusHistory): Promise<AssetStatusHistory>;
  abstract saveMaintenanceReport(report: {
    assetId: string;
    diagnosis: string;
    estimatedCost: number;
    action: string;
  }): Promise<void>;
}
