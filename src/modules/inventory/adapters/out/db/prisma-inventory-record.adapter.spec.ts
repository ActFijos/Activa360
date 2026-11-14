import { Test, TestingModule } from '@nestjs/testing';
import { PrismaInventoryRecordAdapter } from './prisma-inventory-record.adapter';
import { PrismaService } from '../../../../compliance/adapters/out/db/prisma.service';
import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('PrismaInventoryRecordAdapter', () => {
  let adapter: PrismaInventoryRecordAdapter;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      inventoryRecord: {
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaInventoryRecordAdapter,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    adapter = module.get<PrismaInventoryRecordAdapter>(
      PrismaInventoryRecordAdapter,
    );
  });

  describe('register', () => {
    it('debería registrar un escaneo de inventario exitosamente', async () => {
      const now = new Date();
      mockPrisma.inventoryRecord.create.mockResolvedValue({
        id: 'rec-001',
        campaignId: 'camp-123',
        assetId: 'asset-456',
        userId: 'user-789',
        createdAt: now,
      });

      const result = await adapter.register('camp-123', 'asset-456', 'user-789');

      expect(result.id).toBe('rec-001');
      expect(result.campaignId).toBe('camp-123');
      expect(result.assetId).toBe('asset-456');
      expect(result.userId).toBe('user-789');
      expect(mockPrisma.inventoryRecord.create).toHaveBeenCalledWith({
        data: {
          campaignId: 'camp-123',
          assetId: 'asset-456',
          userId: 'user-789',
        },
      });
    });

    it('debería lanzar ConflictException (409) ante violación UNIQUE P2002', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`campaignId`,`assetId`)',
        {
          code: 'P2002',
          clientVersion: '7.8.0',
        },
      );

      mockPrisma.inventoryRecord.create.mockRejectedValue(prismaError);

      await expect(
        adapter.register('camp-123', 'asset-456', 'user-789'),
      ).rejects.toThrow(ConflictException);
    });

    it('debería relanzar otros errores no controlados', async () => {
      const genericError = new Error('Database connection lost');
      mockPrisma.inventoryRecord.create.mockRejectedValue(genericError);

      await expect(
        adapter.register('camp-123', 'asset-456', 'user-789'),
      ).rejects.toThrow('Database connection lost');
    });
  });

  describe('existsRecord', () => {
    it('debería retornar true si el registro existe', async () => {
      mockPrisma.inventoryRecord.count.mockResolvedValue(1);

      const exists = await adapter.existsRecord('camp-123', 'asset-456');
      expect(exists).toBe(true);
      expect(mockPrisma.inventoryRecord.count).toHaveBeenCalledWith({
        where: { campaignId: 'camp-123', assetId: 'asset-456' },
      });
    });

    it('debería retornar false si el registro no existe', async () => {
      mockPrisma.inventoryRecord.count.mockResolvedValue(0);

      const exists = await adapter.existsRecord('camp-123', 'asset-456');
      expect(exists).toBe(false);
    });
  });

  describe('findByCampaignId y countByCampaignId', () => {
    it('debería listar los registros por campaignId ordenados por fecha desc', async () => {
      const now = new Date();
      mockPrisma.inventoryRecord.findMany.mockResolvedValue([
        {
          id: 'rec-001',
          campaignId: 'camp-123',
          assetId: 'asset-456',
          userId: 'user-789',
          createdAt: now,
        },
      ]);

      const records = await adapter.findByCampaignId('camp-123');
      expect(records).toHaveLength(1);
      expect(records[0].id).toBe('rec-001');
    });

    it('debería contar los registros por campaignId', async () => {
      mockPrisma.inventoryRecord.count.mockResolvedValue(42);

      const count = await adapter.countByCampaignId('camp-123');
      expect(count).toBe(42);
    });
  });
});
