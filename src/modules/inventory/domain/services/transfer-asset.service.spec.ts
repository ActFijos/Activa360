import { Test, TestingModule } from '@nestjs/testing';
import { TransferAssetService } from './transfer-asset.service';
import { PrismaService } from '../../../compliance/adapters/out/db/prisma.service';
import { AssetStatus } from '../models/asset.model';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('TransferAssetService', () => {
  let service: TransferAssetService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(mockPrisma);
      }),
      $queryRaw: jest.fn(),
      transfer: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      asset: {
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      assignment: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      transferActa: {
        count: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
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

  describe('execute (Solicitar Transferencia)', () => {
    it('debería solicitar exitosamente una transferencia con SELECT FOR UPDATE y estado Pendiente', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          id: 'asset-100',
          name: 'Servidor Rack HP',
          status: AssetStatus.OPERATIVO,
          location: 'Oficina TI Central',
        },
      ]);

      mockPrisma.assignment.findFirst.mockResolvedValue({
        responsible: 'Juan Pérez (Custodio Anterior)',
      });

      mockPrisma.transfer.create.mockResolvedValue({
        id: 'trans-1',
        assetId: 'asset-100',
        fromUnit: 'Oficina TI Central',
        fromResponsible: 'Juan Pérez (Custodio Anterior)',
        toUnit: 'Laboratorio de Redes',
        toResponsible: 'Lic. Roberto Gómez',
        date: new Date('2026-11-17'),
        status: 'Pendiente',
        reason: 'Reasignación de equipamiento para nuevo laboratorio',
        actaCodigo: null,
        actaGenerada: false,
        actaHash: null,
      });

      mockPrisma.asset.update.mockResolvedValue({
        id: 'asset-100',
        status: 'En_Transferencia',
      });

      const result = await service.execute({
        assetId: 'asset-100',
        toUnit: 'Laboratorio de Redes',
        toResponsible: 'Lic. Roberto Gómez',
        date: new Date('2026-11-17'),
        reason: 'Reasignación de equipamiento para nuevo laboratorio',
      });

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(mockPrisma.transfer.create).toHaveBeenCalled();
      expect(mockPrisma.asset.update).toHaveBeenCalledWith({
        where: { id: 'asset-100' },
        data: { status: 'En_Transferencia' },
      });
      expect(result.id).toBe('trans-1');
      expect(result.status).toBe('Pendiente');
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

    it('debería lanzar ConflictException si el activo está DADO_DE_BAJA', async () => {
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
          reason: 'Prueba',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('approve (Aprobación y Generación Automática del Acta Bilateral SABS)', () => {
    it('debería aprobar la transferencia, bloquear pesimistamente el activo, generar correlativo ACTA-TRANS-2026-XXXX y hash SHA-256', async () => {
      const mockTransfer = {
        id: 'trans-123',
        assetId: 'asset-456',
        fromUnit: 'Almacén Central',
        fromResponsible: 'Lic. Carlos Custodio A',
        toUnit: 'Carrera de Informática',
        toResponsible: 'Ing. María Custodio B',
        date: new Date('2026-11-17'),
        status: 'Pendiente',
        reason: 'Traspaso formal de activo para soporte docente',
      };

      const mockAsset = {
        id: 'asset-456',
        qrCode: 'ACT-UMSS-INF-2026',
        name: 'Laptop Dell Latitude 5540',
        category: 'Equipo de Computación',
        status: 'En_Transferencia',
        location: 'Almacén Central',
        usefulLife: 4,
        purchaseValue: 1200.0,
      };

      mockPrisma.transfer.findUnique.mockResolvedValue(mockTransfer);
      mockPrisma.$queryRaw.mockResolvedValue([mockAsset]);
      mockPrisma.transferActa.count.mockResolvedValue(0);

      mockPrisma.transferActa.create.mockImplementation((args: any) =>
        Promise.resolve(args.data),
      );
      mockPrisma.transfer.update.mockImplementation((args: any) =>
        Promise.resolve({ ...mockTransfer, ...args.data }),
      );
      mockPrisma.asset.update.mockResolvedValue({
        id: 'asset-456',
        location: 'Carrera de Informática',
        status: 'Asignado',
      });
      mockPrisma.assignment.create.mockResolvedValue({});

      const result = await service.approve('trans-123', 'Ing. Sonia Rojas (Jefe Activos Fijos)');

      expect(result.success).toBe(true);
      expect(result.transfer.status).toBe('Aprobada');
      expect(result.transfer.actaGenerada).toBe(true);
      expect(result.transfer.actaCodigo).toMatch(/^ACTA-TRANS-2026-\d{4}$/);
      expect(result.acta.codigo).toBe(result.transfer.actaCodigo);

      // Verificación de integridad SHA-256 (64 caracteres hexadecimales)
      expect(result.acta.hashIntegridad).toMatch(/^[a-f0-9]{64}$/);
      expect(result.transfer.actaHash).toBe(result.acta.hashIntegridad);

      // Verificación de snapshots
      expect(result.acta.activoSnapshot.qrCode).toBe('ACT-UMSS-INF-2026');
      expect(result.acta.origenSnapshot.responsible).toBe('Lic. Carlos Custodio A');
      expect(result.acta.destinoSnapshot.responsible).toBe('Ing. María Custodio B');

      // Verificación de actualización en base de datos
      expect(mockPrisma.transferActa.create).toHaveBeenCalled();
      expect(mockPrisma.asset.update).toHaveBeenCalledWith({
        where: { id: 'asset-456' },
        data: {
          location: 'Carrera de Informática',
          status: 'Asignado',
        },
      });
      expect(mockPrisma.assignment.create).toHaveBeenCalled();
    });

    it('debería lanzar NotFoundException si la transferencia no existe al aprobar', async () => {
      mockPrisma.transfer.findUnique.mockResolvedValue(null);

      await expect(service.approve('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería lanzar ConflictException si la transferencia ya fue aprobada previamente', async () => {
      mockPrisma.transfer.findUnique.mockResolvedValue({
        id: 'trans-already-approved',
        status: 'Aprobada',
      });

      await expect(service.approve('trans-already-approved')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getActa (Consulta de Acta Bilateral)', () => {
    it('debería retornar el acta si ya fue generada previamente', async () => {
      const mockActa = {
        id: 'acta-1',
        transferId: 'trans-123',
        codigo: 'ACTA-TRANS-2026-0001',
        fechaEmision: new Date('2026-11-17'),
        hashIntegridad: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        activoSnapshot: {
          qrCode: 'ACT-UMSS-INF-2026',
          name: 'Laptop Dell Latitude 5540',
        },
        origenSnapshot: {
          responsible: 'Lic. Carlos Custodio A',
          unit: 'Almacén Central',
        },
        destinoSnapshot: {
          responsible: 'Ing. María Custodio B',
          unit: 'Carrera de Informática',
        },
        observaciones: 'Acta formalizada según Normativa SABS D.S. 0181',
        generadoPor: 'Sistema SCAF',
      };

      mockPrisma.transferActa.findUnique.mockResolvedValue(mockActa);

      const result = await service.getActa('trans-123');

      expect(result.codigo).toBe('ACTA-TRANS-2026-0001');
      expect(result.hashIntegridad).toBe(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      );
    });

    it('debería lanzar NotFoundException si la transferencia no existe', async () => {
      mockPrisma.transferActa.findUnique.mockResolvedValue(null);
      mockPrisma.transfer.findUnique.mockResolvedValue(null);

      await expect(service.getActa('trans-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
