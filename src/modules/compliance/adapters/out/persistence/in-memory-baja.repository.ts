import { Injectable } from '@nestjs/common';
import { BajaRepositoryPort } from '../../../domain/ports/out/baja-repository.port.js';
import { Baja } from '../../../domain/models/baja.model.js';
import { ListBajasFilters, PaginatedBajas } from '../../../domain/ports/in/list-bajas.use-case.js';

@Injectable()
export class InMemoryBajaRepository implements BajaRepositoryPort {
  public readonly bajas: Baja[] = [];

  async save(baja: Baja): Promise<Baja> {
    const index = this.bajas.findIndex((b) => b.id === baja.id);
    if (index >= 0) {
      this.bajas[index] = baja;
    } else {
      this.bajas.push(baja);
    }
    return baja;
  }

  async findById(id: string): Promise<Baja | null> {
    const baja = this.bajas.find((b) => b.id === id);
    return baja || null;
  }

  async findByAssetId(assetId: string): Promise<Baja | null> {
    const baja = this.bajas.find((b) => b.assetId === assetId);
    return baja || null;
  }

  async findPaginated(filters: ListBajasFilters): Promise<PaginatedBajas> {
    let list = [...this.bajas];

    if (filters.estado) {
      const target = filters.estado.toLowerCase();
      list = list.filter((b) => b.status.toLowerCase() === target);
    }

    if (filters.activo) {
      const q = filters.activo.toLowerCase();
      list = list.filter((b) => b.assetId.toLowerCase().includes(q));
    }

    if (filters.fechaDesde) {
      const from = new Date(filters.fechaDesde).getTime();
      list = list.filter((b) => new Date(b.initiatedAt).getTime() >= from);
    }

    if (filters.fechaHasta) {
      const to = new Date(filters.fechaHasta).getTime();
      list = list.filter((b) => new Date(b.initiatedAt).getTime() <= to);
    }

    const total = list.length;
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;
    const data = list.slice(skip, skip + limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }
}
