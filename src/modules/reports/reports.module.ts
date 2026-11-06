// El módulo de reportes tal como lo ve la API: entrega REPORTS con la forma elegida.
import { Module } from '@nestjs/common';
import { PrismaService } from '../compliance/adapters/out/db/prisma.service';
import { EstadisticasController } from './estadisticas.controller';
import { ReportsEnProceso } from './reports-en-proceso';
import { ReportsHttp } from './reports-http';
import { REPORTS } from './reports.port';
import { ReportsService } from './reports.service';

// REPORTS_MODO se lee al arrancar:
//   http        -> ReportsHttp: por la red, a REPORTS_URL, con plazo, reintentos y breaker
//   otro valor  -> ReportsEnProceso: llamada directa en proceso
@Module({
  controllers: [EstadisticasController],
  providers: [
    PrismaService,
    ReportsService,
    {
      provide: REPORTS,
      useClass: process.env.REPORTS_MODO === 'http' ? ReportsHttp : ReportsEnProceso,
    },
  ],
  exports: [REPORTS],
})
export class ReportsModule {}

