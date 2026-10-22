export interface ExternalAsset {
  id: string;
  status: string;
  location: string;
}

export abstract class AssetServicePort {
  abstract getAsset(id: string): Promise<ExternalAsset | null>;
  abstract updateAssetStatus(id: string, status: string): Promise<void>;
}
