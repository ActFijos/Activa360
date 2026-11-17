import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ChangeAssetStatusService } from './change-asset-status.service.js';
import { AssetRepositoryPort } from '../ports/out/asset-repository.port.js';
import { Asset, AssetStatus } from '../models/asset.model.js';
import { AssetStatusHistory } from '../models/asset-status-history.model.js';

describe('ChangeAssetStatusService (Feature 1: Control de Estados Patrimoniales SABS)', () => {
  let service: ChangeAssetStatusService;
  let assetRepository: jest.Mocked<AssetRepositoryPort>;

  const mockAsset = new Asset(
    'asset-uuid-1',
    'ACT-2026-001',
    'Servidor Dell PowerEdge',
    AssetStatus.DISPONIBLE,
    'Data Center Central',
    new Date(),
    'Equipos de Computación',
    5,
    'Compra',
    new Date('2026-01-15'),
    new Date('2026-01-20'),
    3500,
  );

  beforeEach(async () => {
    const mockRepo: Partial<jest.Mocked<AssetRepositoryPort>> = {
      findById: jest.fn(),
      findByIdWithHistory: jest.fn(),
      save: jest.fn().mockImplementation(async (a) => a),
      recordStatusChange: jest.fn().mockImplementation(async (h) => h),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangeAssetStatusService,
        { provide: AssetRepositoryPort, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ChangeAssetStatusService>(ChangeAssetStatusService);
    assetRepository = module.get(AssetRepositoryPort);
  });

  it('debe ejecutar una transición permitida de DISPONIBLE a EN_DIAGNOSTICO y registrar trazabilidad', async () => {
    assetRepository.findById.mockResolvedValueOnce(
      new Asset(
        mockAsset.id,
        mockAsset.qrCode,
        mockAsset.name,
        AssetStatus.DISPONIBLE,
        mockAsset.location,
        mockAsset.updatedAt,
      ),
    );

    const result = await service.execute({
      assetId: 'asset-uuid-1',
      nuevoEstado: AssetStatus.EN_DIAGNOSTICO,
      motivo: 'Envío de activo a evaluación técnica por peritaje SABS',
      responsable: 'Lic. Josefina Rojas',
    });

    expect(result.status).toBe(AssetStatus.EN_DIAGNOSTICO);
    expect(assetRepository.save).toHaveBeenCalled();
    expect(assetRepository.recordStatusChange).toHaveBeenCalledWith(
      expect.objectContaining({
        assetId: 'asset-uuid-1',
        previousStatus: AssetStatus.DISPONIBLE,
        newStatus: AssetStatus.EN_DIAGNOSTICO,
        reason: 'Envío de activo a evaluación técnica por peritaje SABS',
        changedBy: 'Lic. Josefina Rojas',
      }),
    );
  });

  it('debe rechazar transiciones desde el estado terminal DADO_DE_BAJA con ConflictException', async () => {
    assetRepository.findById.mockResolvedValueOnce(
      new Asset(
        mockAsset.id,
        mockAsset.qrCode,
        mockAsset.name,
        AssetStatus.DADO_DE_BAJA,
        mockAsset.location,
        mockAsset.updatedAt,
      ),
    );

    await expect(
      service.execute({
        assetId: 'asset-uuid-1',
        nuevoEstado: AssetStatus.DISPONIBLE,
        motivo: 'Intento de reactivación indebida de bien dado de baja',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('debe rechazar transiciones no permitidas por la matriz normativa SABS con ConflictException', async () => {
    assetRepository.findById.mockResolvedValueOnce(
      new Asset(
        mockAsset.id,
        mockAsset.qrCode,
        mockAsset.name,
        AssetStatus.ASIGNADO,
        mockAsset.location,
        mockAsset.updatedAt,
      ),
    );

    // No se permite saltar de ASIGNADO directamente a DADO_DE_BAJA sin trámite previo
    await expect(
      service.execute({
        assetId: 'asset-uuid-1',
        nuevoEstado: 'Dado_De_Baja',
        motivo: 'Intento de baja directa sin proceso SABS ni informe técnico',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('debe lanzar BadRequestException si el motivo de la transición tiene menos de 5 caracteres', async () => {
    await expect(
      service.execute({
        assetId: 'asset-uuid-1',
        nuevoEstado: AssetStatus.EN_MANTENIMIENTO,
        motivo: 'F', // Menor a 5 caracteres
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('debe lanzar NotFoundException si el activo no existe en la base de datos', async () => {
    assetRepository.findById.mockResolvedValueOnce(null);

    await expect(
      service.execute({
        assetId: 'inexistente',
        nuevoEstado: AssetStatus.EN_MANTENIMIENTO,
        motivo: 'Revisión técnica de mantenimiento preventivo',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
