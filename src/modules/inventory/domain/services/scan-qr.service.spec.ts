import { Test, TestingModule } from '@nestjs/testing';
import { ScanQrService } from './scan-qr.service';
import { AssetRepositoryPort } from '../ports/out/asset-repository.port';
import { MovementRepositoryPort } from '../ports/out/movement-repository.port';
import { InMemoryAssetRepository } from '../../adapters/out/persistence/in-memory-asset.repository';
import { InMemoryMovementRepository } from '../../adapters/out/persistence/in-memory-movement.repository';
import { Asset, AssetStatus } from '../models/asset.model';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('ScanQrService (FSD-UC-001)', () => {
  let service: ScanQrService;
  let assetRepo: InMemoryAssetRepository;
  let movementRepo: InMemoryMovementRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScanQrService,
        { provide: AssetRepositoryPort, useClass: InMemoryAssetRepository },
        {
          provide: MovementRepositoryPort,
          useClass: InMemoryMovementRepository,
        },
      ],
    }).compile();

    service = module.get<ScanQrService>(ScanQrService);
    assetRepo = module.get<AssetRepositoryPort>(
      AssetRepositoryPort,
    ) as InMemoryAssetRepository;
    movementRepo = module.get<MovementRepositoryPort>(
      MovementRepositoryPort,
    ) as InMemoryMovementRepository;
  });

  it('debería mostrar los datos del activo y permitir actualizar ubicación y estado cuando se escanea un QR válido', async () => {
    // Dado un activo registrado en el sistema con código QR
    const asset = new Asset(
      'asset-uuid-1',
      'QR-TEST-123',
      'Computadora Portátil Dell',
      AssetStatus.NUEVO,
      'Oficina Central',
      new Date(),
    );
    await assetRepo.save(asset);

    // Cuando el inventariador escanea el código QR con la app
    const updatedAsset = await service.execute(
      'QR-TEST-123',
      -17.3935,
      -66.157,
    );

    // Entonces el sistema muestra los datos del activo
    expect(updatedAsset.id).toBe('asset-uuid-1');
    expect(updatedAsset.name).toBe('Computadora Portátil Dell');
    expect(updatedAsset.qrCode).toBe('QR-TEST-123');

    // Y permite actualizar ubicación y estado
    expect(updatedAsset.location).toBe('Lat: -17.3935, Long: -66.157');
    expect(updatedAsset.updatedAt).toBeInstanceOf(Date);

    // Y se guarda el movimiento en el repositorio
    expect(movementRepo.movements.length).toBe(1);
    expect(movementRepo.movements[0].assetId).toBe('asset-uuid-1');
    expect(movementRepo.movements[0].latitude).toBe(-17.3935);
  });

  it('debería lanzar NotFoundException si el activo con código QR no existe', async () => {
    await expect(
      service.execute('QR-UNKNOWN', -17.3935, -66.157),
    ).rejects.toThrow(NotFoundException);
  });

  it('debería lanzar ConflictException si se detecta un escaneo duplicado dentro del mismo minuto', async () => {
    const asset = new Asset(
      'asset-uuid-1',
      'QR-TEST-123',
      'Computadora Portátil Dell',
      AssetStatus.NUEVO,
      'Oficina Central',
      new Date(),
    );
    await assetRepo.save(asset);

    // Primer escaneo exitoso
    await service.execute('QR-TEST-123', -17.3935, -66.157);

    // Segundo escaneo (duplicado) con la misma ubicación y tiempo cercano
    await expect(
      service.execute('QR-TEST-123', -17.3935, -66.157),
    ).rejects.toThrow(ConflictException);
  });
});
