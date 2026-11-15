import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { InitiateBajaUseCase } from './domain/ports/in/initiate-baja.use-case';
import { InitiateBajaService } from './domain/services/initiate-baja.service';
import { ListBajasUseCase } from './domain/ports/in/list-bajas.use-case.js';
import { ListBajasService } from './domain/services/list-bajas.service.js';
import { RejectBajaUseCase } from './domain/ports/in/reject-baja.use-case.js';
import { RejectBajaService } from './domain/services/reject-baja.service.js';
import { BajaRepositoryPort } from './domain/ports/out/baja-repository.port.js';
import { AssetServicePort } from './domain/ports/out/asset-service.port';
import { InventoryAdapter } from './adapters/out/inventory/inventory.adapter';
import { InitiateBajaController } from './adapters/in/web/initiate-baja.controller';
import { PrismaService } from './adapters/out/db/prisma.service.js';
import { PrismaBajaAdapter } from './adapters/out/db/prisma-baja.adapter.js';

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
      provide: ListBajasUseCase,
      useClass: ListBajasService,
    },
    {
      provide: RejectBajaUseCase,
      useClass: RejectBajaService,
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
    ListBajasUseCase,
    RejectBajaUseCase,
    BajaRepositoryPort,
    AssetServicePort,
    PrismaService,
  ],
})
export class ComplianceModule {}
