import { Test, TestingModule } from '@nestjs/testing';
import { RejectBajaService } from './reject-baja.service.js';
import { BajaRepositoryPort } from '../ports/out/baja-repository.port.js';
import { AssetServicePort } from '../ports/out/asset-service.port.js';
import { PrismaService } from '../../adapters/out/db/prisma.service.js';
import { Baja, BajaStatus } from '../models/baja.model.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('RejectBajaService — Feature 3 (Comentario al rechazar)', () => {
  let service: RejectBajaService;
  let fakeBajaRepo: jest.Mocked<BajaRepositoryPort>;
  let fakeAssetService: jest.Mocked<AssetServicePort>;
  let fakePrisma: {
    maintenanceReport: { findFirst: jest.Mock };
  };

  const bajaIniciada = new Baja(
    'baja-uuid-1',
    'asset-uuid-1',
    'jefe-uuid-1',
    'Equipo reportado con daño en pantalla',
    'ACTA-001',
    new Date(),
    BajaStatus.INICIADA,
  );

  beforeEach(async () => {
    fakeBajaRepo = {
      save: jest.fn().mockImplementation((b) => Promise.resolve(b)),
      findById: jest.fn(),
      findByAssetId: jest.fn(),
      findPaginated: jest.fn(),
    };

    fakeAssetService = {
      getAsset: jest.fn(),
      updateAssetStatus: jest.fn(),
    };

    fakePrisma = {
      maintenanceReport: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RejectBajaService,
        { provide: BajaRepositoryPort, useValue: fakeBajaRepo },
        { provide: AssetServicePort, useValue: fakeAssetService },
        { provide: PrismaService, useValue: fakePrisma },
      ],
    }).compile();

    service = module.get<RejectBajaService>(RejectBajaService);
  });

  it('debería rechazar la baja con éxito guardando el motivo de rechazo y restaurando el activo', async () => {
    fakeBajaRepo.findById.mockResolvedValue(bajaIniciada);

    const motivo = 'El activo aún cuenta con vida útil técnica y puede ser reparado';
    const result = await service.execute('baja-uuid-1', motivo);

    expect(result.status).toBe(BajaStatus.RECHAZADA);
    expect(result.motivoRechazo).toBe(motivo);
    expect(fakeAssetService.updateAssetStatus).toHaveBeenCalledWith('asset-uuid-1', 'Dañado');
    expect(fakeBajaRepo.save).toHaveBeenCalled();
  });

  it('debería restaurar el activo a Obsoleto si el informe técnico indica obsolescencia', async () => {
    fakeBajaRepo.findById.mockResolvedValue(bajaIniciada);
    fakePrisma.maintenanceReport.findFirst.mockResolvedValue({
      diagnosis: 'Equipo en estado obsoleto pero reutilizable para repuestos',
    });

    const motivo = 'Se conservará en bodega de repuestos para contingencias';
    const result = await service.execute('baja-uuid-1', motivo);

    expect(result.status).toBe(BajaStatus.RECHAZADA);
    expect(fakeAssetService.updateAssetStatus).toHaveBeenCalledWith('asset-uuid-1', 'Obsoleto');
  });

  it('debería lanzar BadRequestException si falta el motivo de rechazo o tiene menos de 5 caracteres', async () => {
    await expect(service.execute('baja-uuid-1', '')).rejects.toThrow(BadRequestException);
    await expect(service.execute('baja-uuid-1', 'abc')).rejects.toThrow(BadRequestException);
    await expect(service.execute('baja-uuid-1', '    ')).rejects.toThrow(BadRequestException);

    expect(fakeBajaRepo.save).not.toHaveBeenCalled();
    expect(fakeAssetService.updateAssetStatus).not.toHaveBeenCalled();
  });

  it('debería lanzar NotFoundException si la baja no existe', async () => {
    fakeBajaRepo.findById.mockResolvedValue(null);

    await expect(
      service.execute('baja-inexistente', 'Motivo válido de rechazo'),
    ).rejects.toThrow(NotFoundException);

    expect(fakeBajaRepo.save).not.toHaveBeenCalled();
  });

  it('debería lanzar BadRequestException si la baja no se encuentra en estado INICIADA (ej: APROBADA)', async () => {
    const bajaAprobada = new Baja(
      'baja-uuid-2',
      'asset-uuid-2',
      'jefe-uuid-1',
      'Equipo quemado',
      'ACTA-002',
      new Date(),
      BajaStatus.APROBADA,
    );
    fakeBajaRepo.findById.mockResolvedValue(bajaAprobada);

    await expect(
      service.execute('baja-uuid-2', 'Intento de rechazo tardío'),
    ).rejects.toThrow(BadRequestException);

    expect(fakeBajaRepo.save).not.toHaveBeenCalled();
    expect(fakeAssetService.updateAssetStatus).not.toHaveBeenCalled();
  });
});
