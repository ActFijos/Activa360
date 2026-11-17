import { Module } from '@nestjs/common';
import { ScanQrUseCase } from './domain/ports/in/scan-qr.use-case.js';
import { ScanQrService } from './domain/services/scan-qr.service.js';
import { AssetRepositoryPort } from './domain/ports/out/asset-repository.port.js';
import { PrismaAssetAdapter } from './adapters/out/db/prisma-asset.adapter.js';
import { MovementRepositoryPort } from './domain/ports/out/movement-repository.port.js';
import { InMemoryMovementRepository } from './adapters/out/persistence/in-memory-movement.repository.js';
import { ScanQrController } from './adapters/in/web/scan-qr.controller.js';
import { RegisterAssetController } from './adapters/in/web/register-asset.controller.js';
import { RegisterAssetUseCase } from './domain/ports/in/register-asset.use-case.js';
import { RegisterAssetService } from './domain/services/register-asset.service.js';
import { SyncOfflineUseCase } from './domain/ports/in/sync-offline.use-case.js';
import { SyncOfflineService } from './domain/services/sync-offline.service.js';
import { PrismaService } from '../compliance/adapters/out/db/prisma.service.js';

// Asignaciones
import { AssignAssetController } from './adapters/in/web/assign-asset.controller.js';
import { AssignAssetUseCase } from './domain/ports/in/assign-asset.use-case.js';
import { AssignAssetService } from './domain/services/assign-asset.service.js';
import { AssignmentRepositoryPort } from './domain/ports/out/assignment-repository.port.js';
import { PrismaAssignmentAdapter } from './adapters/out/db/prisma-assignment.adapter.js';

// Transferencias
import { TransferAssetController } from './adapters/in/web/transfer-asset.controller.js';
import { TransferAssetUseCase } from './domain/ports/in/transfer-asset.use-case.js';
import { TransferAssetService } from './domain/services/transfer-asset.service.js';
import { TransferRepositoryPort } from './domain/ports/out/transfer-repository.port.js';
import { PrismaTransferAdapter } from './adapters/out/db/prisma-transfer.adapter.js';

// Inventario QR (Feature 1 + Feature 2)
import { InventoryScanController } from './adapters/in/web/inventory-scan.controller.js';
import { RegisterInventoryScanUseCase } from './domain/ports/in/register-inventory-scan.use-case.js';
import { RegisterInventoryScanService } from './domain/services/register-inventory-scan.service.js';
import { InventoryRecordRepositoryPort } from './domain/ports/out/inventory-record-repository.port.js';
import { PrismaInventoryRecordAdapter } from './adapters/out/db/prisma-inventory-record.adapter.js';

// Features Release 8.2.0 - Josefina Rojas:
// Feature 1: Control de Estados Patrimoniales SABS
import { ChangeAssetStatusUseCase } from './domain/ports/in/change-asset-status.use-case.js';
import { ChangeAssetStatusService } from './domain/services/change-asset-status.service.js';

// Feature 2: Diagnóstico Técnico Previo a Bajas SABS
import { DiagnosticoController } from './adapters/in/web/diagnostico.controller.js';
import { CreateDiagnosticoUseCase } from './domain/ports/in/create-diagnostico.use-case.js';
import { CreateDiagnosticoService } from './domain/services/create-diagnostico.service.js';
import { ListDiagnosticosUseCase } from './domain/ports/in/list-diagnosticos.use-case.js';
import { ListDiagnosticosService } from './domain/services/list-diagnosticos.service.js';
import { GetDiagnosticoByIdUseCase } from './domain/ports/in/get-diagnostico-by-id.use-case.js';
import { GetDiagnosticoByIdService } from './domain/services/get-diagnostico-by-id.service.js';
import { DiagnosticoRepositoryPort } from './domain/ports/out/diagnostico-repository.port.js';
import { PrismaDiagnosticoAdapter } from './adapters/out/db/prisma-diagnostico.adapter.js';

// Reportes
import { ReportsStatsController } from './adapters/in/web/reports-stats.controller.js';

// Usuarios
import { UsersController } from './adapters/in/web/users.controller.js';

@Module({
  controllers: [
    ScanQrController,
    RegisterAssetController,
    DiagnosticoController,
    AssignAssetController,
    TransferAssetController,
    InventoryScanController,
    ReportsStatsController,
    UsersController,
  ],
  providers: [
    PrismaService,
    {
      provide: ScanQrUseCase,
      useClass: ScanQrService,
    },
    {
      provide: SyncOfflineUseCase,
      useClass: SyncOfflineService,
    },
    {
      provide: RegisterAssetUseCase,
      useClass: RegisterAssetService,
    },
    {
      provide: ChangeAssetStatusUseCase,
      useClass: ChangeAssetStatusService,
    },
    {
      provide: CreateDiagnosticoUseCase,
      useClass: CreateDiagnosticoService,
    },
    {
      provide: ListDiagnosticosUseCase,
      useClass: ListDiagnosticosService,
    },
    {
      provide: GetDiagnosticoByIdUseCase,
      useClass: GetDiagnosticoByIdService,
    },
    {
      provide: DiagnosticoRepositoryPort,
      useClass: PrismaDiagnosticoAdapter,
    },
    {
      provide: AssignAssetUseCase,
      useClass: AssignAssetService,
    },
    {
      provide: TransferAssetUseCase,
      useClass: TransferAssetService,
    },
    {
      provide: AssetRepositoryPort,
      useClass: PrismaAssetAdapter,
    },
    {
      provide: AssignmentRepositoryPort,
      useClass: PrismaAssignmentAdapter,
    },
    {
      provide: TransferRepositoryPort,
      useClass: PrismaTransferAdapter,
    },
    {
      provide: MovementRepositoryPort,
      useClass: InMemoryMovementRepository,
    },
    {
      provide: RegisterInventoryScanUseCase,
      useClass: RegisterInventoryScanService,
    },
    {
      provide: InventoryRecordRepositoryPort,
      useClass: PrismaInventoryRecordAdapter,
    },
  ],
  exports: [
    ScanQrUseCase,
    SyncOfflineUseCase,
    RegisterAssetUseCase,
    ChangeAssetStatusUseCase,
    CreateDiagnosticoUseCase,
    ListDiagnosticosUseCase,
    GetDiagnosticoByIdUseCase,
    DiagnosticoRepositoryPort,
    AssignAssetUseCase,
    TransferAssetUseCase,
    AssetRepositoryPort,
    AssignmentRepositoryPort,
    TransferRepositoryPort,
    MovementRepositoryPort,
    RegisterInventoryScanUseCase,
    InventoryRecordRepositoryPort,
  ],
})
export class InventoryModule {}
