import { Test, TestingModule } from '@nestjs/testing';
import { SyncOfflineService } from './sync-offline.service';
import { AssetRepositoryPort } from '../ports/out/asset-repository.port';
import { MovementRepositoryPort } from '../ports/out/movement-repository.port';
import { InMemoryAssetRepository } from '../../adapters/out/persistence/in-memory-asset.repository';
import { InMemoryMovementRepository } from '../../adapters/out/persistence/in-memory-movement.repository';
import { Asset, AssetStatus } from '../models/asset.model';
import { NotFoundException } from '@nestjs/common';

describe('SyncOfflineService (FSD-UC-002)', () => {
  let service: SyncOfflineService;
  let assetRepo: InMemoryAssetRepository;
  let movementRepo: InMemoryMovementRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncOfflineService,
        { provide: AssetRepositoryPort, useClass: InMemoryAssetRepository },
        {
          provide: MovementRepositoryPort,
          useClass: InMemoryMovementRepository,
        },
      ],
    }).compile();

    service = module.get<SyncOfflineService>(SyncOfflineService);
    assetRepo = module.get<AssetRepositoryPort>(
      AssetRepositoryPort,
    ) as InMemoryAssetRepository;
    movementRepo = module.get<MovementRepositoryPort>(
      MovementRepositoryPort,
    ) as InMemoryMovementRepository;

    // Limpiar base de datos mock antes de cada test
    assetRepo.assets.clear();
    movementRepo.movements.length = 0;
  });

  it('debería procesar con éxito los activos cuando el timestamp offline es más reciente', async () => {
    // Dado un activo en el servidor con timestamp inicial
    const baseDate = new Date('2026-06-26T10:00:00.000Z');
    const asset = new Asset(
      'asset-uuid-1',
      'QR-TEST-1',
      'Escritorio de Madera',
      AssetStatus.NUEVO,
      'Oficina 1',
      baseDate,
    );
    await assetRepo.save(asset);

    // Cuando el sistema recibe un lote con una actualización posterior
    const offlineDate = new Date('2026-06-26T11:00:00.000Z');
    const syncItem = {
      qrCode: 'QR-TEST-1',
      latitude: -17.3935,
      longitude: -66.157,
      status: AssetStatus.ASIGNADO,
      updatedAt: offlineDate,
    };

    const result = await service.execute([syncItem]);

    // Entonces se incrementa processedCount
    expect(result.processedCount).toBe(1);
    expect(result.ignoredCount).toBe(0);

    // Y se actualizan los datos del activo en el servidor
    const updatedAsset = await assetRepo.findByQrCode('QR-TEST-1');
    expect(updatedAsset).not.toBeNull();
    expect(updatedAsset!.location).toBe('Lat: -17.3935, Long: -66.157');
    expect(updatedAsset!.status).toBe(AssetStatus.ASIGNADO);
    expect(updatedAsset!.updatedAt.getTime()).toBe(offlineDate.getTime());

    // Y se genera un movimiento con el timestamp offline
    expect(movementRepo.movements.length).toBe(1);
    expect(movementRepo.movements[0].assetId).toBe('asset-uuid-1');
    expect(movementRepo.movements[0].scannedAt.getTime()).toBe(offlineDate.getTime());
  });

  it('debería ignorar la actualización si el timestamp offline es anterior o igual al del servidor (conflicto)', async () => {
    // Dado un activo en el servidor con timestamp inicial
    const serverDate = new Date('2026-06-26T12:00:00.000Z');
    const asset = new Asset(
      'asset-uuid-1',
      'QR-TEST-1',
      'Escritorio de Madera',
      AssetStatus.ASIGNADO,
      'Oficina 2',
      serverDate,
    );
    await assetRepo.save(asset);

    // Cuando el sistema recibe un lote con actualización anterior o igual
    const offlineDate = new Date('2026-06-26T11:00:00.000Z'); // anterior
    const syncItem = {
      qrCode: 'QR-TEST-1',
      latitude: -17.3935,
      longitude: -66.157,
      status: AssetStatus.DANADO,
      updatedAt: offlineDate,
    };

    const result = await service.execute([syncItem]);

    // Entonces se incrementa ignoredCount y processedCount es 0
    expect(result.processedCount).toBe(0);
    expect(result.ignoredCount).toBe(1);

    // Y el activo del servidor mantiene sus valores más recientes
    const updatedAsset = await assetRepo.findByQrCode('QR-TEST-1');
    expect(updatedAsset!.location).toBe('Oficina 2');
    expect(updatedAsset!.status).toBe(AssetStatus.ASIGNADO);
    expect(updatedAsset!.updatedAt.getTime()).toBe(serverDate.getTime());

    // Y no se registra ningún movimiento para este elemento ignorado
    expect(movementRepo.movements.length).toBe(0);
  });

  it('debería lanzar NotFoundException y abortar todo el lote si algún activo no existe', async () => {
    // Dado un activo válido
    const serverDate = new Date('2026-06-26T10:00:00.000Z');
    const asset = new Asset(
      'asset-uuid-1',
      'QR-TEST-VALIDO',
      'Escritorio de Madera',
      AssetStatus.NUEVO,
      'Oficina 1',
      serverDate,
    );
    await assetRepo.save(asset);

    // Cuando el lote contiene un activo válido y uno inexistente
    const items = [
      {
        qrCode: 'QR-TEST-VALIDO',
        latitude: -17.3935,
        longitude: -66.157,
        status: AssetStatus.ASIGNADO,
        updatedAt: new Date('2026-06-26T11:00:00.000Z'),
      },
      {
        qrCode: 'QR-INEXISTENTE',
        latitude: -17.3935,
        longitude: -66.157,
        status: AssetStatus.ASIGNADO,
        updatedAt: new Date('2026-06-26T11:00:00.000Z'),
      },
    ];

    // Entonces la ejecución debe fallar con NotFoundException
    await expect(service.execute(items)).rejects.toThrow(NotFoundException);

    // Y ningún cambio del lote debe haberse persistido (transaccionalidad)
    const dbAsset = await assetRepo.findByQrCode('QR-TEST-VALIDO');
    expect(dbAsset!.status).toBe(AssetStatus.NUEVO); // Mantiene su estado inicial, no cambió a ASIGNADO
    expect(dbAsset!.location).toBe('Oficina 1');
    expect(movementRepo.movements.length).toBe(0); // Ningún movimiento registrado
  });
});
