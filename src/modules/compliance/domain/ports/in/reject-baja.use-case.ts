import { Baja } from '../../models/baja.model.js';

export abstract class RejectBajaUseCase {
  abstract execute(id: string, motivoRechazo: string): Promise<Baja>;
}
