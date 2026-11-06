// GET /stats de la API: contadores de la implementación de reportes en uso (los lee k6).
import { Controller, Get, Inject } from '@nestjs/common';
import type { ConEstadisticas } from './estadisticas';
import { REPORTS, type ReportsPort } from './reports.port';

@Controller('stats')
export class EstadisticasController {
  constructor(@Inject(REPORTS) private readonly reports: ReportsPort & ConEstadisticas) {}

  @Get()
  stats() {
    return this.reports.estadisticas();
  }
}

