import { Test, TestingModule } from '@nestjs/testing';
import { TransferAssetService } from './transfer-asset.service';
import { AssetRepositoryPort } from '../ports/out/asset-repository.port';
import { TransferRepositoryPort } from '../ports/out/transfer-repository.port';
import { AssignmentRepositoryPort } from '../ports/out/assignment-repository.port';
import { InMemoryAssetRepository } from '../../adapters/out/persistence/in-memory-asset.repository';
import { Asset, AssetStatus } from '../models/asset.model';
import { Transfer } from '../models/transfer.model';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('TransferAssetService', () => {
  let service: TransferAssetService;
  let assetRepo: InMemoryAssetRepository;
  let fakeTransferRepo: jest.Mocked<TransferRepositoryPort>;
  let fakeAssignmentRepo: jest.Mocked<AssignmentRepositoryPort>;

  beforeEach(async () => {
    fakeTransferRepo = {
      save: jest.fn().mockImplementation((t: Transfer) => Promise.resolve(t)),
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
    };

    fakeAssignmentRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferAssetService,
        { provide: AssetRepositoryPort, useClass: InMemoryAssetRepository },
        { provide: TransferRepositoryPort, useValue: fakeTransferRepo },
        { provide: AssignmentRepositoryPort, useValue: fakeAssignmentRepo },
      ],
    }).compile();

    service = module.get<TransferAssetService>(TransferAssetService);
    assetRepo = module.get<AssetRepositoryPort>(
      AssetRepositoryPort,
    ) as InMemoryAssetRepository;
  });

  it('debería registrar exitosamente una transferencia en estado Pendiente', async () => {
    const asset = new Asset(
      'asset-100',
      'QR-TRANS-01',
      'Servidor Rack HP',
      AssetStatus.OPERATIVO,
      'Oficina TI Central',
      new Date(),
    );
    await assetRepo.save(asset);

    const command = {
      assetId: 'asset-100',
      toUnit: 'Sucursal Cochabamba',
      toResponsible: 'Juan Pérez',
      date: new Date(),
      reason: 'Reasignación de proyectos',
    };

    const result = await service.execute(command);

    expect(result.assetId).toBe('asset-100');
    expect(result.toUnit).toBe('Sucursal Cochabamba');
    expect(result.toResponsible).toBe('Juan Pérez');
    expect(result.status).toBe('Pendiente');
    expect(fakeTransferRepo.save).toHaveBeenCalled();
  });

  it('debería lanzar NotFoundException si el activo no existe', async () => {
    await expect(
      service.execute({
        assetId: 'non-existent',
        toUnit: 'Unidad X',
        toResponsible: 'Pedro',
        date: new Date(),
        reason: 'Prueba',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('debería lanzar ConflictException si el activo se encuentra en estado DADO_DE_BAJA', async () => {
    const asset = new Asset(
      'asset-101',
      'QR-TRANS-02',
      'Monitor Antiguo',
      AssetStatus.DADO_DE_BAJA,
      'Almacén',
      new Date(),
    );
    await assetRepo.save(asset);

    await expect(
      service.execute({
        assetId: 'asset-101',
        toUnit: 'Sucursal B',
        toResponsible: 'María',
        date: new Date(),
        reason: 'Prueba transferencia inactivo',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
