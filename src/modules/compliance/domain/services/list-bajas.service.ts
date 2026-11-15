import { Injectable, Inject } from '@nestjs/common';
import {
  ListBajasUseCase,
  ListBajasFilters,
  PaginatedBajas,
} from '../ports/in/list-bajas.use-case.js';
import { BajaRepositoryPort } from '../ports/out/baja-repository.port.js';

@Injectable()
export class ListBajasService implements ListBajasUseCase {
  constructor(
    @Inject(BajaRepositoryPort)
    private readonly bajaRepository: BajaRepositoryPort,
  ) {}

  async execute(filters: ListBajasFilters): Promise<PaginatedBajas> {
    return this.bajaRepository.findPaginated(filters);
  }
}
