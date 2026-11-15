import { Baja } from '../../models/baja.model.js';
import { ListBajasFilters, PaginatedBajas } from '../in/list-bajas.use-case.js';

export abstract class BajaRepositoryPort {
  abstract save(baja: Baja): Promise<Baja>;
  abstract findById(id: string): Promise<Baja | null>;
  abstract findByAssetId(assetId: string): Promise<Baja | null>;
  abstract findPaginated(filters: ListBajasFilters): Promise<PaginatedBajas>;
}
