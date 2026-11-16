// Punto de entrada: SOLO el módulo de reportes como servicio aparte (forma extraída).
//   node dist/main-reports.js
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ReportsServicioModule } from './modules/reports/reports-servicio.module';

async function bootstrap() {
  const app = await NestFactory.create(ReportsServicioModule, { logger: ['error', 'warn', 'log'] });
  app.enableShutdownHooks();
  const puerto = Number(process.env.PORT ?? 3001);
  await app.listen(puerto, '0.0.0.0');
  console.log(`Servicio de Reportes escuchando en el puerto ${puerto}`);
}

bootstrap().catch((err) => {
  console.error('No se pudo arrancar el servicio de reportes:', err?.message ?? err);
  process.exit(1);
});

