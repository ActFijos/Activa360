import { Baja } from '../../models/baja.model.js';

export interface ListBajasFilters {
  estado?: string;
  activo?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedBajas {
  data: Baja[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export abstract class ListBajasUseCase {
  abstract execute(filters: ListBajasFilters): Promise<PaginatedBajas>;
}
