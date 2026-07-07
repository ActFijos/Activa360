import { Injectable } from '@nestjs/common';
import { BajaRepositoryPort } from '../../../domain/ports/out/baja-repository.port';
import { Baja } from '../../../domain/models/baja.model';

@Injectable()
export class InMemoryBajaRepository implements BajaRepositoryPort {
  public readonly bajas: Baja[] = [];

  async save(baja: Baja): Promise<Baja> {
    this.bajas.push(baja);
    return baja;
  }

  async findByAssetId(assetId: string): Promise<Baja | null> {
    const baja = this.bajas.find((b) => b.assetId === assetId);
    return baja || null;
  }
}
