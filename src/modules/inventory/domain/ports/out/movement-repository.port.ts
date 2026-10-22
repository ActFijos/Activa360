import { Movement } from '../../models/movement.model';

export abstract class MovementRepositoryPort {
  abstract save(movement: Movement): Promise<Movement>;
  abstract existsDuplicate(
    assetId: string,
    latitude: number,
    longitude: number,
    timestamp: Date,
  ): Promise<boolean>;
}
