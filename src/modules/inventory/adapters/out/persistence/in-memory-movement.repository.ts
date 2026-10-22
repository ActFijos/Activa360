import { Injectable } from '@nestjs/common';
import { MovementRepositoryPort } from '../../../domain/ports/out/movement-repository.port';
import { Movement } from '../../../domain/models/movement.model';

@Injectable()
export class InMemoryMovementRepository implements MovementRepositoryPort {
  public readonly movements: Movement[] = [];

  async save(movement: Movement): Promise<Movement> {
    this.movements.push(movement);
    return movement;
  }

  async existsDuplicate(
    assetId: string,
    latitude: number,
    longitude: number,
    timestamp: Date,
  ): Promise<boolean> {
    // Verificar si ya hay un movimiento registrado para este activo,
    // en las mismas coordenadas, con una diferencia menor a 1 minuto (60,000 ms)
    const oneMinuteMs = 60 * 1000;
    return this.movements.some((m) => {
      const timeDiff = Math.abs(m.scannedAt.getTime() - timestamp.getTime());
      return (
        m.assetId === assetId &&
        m.latitude === latitude &&
        m.longitude === longitude &&
        timeDiff < oneMinuteMs
      );
    });
  }
}
