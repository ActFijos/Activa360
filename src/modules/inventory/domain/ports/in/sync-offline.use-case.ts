import { AssetStatus } from '../../models/asset.model';

export interface SyncItem {
  qrCode: string;
  latitude: number;
  longitude: number;
  status?: AssetStatus;
  updatedAt: Date;
}

export interface SyncResult {
  processedCount: number;
  ignoredCount: number;
}

export abstract class SyncOfflineUseCase {
  abstract execute(items: SyncItem[]): Promise<SyncResult>;
}
