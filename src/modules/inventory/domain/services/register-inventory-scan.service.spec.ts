import { Test, TestingModule } from '@nestjs/testing';
import { RegisterInventoryScanService } from './register-inventory-scan.service';
import { InventoryRecordRepositoryPort } from '../ports/out/inventory-record-repository.port';
import { AssetRepositoryPort } from '../ports/out/asset-repository.port';
import { InventoryCampaignRepositoryPort } from '../ports/out/inventory-campaign-repository.port';
import { InventoryRecord } from '../models/inventory-record.model';
import { Asset, AssetStatus } from '../models/asset.model';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('RegisterInventoryScanService', () => {
  let service: RegisterInventoryScanService;
  let mockRecordRepo: jest.Mocked<InventoryRecordRepositoryPort>;
  let mockAssetRepo: jest.Mocked<AssetRepositoryPort>;
  let mockCampaignRepo: jest.Mocked<InventoryCampaignRepositoryPort>;

  beforeEach(async () => {
    mockRecordRepo = {
      register: jest.fn(),
      existsRecord: jest.fn(),
      findByCampaignId: jest.fn(),
      countByCampaignId: jest.fn(),
    };

    mockAssetRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByQrCode: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };

    mockCampaignRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      close: jest.fn(),
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
        {
          provide: InventoryCampaignRepositoryPort,
          useValue: mockCampaignRepo,
        },
      ],
    }).compile();

    service = module.get<RegisterInventoryScanService>(
      RegisterInventoryScanService,
    );
  });

  it('debería registrar un escaneo exitoso cuando el activo existe y la campaña está activa', async () => {
    const asset = new Asset(
      'asset-1',
      'QR-001',
      'Laptop HP',
      AssetStatus.OPERATIVO,
      'Piso 1',
      new Date(),
    );
    mockAssetRepo.findById.mockResolvedValue(asset);
    mockCampaignRepo.findById.mockResolvedValue({
      id: 'camp-1',
      name: 'Campaña 2026',
      startDate: new Date(),
      endDate: null,
      isActive: true,
    } as any);

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

  it('debería lanzar ConflictException si la campaña ya fue cerrada', async () => {
    const asset = new Asset(
      'asset-1',
      'QR-001',
      'Laptop HP',
      AssetStatus.OPERATIVO,
      'Piso 1',
      new Date(),
    );
    mockAssetRepo.findById.mockResolvedValue(asset);
    mockCampaignRepo.findById.mockResolvedValue({
      id: 'camp-1',
      name: 'Campaña Cerrada',
      startDate: new Date(),
      endDate: new Date(),
      isActive: false,
    } as any);

    await expect(
      service.execute({
        campaignId: 'camp-1',
        assetId: 'asset-1',
        userId: 'user-1',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
