/**
 * scripts/export-openapi.ts
 *
 * Genera el archivo openapi.json desde el código NestJS sin levantar el servidor.
 * Uso: npx ts-node -r tsconfig-paths/register scripts/export-openapi.ts
 * O desde package.json: npm run openapi:export
 */
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { AppModule } from '../src/app.module.js';

async function exportOpenApi() {
  const app = await NestFactory.create(AppModule, { logger: false });

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

  const outputPath = resolve(process.cwd(), 'openapi.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2), { encoding: 'utf8' });

  console.log(`✅ openapi.json generado en: ${outputPath}`);
  await app.close();
}

exportOpenApi().catch((err) => {
  console.error('❌ Error al exportar OpenAPI:', err);
  process.exit(1);
});
