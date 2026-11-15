import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { InitiateBajaUseCase } from './domain/ports/in/initiate-baja.use-case';
import { InitiateBajaService } from './domain/services/initiate-baja.service';
import { BajaRepositoryPort } from './domain/ports/out/baja-repository.port.js';
import { AssetServicePort } from './domain/ports/out/asset-service.port';
import { InventoryAdapter } from './adapters/out/inventory/inventory.adapter';
import { InitiateBajaController } from './adapters/in/web/initiate-baja.controller';
import { PrismaService } from './adapters/out/db/prisma.service.js';
import { PrismaBajaAdapter } from './adapters/out/db/prisma-baja.adapter.js';
import { GenerateActaPdfUseCase } from './domain/ports/in/generate-acta-pdf.use-case.js';
import { GenerateActaPdfService } from './domain/services/generate-acta-pdf.service.js';

@Module({
  imports: [InventoryModule],
  controllers: [InitiateBajaController],
  providers: [
    PrismaService,
    {
      provide: InitiateBajaUseCase,
      useClass: InitiateBajaService,
    },
    {
      provide: GenerateActaPdfUseCase,
      useClass: GenerateActaPdfService,
    },
    {
      provide: BajaRepositoryPort,
      useClass: PrismaBajaAdapter,
    },
    {
      provide: AssetServicePort,
      useClass: InventoryAdapter,
    },
  ],
  exports: [
    InitiateBajaUseCase,
    GenerateActaPdfUseCase,
    BajaRepositoryPort,
    AssetServicePort,
    PrismaService,
  ],
})
export class ComplianceModule {}
