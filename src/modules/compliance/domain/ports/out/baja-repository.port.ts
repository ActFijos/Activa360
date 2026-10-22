import { Baja } from '../../models/baja.model';

export abstract class BajaRepositoryPort {
  abstract save(baja: Baja): Promise<Baja>;
  abstract findByAssetId(assetId: string): Promise<Baja | null>;
}
