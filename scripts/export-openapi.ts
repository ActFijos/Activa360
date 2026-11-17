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
import { AppModule } from '../dist/src/app.module.js';

async function exportOpenApi() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('Activa360 API')
    .setDescription(
      'API de gestión de activos fijos — Inventario QR, Transferencias, Control de Estados Patrimoniales, Diagnósticos Técnicos y Bajas SABS',
    )
    .setVersion('8.2.0')
    .addServer('http://localhost:3000', 'Servidor local de desarrollo')
    .addTag('activos', 'Registro, administración, consulta y transición de estados patrimoniales SABS')
    .addTag('diagnosticos', 'Emisión, consulta y restauración de informes técnicos previos a bajas SABS')
    .addTag('compliance', 'Bajas SABS y flujos de cumplimiento normativo')
    .addTag('inventario', 'Escaneo QR y registro de inventario por campaña')
    .addTag('reportes', 'Estadísticas, depreciación, inventario y valoración patrimonial')
    .addTag('usuarios', 'Gestión de usuarios y personal del sistema')
    .addTag('asistente', 'Consultas en lenguaje natural y asistencia inteligente con protocolo MCP')
    .addTag('app', 'Endpoints base y salud del sistema')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const outputPath = resolve(process.cwd(), 'openapi.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2), { encoding: 'utf8' });

  console.log(`✅ openapi.json generado en: ${outputPath}`);
  try {
    await app.close();
  } catch {}
  process.exit(0);
}

exportOpenApi().catch((err) => {
  console.error('❌ Error al exportar OpenAPI:', err);
  process.exit(1);
});
