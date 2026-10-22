import { Test, TestingModule } from '@nestjs/testing';
import { RegisterAssetService } from './register-asset.service';
import { AssetRepositoryPort } from '../ports/out/asset-repository.port';
import { InMemoryAssetRepository } from '../../adapters/out/persistence/in-memory-asset.repository';
import { Asset, AssetStatus } from '../models/asset.model';
import { ConflictException, BadRequestException } from '@nestjs/common';

describe('RegisterAssetService', () => {
  let service: RegisterAssetService;
  let assetRepo: InMemoryAssetRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterAssetService,
        { provide: AssetRepositoryPort, useClass: InMemoryAssetRepository },
      ],
    }).compile();

    service = module.get<RegisterAssetService>(RegisterAssetService);
    assetRepo = module.get<AssetRepositoryPort>(
      AssetRepositoryPort,
    ) as InMemoryAssetRepository;
  });

  it('debería registrar un activo exitosamente si los datos son válidos', async () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 86400000); // 1 día antes

    const command = {
      qrCode: 'QR-REG-001',
      name: 'Proyector Epson 4K',
      status: AssetStatus.NUEVO,
      location: 'Sala de Conferencias A',
      category: 'Equipos Audiovisuales',
      usefulLife: 5,
      origin: 'Compra Directa',
      purchaseDate: pastDate,
      entryDate: now,
      purchaseValue: 1500,
      warrantyMonths: 12,
      providerName: 'TechSupplier SRL',
      providerNit: '123456789',
      providerPhone: '70012345',
    };

    const result = await service.execute(command);

    expect(result.id).toBeDefined();
    expect(result.qrCode).toBe('QR-REG-001');
    expect(result.name).toBe('Proyector Epson 4K');
    expect(result.status).toBe(AssetStatus.NUEVO);
    expect(result.location).toBe('Sala de Conferencias A');
  });

  it('debería lanzar ConflictException si el código QR ya existe', async () => {
    const asset = new Asset(
      'asset-existing',
      'QR-REG-001',
      'Proyector Antiguo',
      AssetStatus.OPERATIVO,
      'Depósito',
      new Date(),
    );
    await assetRepo.save(asset);

    const now = new Date();
    const command = {
      qrCode: 'QR-REG-001',
      name: 'Nuevo Proyector',
      status: AssetStatus.NUEVO,
      location: 'Sala B',
      category: 'Audiovisuales',
      usefulLife: 5,
      origin: 'Compra',
      purchaseDate: now,
      entryDate: now,
      purchaseValue: 1000,
    };

    await expect(service.execute(command)).rejects.toThrow(ConflictException);
  });

  it('debería lanzar BadRequestException si se intenta registrar directamente en estado DANADO', async () => {
    const now = new Date();
    const command = {
      qrCode: 'QR-REG-002',
      name: 'Activo Roto',
      status: AssetStatus.DANADO,
      location: 'Depósito',
      category: 'Varios',
      usefulLife: 1,
      origin: 'Donación',
      purchaseDate: now,
      entryDate: now,
      purchaseValue: 0,
    };

    await expect(service.execute(command)).rejects.toThrow(BadRequestException);
  });

  it('debería lanzar BadRequestException si la fecha de ingreso es anterior a la fecha de compra', async () => {
    const now = new Date();
    const futurePurchase = new Date(now.getTime() + 86400000); // Mañana
    const pastEntry = new Date(now.getTime() - 86400000); // Ayer

    const command = {
      qrCode: 'QR-REG-003',
      name: 'Equipo Inconsistente',
      status: AssetStatus.NUEVO,
      location: 'Almacén',
      category: 'Varios',
      usefulLife: 3,
      origin: 'Compra',
      purchaseDate: now,
      entryDate: pastEntry,
      purchaseValue: 500,
    };

    await expect(service.execute(command)).rejects.toThrow(BadRequestException);
  });
});
