import { Asset } from '../../models/asset.model';

export abstract class AssetRepositoryPort {
  abstract findById(id: string): Promise<Asset | null>;
  abstract findByQrCode(qrCode: string): Promise<Asset | null>;
  abstract save(asset: Asset): Promise<Asset>;
  abstract findAll(): Promise<Asset[]>;
}
