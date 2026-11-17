import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ListDiagnosticosService } from './list-diagnosticos.service.js';
import { GetDiagnosticoByIdService } from './get-diagnostico-by-id.service.js';
import { DiagnosticoRepositoryPort } from '../ports/out/diagnostico-repository.port.js';
import {
  DiagnosticoTecnico,
  DiagnosticoEstado,
  CausalSabs,
  RecomendacionTecnica,
} from '../models/diagnostico-tecnico.model.js';

describe('ListDiagnosticosService & GetDiagnosticoByIdService', () => {
  let listService: ListDiagnosticosService;
  let getService: GetDiagnosticoByIdService;
  let diagnosticoRepository: jest.Mocked<DiagnosticoRepositoryPort>;

  const mockDiag = new DiagnosticoTecnico(
    'diag-uuid-1',
    'INF-TEC-2026-001',
    'asset-uuid-1',
    CausalSabs.OBSOLESCENCIA,
    'Falla irreversible',
    RecomendacionTecnica.RECOMENDAR_BAJA,
    true,
    DiagnosticoEstado.VIGENTE,
    new Date(),
  );

  beforeEach(async () => {
    const mockRepo: Partial<jest.Mocked<DiagnosticoRepositoryPort>> = {
      findAll: jest.fn().mockResolvedValue([mockDiag]),
      findById: jest.fn().mockImplementation(async (id) => (id === 'diag-uuid-1' ? mockDiag : null)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListDiagnosticosService,
        GetDiagnosticoByIdService,
        { provide: DiagnosticoRepositoryPort, useValue: mockRepo },
      ],
    }).compile();

    listService = module.get<ListDiagnosticosService>(ListDiagnosticosService);
    getService = module.get<GetDiagnosticoByIdService>(GetDiagnosticoByIdService);
    diagnosticoRepository = module.get(DiagnosticoRepositoryPort);
  });

  it('debe listar informes filtrando por estado y activo_id', async () => {
    const result = await listService.execute({
      estado: DiagnosticoEstado.VIGENTE,
      activo_id: 'asset-uuid-1',
    });

    expect(result).toHaveLength(1);
    expect(result[0].numeroInforme).toBe('INF-TEC-2026-001');
    expect(diagnosticoRepository.findAll).toHaveBeenCalledWith({
      estado: DiagnosticoEstado.VIGENTE,
      activo_id: 'asset-uuid-1',
    });
  });

  it('debe obtener un diagnóstico técnico por su ID único', async () => {
    const result = await getService.execute('diag-uuid-1');
    expect(result.id).toBe('diag-uuid-1');
    expect(result.estado).toBe(DiagnosticoEstado.VIGENTE);
  });

  it('debe lanzar NotFoundException si el diagnóstico con ese ID no existe', async () => {
    await expect(getService.execute('inexistente')).rejects.toThrow(NotFoundException);
  });
});
