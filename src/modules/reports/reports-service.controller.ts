import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller()
export class ReportsServiceController {
  constructor(private readonly service: ReportsService) {}

  @Get('salud')
  salud() {
    return { ok: true, servicio: 'reports' };
  }

  @Get('activos/reportes/estadisticas')
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('location') location?: string,
  ) {
    return this.service.calculateStats({ startDate, endDate, location });
  }
}

