import { Baja } from '../../models/baja.model';

export abstract class InitiateBajaUseCase {
  abstract execute(
    assetId: string,
    jefeId: string,
    justification: string,
    evidence: string,
  ): Promise<Baja>;
}
