import { Test, TestingModule } from '@nestjs/testing';
import { TransferAssetService } from './transfer-asset.service';
import { AssetStatus } from '../models/asset.model';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../compliance/adapters/out/db/prisma.service';

describe('TransferAssetService', () => {
  let service: TransferAssetService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(mockPrisma);
      }),
      $queryRaw: jest.fn(),
      asset: {
        update: jest.fn().mockResolvedValue({}),
      },
      assignment: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      transfer: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferAssetService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TransferAssetService>(TransferAssetService);
  });

  it('debería registrar exitosamente una transferencia en estado Pendiente', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        id: 'asset-100',
        name: 'Servidor Rack HP',
        status: AssetStatus.OPERATIVO,
        location: 'Oficina TI Central',
      },
    ]);

    const createdRecord = {
      id: 'trans-001',
      assetId: 'asset-100',
      fromUnit: 'Oficina TI Central',
      fromResponsible: 'Almacén',
      toUnit: 'Sucursal Cochabamba',
      toResponsible: 'Juan Pérez',
      date: new Date(),
      status: 'Pendiente',
      reason: 'Reasignación de proyectos',
    };
    mockPrisma.transfer.create.mockResolvedValue(createdRecord);

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
    expect(mockPrisma.transfer.create).toHaveBeenCalled();
  });

  it('debería lanzar NotFoundException si el activo no existe', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);

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
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        id: 'asset-101',
        name: 'Monitor Antiguo',
        status: AssetStatus.DADO_DE_BAJA,
        location: 'Almacén',
      },
    ]);

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
