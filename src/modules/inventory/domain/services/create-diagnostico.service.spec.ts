import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateDiagnosticoService } from './create-diagnostico.service.js';
import { DiagnosticoRepositoryPort } from '../ports/out/diagnostico-repository.port.js';
import { AssetRepositoryPort } from '../ports/out/asset-repository.port.js';
import { Asset, AssetStatus } from '../models/asset.model.js';
import {
  DiagnosticoTecnico,
  DiagnosticoEstado,
  CausalSabs,
  RecomendacionTecnica,
} from '../models/diagnostico-tecnico.model.js';

describe('CreateDiagnosticoService (Feature 2: Diagnóstico Técnico Previo a Bajas SABS)', () => {
  let service: CreateDiagnosticoService;
  let diagnosticoRepository: jest.Mocked<DiagnosticoRepositoryPort>;
  let assetRepository: jest.Mocked<AssetRepositoryPort>;

  const mockAsset = new Asset(
    'asset-uuid-1',
    'ACT-2026-001',
    'Servidor Dell PowerEdge',
    AssetStatus.EN_DIAGNOSTICO,
    'Data Center Central',
    new Date(),
  );

  beforeEach(async () => {
    const mockDiagRepo: Partial<jest.Mocked<DiagnosticoRepositoryPort>> = {
      save: jest.fn().mockImplementation(async (d) => d),
      findByNumeroInforme: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
    };

    const mockAssetRepo: Partial<jest.Mocked<AssetRepositoryPort>> = {
      findById: jest.fn(),
      save: jest.fn().mockImplementation(async (a) => a),
      recordStatusChange: jest.fn().mockImplementation(async (h) => h),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateDiagnosticoService,
        { provide: DiagnosticoRepositoryPort, useValue: mockDiagRepo },
        { provide: AssetRepositoryPort, useValue: mockAssetRepo },
      ],
    }).compile();

    service = module.get<CreateDiagnosticoService>(CreateDiagnosticoService);
    diagnosticoRepository = module.get(DiagnosticoRepositoryPort);
    assetRepository = module.get(AssetRepositoryPort);
  });

  it('debe emitir informe técnico, dejarlo en estado VIGENTE y transicionar activo a APTO_PARA_BAJA si dictamina baja', async () => {
    assetRepository.findById.mockResolvedValueOnce(
      new Asset(
        mockAsset.id,
        mockAsset.qrCode,
        mockAsset.name,
        AssetStatus.EN_DIAGNOSTICO,
        mockAsset.location,
        mockAsset.updatedAt,
      ),
    );
    diagnosticoRepository.findByNumeroInforme.mockResolvedValueOnce(null);

    const result = await service.execute({
      assetId: 'asset-uuid-1',
      numeroInforme: 'INF-TEC-2026-001',
      causalSabs: CausalSabs.OBSOLESCENCIA,
      diagnosticoDetalle: 'Fallo irreparable de placa base y componentes discontinuados',
      recomendacion: RecomendacionTecnica.RECOMENDAR_BAJA,
      dictaminaBaja: true,
      tecnicoNombre: 'Ing. Carlos Meneses',
      evidenciaDocumento: 'https://docs.activa360.gob.bo/inf-001.pdf',
    });

    expect(result.estado).toBe(DiagnosticoEstado.VIGENTE);
    expect(result.numeroInforme).toBe('INF-TEC-2026-001');
    expect(diagnosticoRepository.save).toHaveBeenCalled();
    expect(assetRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: AssetStatus.APTO_PARA_BAJA,
      }),
    );
    expect(assetRepository.recordStatusChange).toHaveBeenCalledWith(
      expect.objectContaining({
        assetId: 'asset-uuid-1',
        newStatus: AssetStatus.APTO_PARA_BAJA,
      }),
    );
  });

  it('no debe transicionar el activo a APTO_PARA_BAJA si el informe no dictamina baja', async () => {
    assetRepository.findById.mockResolvedValueOnce(
      new Asset(
        mockAsset.id,
        mockAsset.qrCode,
        mockAsset.name,
        AssetStatus.EN_MANTENIMIENTO,
        mockAsset.location,
        mockAsset.updatedAt,
      ),
    );
    diagnosticoRepository.findByNumeroInforme.mockResolvedValueOnce(null);

    const result = await service.execute({
      assetId: 'asset-uuid-1',
      numeroInforme: 'INF-TEC-2026-002',
      causalSabs: CausalSabs.DETERIORO_IRREPARABLE,
      diagnosticoDetalle: 'Mantenimiento preventivo rutinario y cambio de pasta térmica',
      recomendacion: RecomendacionTecnica.REPARAR,
      dictaminaBaja: false,
    });

    expect(result.estado).toBe(DiagnosticoEstado.VIGENTE);
    expect(assetRepository.save).not.toHaveBeenCalled();
  });

  it('debe lanzar ConflictException si el número de informe técnico ya se encuentra registrado', async () => {
    assetRepository.findById.mockResolvedValueOnce(mockAsset);
    diagnosticoRepository.findByNumeroInforme.mockResolvedValueOnce(
      new DiagnosticoTecnico(
        'diag-1',
        'INF-TEC-2026-001',
        'asset-uuid-1',
        CausalSabs.OBSOLESCENCIA,
        'Detalle',
        RecomendacionTecnica.RECOMENDAR_BAJA,
        true,
        DiagnosticoEstado.VIGENTE,
        new Date(),
      ),
    );

    await expect(
      service.execute({
        assetId: 'asset-uuid-1',
        numeroInforme: 'INF-TEC-2026-001',
        causalSabs: CausalSabs.OBSOLESCENCIA,
        diagnosticoDetalle: 'Detalle técnico pericial',
        recomendacion: RecomendacionTecnica.RECOMENDAR_BAJA,
        dictaminaBaja: true,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('debe lanzar ConflictException si el activo ya se encuentra Dado_De_Baja', async () => {
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
        numeroInforme: 'INF-TEC-2026-003',
        causalSabs: CausalSabs.OBSOLESCENCIA,
        diagnosticoDetalle: 'Evaluación técnica posterior a baja',
        recomendacion: RecomendacionTecnica.RECOMENDAR_BAJA,
        dictaminaBaja: true,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('debe lanzar NotFoundException si el activo no existe', async () => {
    assetRepository.findById.mockResolvedValueOnce(null);

    await expect(
      service.execute({
        assetId: 'inexistente',
        numeroInforme: 'INF-TEC-2026-004',
        causalSabs: CausalSabs.OBSOLESCENCIA,
        diagnosticoDetalle: 'Evaluación técnica de activo inexistente',
        recomendacion: RecomendacionTecnica.RECOMENDAR_BAJA,
        dictaminaBaja: true,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
