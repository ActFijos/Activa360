import { Test, TestingModule } from '@nestjs/testing';
import { ScanQrService } from './domain/services/scan-qr.service';
import { TransferAssetService } from './domain/services/transfer-asset.service';
import { AssetRepositoryPort } from './domain/ports/out/asset-repository.port';
import { MovementRepositoryPort } from './domain/ports/out/movement-repository.port';
import { TransferRepositoryPort } from './domain/ports/out/transfer-repository.port';
import { AssignmentRepositoryPort } from './domain/ports/out/assignment-repository.port';
import { InMemoryAssetRepository } from './adapters/out/persistence/in-memory-asset.repository';
import { InMemoryMovementRepository } from './adapters/out/persistence/in-memory-movement.repository';
import { Asset, AssetStatus } from './domain/models/asset.model';
import { Transfer } from './domain/models/transfer.model';

describe('Flujo de Integración 1: Ciclo Completo de Inventario y Movilidad', () => {
  let scanQrService: ScanQrService;
  let transferService: TransferAssetService;
  let assetRepo: InMemoryAssetRepository;
  let movementRepo: InMemoryMovementRepository;
  let fakeTransferRepo: jest.Mocked<TransferRepositoryPort>;
  let fakeAssignmentRepo: jest.Mocked<AssignmentRepositoryPort>;

  beforeEach(async () => {
    const savedTransfers: Transfer[] = [];

    fakeTransferRepo = {
      save: jest.fn().mockImplementation((t: Transfer) => {
        savedTransfers.push(t);
        return Promise.resolve(t);
      }),
      findById: jest.fn().mockImplementation((id: string) =>
        Promise.resolve(savedTransfers.find((t) => t.id === id) || null),
      ),
      findAll: jest.fn().mockResolvedValue(savedTransfers),
    };

    fakeAssignmentRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScanQrService,
        TransferAssetService,
        { provide: AssetRepositoryPort, useClass: InMemoryAssetRepository },
        { provide: MovementRepositoryPort, useClass: InMemoryMovementRepository },
        { provide: TransferRepositoryPort, useValue: fakeTransferRepo },
        { provide: AssignmentRepositoryPort, useValue: fakeAssignmentRepo },
      ],
    }).compile();

    scanQrService = module.get<ScanQrService>(ScanQrService);
    transferService = module.get<TransferAssetService>(TransferAssetService);
    assetRepo = module.get<AssetRepositoryPort>(
      AssetRepositoryPort,
    ) as InMemoryAssetRepository;
    movementRepo = module.get<MovementRepositoryPort>(
      MovementRepositoryPort,
    ) as InMemoryMovementRepository;
  });

  it('debería recorrer el flujo completo: Escaneo QR -> Registro de Movimiento Geográfico -> Solicitud de Transferencia entre Unidades', async () => {
    // 1. DADO: Un activo inicializado en el inventario central
    const initialAsset = new Asset(
      'asset-flow-1',
      'QR-FLOW-100',
      'Laptop ThinkPad T14',
      AssetStatus.NUEVO,
      'Almacén Central',
      new Date('2026-09-01T08:00:00Z'),
    );
    await assetRepo.save(initialAsset);

    // 2. CUANDO (Paso 1): El inspector realiza el escaneo de QR en terreno con coordenadas GPS
    const scannedAsset = await scanQrService.execute(
      'QR-FLOW-100',
      -17.3895,
      -66.1568,
    );

    // ENTONCES (Verificación Paso 1): El estado se actualiza y la ubicación refleja coordenadas GPS
    expect(scannedAsset.id).toBe('asset-flow-1');
    expect(scannedAsset.location).toContain('Lat: -17.3895, Long: -66.1568');

    // Comprobar recorrido de persistencia intermedia (Movimiento registrado en auditoría)
    expect(movementRepo.movements.length).toBe(1);
    expect(movementRepo.movements[0].assetId).toBe('asset-flow-1');
    expect(movementRepo.movements[0].latitude).toBe(-17.3895);

    // 3. CUANDO (Paso 2): Se procesa una solicitud de transferencia de unidad
    const transferCommand = {
      assetId: 'asset-flow-1',
      toUnit: 'Departamento de Auditoría',
      toResponsible: 'Lic. Gonzalo Vargas',
      date: new Date('2026-09-07T10:00:00Z'),
      reason: 'Asignación por auditoría de gestión',
    };

    const transferResult = await transferService.execute(transferCommand);

    // ENTONCES (Verificación Paso 2): Se valida que la transferencia completa se registró
    expect(transferResult.id).toBeDefined();
    expect(transferResult.assetId).toBe('asset-flow-1');
    expect(transferResult.fromUnit).toContain('Lat: -17.3895');
    expect(transferResult.toUnit).toBe('Departamento de Auditoría');
    expect(transferResult.toResponsible).toBe('Lic. Gonzalo Vargas');
    expect(transferResult.status).toBe('Pendiente');

    // Comprobar que el repositorio de transferencias almacenó la entidad resultante
    const allTransfers = await fakeTransferRepo.findAll();
    expect(allTransfers.length).toBe(1);
    expect(allTransfers[0].reason).toBe('Asignación por auditoría de gestión');
  });
});
