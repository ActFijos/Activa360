// Forma 1, monolito modular: la llamada directa, en el mismo proceso de Node.
import { Injectable } from '@nestjs/common';
import type { ConEstadisticas, Estadisticas } from './estadisticas';
import { type ReportQueryOptions, type ReportStatsResult, type ReportsPort } from './reports.port';
import { ReportsService } from './reports.service';

@Injectable()
export class ReportsEnProceso implements ReportsPort, ConEstadisticas {
  private llamadas = 0;

  constructor(private readonly service: ReportsService) {}

  async getStats(options: ReportQueryOptions, _deadline: AbortSignal): Promise<ReportStatsResult> {
    this.llamadas++;
    return this.service.calculateStats(options);
  }

  estadisticas(): Estadisticas {
    return { modo: 'proceso', llamadas: this.llamadas };
  }
}

