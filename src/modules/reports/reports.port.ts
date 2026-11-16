// El contrato del módulo de reportes y estadísticas patrimoniales:
// lo ÚNICO que el resto de la API conoce de él.
//
// REGLA DE FRONTERA: fuera de reports/, solo se importa este archivo y reports.module.ts.
// Nunca una clase interna (ReportsService, ReportsHttp, ...).

export interface DistributionItem {
  name: string;
  value: number;
}

export interface ReportStatsResult {
  totalAssets: number;
  totalValue: number;
  monthlyDepreciation: number;
  maintenanceCount: number;
  categoryDistribution: DistributionItem[];
  statusDistribution: DistributionItem[];
  locationDistribution: DistributionItem[];
}

export interface ReportQueryOptions {
  startDate?: string;
  endDate?: string;
  location?: string;
}

// deadline = el plazo de quien llama: una señal que avisa «se acabó el tiempo, cancela».
export interface ReportsPort {
  getStats(options: ReportQueryOptions, deadline: AbortSignal): Promise<ReportStatsResult>;
}

// Token de inyección de dependencias para NestJS
export const REPORTS = Symbol('REPORTS');

/** El módulo no respondió a tiempo, está caído o el circuito está abierto. */
export class ReportsNoDisponible extends Error {
  constructor(readonly motivo: string, opciones?: { cause?: unknown }) {
    super(`reportes no disponible: ${motivo}`, opciones);
  }
}

