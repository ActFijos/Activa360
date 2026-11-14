import { Test, TestingModule } from '@nestjs/testing';
import { RegisterInventoryScanService } from './register-inventory-scan.service.js';
import { InventoryRecordRepositoryPort } from '../ports/out/inventory-record-repository.port.js';
import { AssetRepositoryPort } from '../ports/out/asset-repository.port.js';
import { InventoryRecord } from '../models/inventory-record.model.js';
import { Asset, AssetStatus } from '../models/asset.model.js';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('RegisterInventoryScanService', () => {
  let service: RegisterInventoryScanService;
  let mockRecordRepo: jest.Mocked<InventoryRecordRepositoryPort>;
  let mockAssetRepo: jest.Mocked<AssetRepositoryPort>;

  beforeEach(async () => {
    mockRecordRepo = {
      register: jest.fn(),
      existsRecord: jest.fn(),
    };

    mockAssetRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByQrCode: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterInventoryScanService,
        {
          provide: InventoryRecordRepositoryPort,
          useValue: mockRecordRepo,
        },
        {
          provide: AssetRepositoryPort,
          useValue: mockAssetRepo,
        },
      ],
    }).compile();

    service = module.get<RegisterInventoryScanService>(
      RegisterInventoryScanService,
    );
  });

  it('debería registrar un escaneo exitoso cuando el activo existe', async () => {
    const asset = new Asset(
      'asset-1',
      'QR-001',
      'Laptop HP',
      AssetStatus.OPERATIVO,
      'Piso 1',
      new Date(),
    );
    mockAssetRepo.findById.mockResolvedValue(asset);

    const record = new InventoryRecord(
      'rec-1',
      'camp-1',
      'asset-1',
      'user-1',
      new Date(),
    );
    mockRecordRepo.register.mockResolvedValue(record);

    const result = await service.execute({
      campaignId: 'camp-1',
      assetId: 'asset-1',
      userId: 'user-1',
    });

    expect(result.id).toBe('rec-1');
    expect(mockRecordRepo.register).toHaveBeenCalledWith(
      'camp-1',
      'asset-1',
      'user-1',
    );
  });

  it('debería lanzar NotFoundException si el activo no existe', async () => {
    mockAssetRepo.findById.mockResolvedValue(null);

    await expect(
      service.execute({
        campaignId: 'camp-1',
        assetId: 'non-existent',
        userId: 'user-1',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('debería relanzar ConflictException si ya fue registrado previamente en la campaña', async () => {
    const asset = new Asset(
      'asset-1',
      'QR-001',
      'Laptop HP',
      AssetStatus.OPERATIVO,
      'Piso 1',
      new Date(),
    );
    mockAssetRepo.findById.mockResolvedValue(asset);
    mockRecordRepo.register.mockRejectedValue(
      new ConflictException('El activo ya fue registrado'),
    );

    await expect(
      service.execute({
        campaignId: 'camp-1',
        assetId: 'asset-1',
        userId: 'user-1',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
