import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Habilitar CORS para permitir llamadas desde el frontend

  // ── Contrato OpenAPI ────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Activa360 API')
    .setDescription(
      'API de gestión de activos fijos — Inventario QR, Transferencias y Bajas SABS',
    )
    .setVersion('8.2.0')
    .addTag('inventario', 'Escaneo QR y registro de inventario por campaña')
    .addTag('activos', 'Registro, asignación y transferencia de activos')
    .addTag('compliance', 'Bajas SABS y flujos de cumplimiento normativo')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    jsonDocumentUrl: 'api-docs/json',
  });
  // ────────────────────────────────────────────────────────────────────────

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
